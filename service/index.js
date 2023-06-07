/*
 * @Descripttion :
 * @version      : 1.0.0
 * @Author       :
 * @Date         : 2023-05-11 09:46:59
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-07 16:06:04
 */
import { ethers } from 'ethers'
import ContractABI from '../abi/pair.js';
import InfomationABI from '../abi/Information.js';
import nodeSchedule from 'node-schedule'
import { batchUpdate, batchInsertPair, updateStartBlock, findDiffPair, updatePair, batchUpdatePairInfo } from '../db/baseAction.js';
const iface = new ethers.utils.Interface(ContractABI);

class PoolSerice {
  constructor(rpc, Model, BlockModel, EzswapPoolModel, startBlock, pairFactoryAddress, PoolDataContractAddress, mode) {
    try {
      this.provider = new ethers.providers.WebSocketProvider(rpc);
    } catch (error) {
      console.log('wsError', error);
      setTimeout(() => {
        this.provider = new ethers.providers.WebSocketProvider(rpc);
      }, 2000)
    }
    this.startBlock = startBlock
    this.endBlock = startBlock + 1000
    this.Model = Model
    this.BlockModel = BlockModel
    this.EzswapPoolModel = EzswapPoolModel
    this.pairFactoryAddress = pairFactoryAddress
    this.pairFactoryContract = new ethers.Contract(pairFactoryAddress, ContractABI, this.provider);
    this.getPoolDataContract = new ethers.Contract(PoolDataContractAddress, InfomationABI, this.provider);
    this.mode = mode
    this.pairqueue = []
    this.pairprocessing = false
    this.pairuniqueSet = new Set()
    this.job = null
  }

  async pairadd (address) {
    // todo 这里有异步操作吗?这队列看起来永远一进一出么
    this.pairqueue.push(address)
    if (!this.pairprocessing) {
      this.pairprocessQueue()
    }
  }

  async pairprocessQueue () {
    this.pairprocessing = true
    while (this.pairqueue.length) {
      try {
        const chunkAddress = this.pairqueue.splice(0, this.pairqueue.length > 100 ? 100 : this.pairqueue.length);
        // todo 看完了代码,这个有点疑问,这个插入的status值默认是synced.synced不是处理完毕么,那追区块时候的pool不会在定时任务时插入数据库吧
        await batchInsertPair(this.Model, chunkAddress, this.mode)
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.log('error', error)
      }
    }
    this.pairprocessing = false
  }

