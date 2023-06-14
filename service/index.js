/*
 * @Descripttion :
 * @version      : 1.0.0
 * @Author       :
 * @Date         : 2023-05-11 09:46:59
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-14 22:57:08
 */
import { ethers } from 'ethers'
import ContractABI from '../abi/pair.js';
import InfomationABI from '../abi/Information.js';
import nodeSchedule from 'node-schedule'
import { batchUpdate, batchInsertPair, updateStartBlock, findDiffPair, updatePair, batchUpdatePairInfo, batchGetPairInfo, getStartBlock } from '../db/baseAction.js';
const iface = new ethers.utils.Interface(ContractABI);

class PoolSerice {
  constructor(rpc, Model, BlockModel, EzswapPoolModel, startBlock, pairFactoryAddress, PoolDataContractAddress, mode) {
    this.rpc = rpc
    this.startBlock = startBlock
    this.endBlock = startBlock + 1000
    this.Model = Model
    this.BlockModel = BlockModel
    this.EzswapPoolModel = EzswapPoolModel
    this.pairFactoryAddress = pairFactoryAddress
    this.provider = new ethers.providers.WebSocketProvider(this.rpc);
    this.pairFactoryContract = new ethers.Contract(pairFactoryAddress, ContractABI, this.provider);
    this.PoolDataContractAddress = PoolDataContractAddress
    this.getPoolDataContract = new ethers.Contract(PoolDataContractAddress, InfomationABI, this.provider);
    this.mode = mode
    this.pairqueue = []
    this.pairprocessing = false
    this.pairuniqueSet = new Set()
    this.job = null
    this.status = 'sync'
  }

