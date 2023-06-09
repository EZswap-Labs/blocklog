/*
 * @Descripttion :
 * @version      : 1.0.0
 * @Author       :
 * @Date         : 2023-05-11 09:46:59
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-09 21:35:42
 */
import { ethers } from 'ethers'
import ContractABI from '../abi/pair.js';
import InfomationABI from '../abi/Information.js';
import nodeSchedule from 'node-schedule'
import { batchUpdate, batchInsertPair, updateStartBlock, findDiffPair, updatePair, batchUpdatePairInfo, getStartBlock } from '../db/baseAction.js';
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
    this.status = 'sync'
    const filter = {
      address: pairFactoryAddress,
      fromBlock: startBlock,
      toBlock: endBlock,
      topics: [iface.getEventTopic('NewPair')]
    };
    provider.getLogs(filter).then(async (logs) => {
      console.log('logs', logs)
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
      setTimeout(() => {
        this.updatePairList()
      }, 1000)
    });
  }
  // 开始同步区块
  async startSyncBlock () {
    this.status = 'asyncLog'
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
        try {
          await batchUpdate(this.Model, txs.map((tx) => tx.address), this.mode)
          await updateStartBlock(BlockModel, blockNumber, this.mode)
        } catch (error) {
          console.log('同步error', error)
          this.start()
        }
      });
      provider.on("error", async (blockNumber) => {
        console.log('error', blockNumber)
        this.start()
      });
    } catch (error) {
      console.log('连接error', error)
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
      const list = await this.getPoolData(data)
      console.log('listlist', list)
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
      this.job.cancel()
    }
    let job = nodeSchedule.scheduleJob(rule, async () => {
      try {
        const zks_startBlock = await getStartBlock(BlockModel, mode)
        const blockNumber = await provider.getBlockNumber();
        if (this.status === 'asyncLog' && blockNumber - zks_startBlock.startBlock > 10) {
          if (this.job) {
            this.job.cancel()
            this.start()
          }
          return false
        }
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