  // 更新pool信息
  async getPoolData (poolAddresslist) {
    console.log('poolAddresslist', poolAddresslist)
    try {
      let result = null;
      result = await this.getPoolDataContract.getMultiInfo(poolAddresslist.map(item => item.pair_address))
      return result.map((item, index) => {
        var timestamp = new Date().getTime();
        return {
          id: poolAddresslist[index].pair_address,
          collection: item.collection,
          owner: item.owner,
          token: item.token === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? null : item.token,
          type: item.poolType,
          asset_recipient: item.assetRecipient,
          bonding_curve: item.bondingCurve,
          delta: item.delta.toString(),
          fee: item.fee.toString(),
          spot_price: item.spotPrice.toString(),
          eth_balance: item.token === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? item.tokenBalance.toString() : null,
          token_balance: item.token !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? item.tokenBalance.toString() : null,
          nft_count: item.nftCount.toString(),
          mode: this.mode,
          nft_ids: item.nftIds.join(","),
          from_platform: 1,
          is1155: item.is1155,
          collection_name: item.name721,
          nft_id1155: item.nftId1155.toString(),
          nft_count1155: item.nftCount1155.toString(),
          token_type: item.is1155 ? 'ERC1155' : 'ERC721',
          create_timestamp: Math.floor(timestamp / 1000),
          update_timestamp: Math.floor(timestamp / 1000)
        }
      })
    } catch (error) {
      console.log(error);
    }
  }
  // 更新pair地址列表
  async updatePairList () {
    const { provider, startBlock, endBlock, pairFactoryAddress, BlockModel } = this
    const filter = {
      address: pairFactoryAddress,
      fromBlock: startBlock,
      toBlock: endBlock,
      topics: [iface.getEventTopic('NewPair')]
    };
    provider.getLogs(filter).then(async (logs) => {
      console.log('logs', logs)
      logs.forEach((log) => {
        /** todo  这里可以改成循环查出所有的address,然后用bulkCreate一次性插入,性能会高非常多,强烈建议修改.也不需要后续使用队列了
                  例如:这里需要循环1w次,现在的写法每次都需要链接数据库,写入,断开.连接池写法是获取连接,写入,讲连接归还链接池,如此循环1w次,也可能造成连接池堵塞 时间复杂度 O(n) 空间复杂度O(1)
                  但是使用bulkCreate的话,只会一次获取连接,写入,归还连接的操作 时间复杂度 O(1) 空间复杂度O(n) 为了防止触发sql字节上限,可以规定一次插入1K数据(理论上会,实际上很难达到)
                  空间复杂度可以不用考虑,就算是1w条数据,实际上数据也很少 sql的要求:时间复杂度 >> 空间复杂度.不管多复杂的业务,sql都需要在几毫秒内完成
         **/
        const parsedLog = iface.parseLog(log);
        this.pairadd(parsedLog.args.poolAddress)
      });
      const blockNumber = await provider.getBlockNumber();
      if (this.endBlock === 'latest') {
        this.startSyncBlock()
      } else if (this.startBlock + 1000 > blockNumber) {
        this.endBlock = 'latest'
        setTimeout(() => {
          // todo 这个是递归调用吧,堆栈深度受得了吗? 用while更好吧
          this.updatePairList()
        }, 1000)
      } else {
        this.startBlock = startBlock + 1000
        this.endBlock = this.startBlock + 1000
        setTimeout(() => {
          this.updatePairList()
        }, 1000)
      }
      // todo 这边有问题吧,在同步区块的时候,会递归进入updatePairList,走不到这里,必须要完全同步好之后才会走到这里吧
      await updateStartBlock(BlockModel, startBlock, this.mode)
    }).catch((err) => {
      setTimeout(() => {
        this.updatePairList()
      }, 1000)
    });
  }
  // 开始同步区块
  async startSyncBlock () {
    const { provider, startBlock, endBlock, pairFactoryAddress, BlockModel } = this
    const filter = {
      address: pairFactoryAddress,
      fromBlock: startBlock,
      toBlock: endBlock,
      topics: [iface.getEventTopic('NewPair')]
    };
    try {
      provider.on("block", async (blockNumber) => {
        const filter = {
          fromBlock: blockNumber,
          toBlock: blockNumber,
          address: pairFactoryAddress,
          topics: [iface.getEventTopic('NewPair')]
        };
        const filterTx = {
          fromBlock: blockNumber,
          toBlock: blockNumber
        };
        const logs = await provider.getLogs(filter);
        const txs = await provider.getLogs(filterTx);
        if (logs.length > 0) {
          // 有新的pair
          logs.forEach((log) => {
            // pair入库
            const parsedLog = iface.parseLog(log);
            this.pairadd(parsedLog.args.poolAddress)
          });
        }
        console.log('blockNumber', blockNumber)
        // 更新pool索引
        await batchUpdate(this.Model, txs.map((tx) => tx.address), this.mode)
        await updateStartBlock(BlockModel, blockNumber, this.mode)
      });
      provider.on("error", async (blockNumber) => {
        console.log('error', blockNumber)
      });
    } catch (error) {
      console.log('同步error', error)
      this.start()
    }
  }
  // 处理pair信息更新
  async updatePairInfo () {
    const { Model } = this
    let addlist = []
    let pairprocessing = false
    let rule = new nodeSchedule.RecurrenceRule();
    rule.second = [0, 10, 20, 30, 40, 50]; //
    const chunkSize = 10;
    const delay = 1000;
    const processData = async (data) => {
      const list = await this.getPoolData(data)
      console.log('listlist', list)
      // todo 这里就属于索引开错地方了,要在这里开启索引,updatePair后才关闭索引.
      await batchUpdatePairInfo(this.EzswapPoolModel, list, this.mode)
      // todo 可以试试在这里写个 let a=1/0 看看上面的代码会不会成功插入
      const _result = await updatePair(Model, data, this.mode)
      console.log('更新成功', _result)
      // todo 为什么不把处理完的addlist弹出?
    }
    async function processArray (array) {
      addlist = addlist.concat(array)
      if (!pairprocessing) {
        pairprocessing = true
        while (addlist.length) {
          const chunk = addlist.splice(0, addlist.length > 9 ? 10 : addlist.length);
          processData(chunk);
          await new Promise(resolve => setTimeout(resolve, delay)); // Wait for 'delay' milliseconds before continuing
        }
        pairprocessing = false
      }
    }
    if (this.job) {
      this.job.cancel()
    }
    let job = nodeSchedule.scheduleJob(rule, async () => {
      try {
        const list = await findDiffPair(Model, this.mode)
        console.log('list', list)
        processArray(list)
      } catch (error) {
        console.log('error', error)
      }
    });
  }
  // 开始
  async start () {
    this.provider._websocket.on("error", async (error) => {
      this.provider._websocket.terminate();
      setTimeout(() => {
        this.start()
      }, 3000);
    });
    this.provider._websocket.on("close", async () => {
      this.provider._websocket.terminate();
      setTimeout(() => {
        this.start()
      }, 3000);
    });
    this.updatePairList()
    this.updatePairInfo()
  }
}


export default PoolSerice;