  async pairadd (address) {
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
        await batchInsertPair(this.Model, chunkAddress, this.mode)
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.log('batchInsertPairerror', error)
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
          update_timestamp: Math.floor(timestamp / 1000),
          eth_volume: 0,
        }
      }) || []
    } catch (error) {
      console.log('getPoolData', error);
    }
  }
  // 更新pair地址列表
  async updatePairList () {
    const { provider, startBlock, endBlock, pairFactoryAddress, BlockModel } = this
    this.status = 'sync'
    console.log('updatePairList', 'startBlock', startBlock, 'endBlock', endBlock)
    const filter = {
      address: pairFactoryAddress,
      fromBlock: startBlock,
      toBlock: endBlock,
      topics: [iface.getEventTopic('NewPair')]
    };
    provider.getLogs(filter).then(async (logs) => {
      console.log('获取logs长度', logs.length)
      logs.forEach((log) => {
        const parsedLog = iface.parseLog(log);
        this.pairadd(parsedLog.args.poolAddress)
      });
      const blockNumber = await provider.getBlockNumber();
      if (this.endBlock === 'latest') {
        this.startSyncBlock()
      } else if (this.startBlock + 1000 > blockNumber) {
        this.endBlock = 'latest'
        setTimeout(() => {
          this.updatePairList()
        }, 1000)
      } else {
        this.startBlock = startBlock + 1000
        this.endBlock = this.startBlock + 1000
        setTimeout(() => {
          this.updatePairList()
        }, 1000)
      }
      await updateStartBlock(BlockModel, startBlock, this.mode)
    }).catch((err) => {
      console.log('updatePairListerr', err)
      setTimeout(() => {
        this.updatePairList()
      }, 1000)
    });
  }
  // 开始同步区块
  async startSyncBlock () {
    this.status = 'asyncLog'
    const { provider, startBlock, endBlock, pairFactoryAddress, BlockModel } = this
    console.log('removeAllListeners', '先移除所有监听器，防止重复监听')
    provider.removeAllListeners();
    const filter = {
      address: pairFactoryAddress,
      fromBlock: startBlock,
      toBlock: endBlock,
      topics: [iface.getEventTopic('NewPair')]
    };
    try {
      let _sub = provider.on("block", async (blockNumber) => {
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
        try {
          await batchUpdate(this.Model, txs.map((tx) => tx.address), this.mode)
          await updateStartBlock(BlockModel, blockNumber, this.mode)
          this.status = 'asyncLog'
        } catch (error) {
          console.log('因为batchUpdate或updateStartBlock出现错误而重新开始程序')
          this.start()
        }
      });
    } catch (error) {
      console.log('因为同步区块出现错误而重新开始程序')
      this.start()
    }
  }
  // 处理pair信息更新
  async updatePairInfo () {
    const { Model, BlockModel, mode, provider } = this
    let addlist = []
    let pairprocessing = false
    let rule = new nodeSchedule.RecurrenceRule();
    rule.second = [0, 10, 20, 30, 40, 50]; //
    const chunkSize = 10;
    const delay = 1000;
    const processData = async (data) => {
      const _ethvollist = await batchGetPairInfo(this.EzswapPoolModel, data)
      const list = await this.getPoolData(data)
      console.log('listlist', list)
      if (_ethvollist) {
        // _ethvollist和list都有的id
        _ethvollist.forEach((item) => {
          const _index = list.findIndex((listitem) => listitem.id.toLowerCase() === item.id.toLowerCase())
          if (_index > -1) {
            list[_index].eth_volume = (Math.abs(list[_index].eth_balance - item.eth_balance) + parseInt((item.eth_volume || 0))).toString()
          }
        })
      }
      await batchUpdatePairInfo(this.EzswapPoolModel, list, this.mode)
      const _result = await updatePair(Model, data, this.mode)
      console.log('更新成功', _result)
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
      // this.job.cancel()
      clearInterval(this.job)
      this.job = null
    }
    this.job = setInterval(async () => {
      console.log('定时执行')
      try {
        console.log('获取数据库最近区块更新的时间')
        const zks_startBlock = await getStartBlock(BlockModel, mode)
        console.log('获取需要更新的list')
        const list = await findDiffPair(Model, this.mode) || []
        processArray(list)
        console.log('获取需要更新的list成功')
        let dbtime = zks_startBlock.update_timestamp
        let nowtime = Date.parse(new Date()) / 1000
        console.log('数据库最后更新时间跟当前时间相差的秒数', this.status, nowtime, dbtime, nowtime - dbtime)
        if (this.status === 'asyncLog' && nowtime - dbtime > 60) {
          console.log('因为时间差出现大于60秒的差值而重新开始程序')
          this.start()
        }
      } catch (error) {
        console.log('定时任务出现问题', error)
        console.log('因为定时任务出现问题而重新开始程序')
        this.start()
      }
    }, 1000 * 10);
    // this.job = nodeSchedule.scheduleJob(rule, async () => {
    //   try {
    //     const zks_startBlock = await getStartBlock(BlockModel, mode)
    //     const blockNumber = await provider.getBlockNumber();
    //     if (this.status === 'asyncLog' && blockNumber - zks_startBlock.startBlock > 10) {
    //       if (this.job) {
    //         console.log('取消定时任务')
    //         this.job.cancel()
    //         this.job = null
    //         console.log('因为出现大于10个区块的差值而重新开始程序')
    //         this.start()
    //       }
    //       return false
    //     }
    //     const list = await findDiffPair(Model, this.mode)
    //     console.log('list', list)
    //     processArray(list)
    //   } catch (error) {
    //     console.log('定时任务出现问题', error)
    //     console.log('因为定时任务出现问题而重新开始程序')
    //     this.start()
    //   }
    // });
  }
  // 开始
  async start () {
    if (this.provider && this.provider._websocket.readyState === 1) {
      this.provider._websocket.close()
      this.provider._websocket.terminate();
    }
    console.log('开始程序')
    this.provider = new ethers.providers.WebSocketProvider(this.rpc);
    console.log('连接rpc成功')
    this.getPoolDataContract = new ethers.Contract(this.PoolDataContractAddress, InfomationABI, this.provider);
    this.updatePairList()
    // this.updatePairInfo()
  }
}


export default PoolSerice;
