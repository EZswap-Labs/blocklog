/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-11 09:46:59
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-05-26 10:38:39
 */
const { ethers } = require("ethers");
const contractABI = require('./abi/pair.json');
const contractAddress = '0x4332465E5C9Ac98e91EEeeCe7989bDD0387f0cBA';
const iface = new ethers.utils.Interface(contractABI);
class poolSerice {
  constructor(rpc, startBlock, pairFactoryAddress, PoolDataContractAddress) {
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
    this.pairFactoryAddress = pairFactoryAddress
    this.pairFactoryContract = new ethers.Contract(pairFactoryAddress, contractABI, this.provider);
    this.gePoolDataContract = new ethers.Contract(PoolDataContractAddress, contractABI, this.provider);
    this.queue = []
    this.processing = false
    this.uniqueSet = new Set()
    this.pairqueue = []
    this.pairprocessing = false
    this.pairuniqueSet = new Set()
  }
  async add (transactionHash) {
    if (!this.uniqueSet.has(transactionHash)) { // 如果这个交易hash还没有被添加到队列中
      this.queue.push(transactionHash)
      this.uniqueSet.add(transactionHash) // 将其添加到Set中，以备后续去重操作
      if (!this.processing) {
        await this.processQueue()
      }
    }
  }
  async pairadd (address) {
    if (!this.pairuniqueSet.has(address)) { // 如果这个pool地址还没有被添加到队列中
      this.pairqueue.push(address)
      this.pairuniqueSet.add(address) // 将其添加到Set中，以备后续去重操作
      if (!this.pairprocessing) {
        await this.pairprocessQueue()
      }
    }
  }
  async pairprocessQueue () {
    this.pairprocessing = true
    while (this.pairqueue.length) {
      const address = this.pairqueue.shift()
      // pair 入库
    }
    this.pairprocessing = false
  }
  async processQueue () {
    this.processing = true
    while (this.queue.length) {
      const transactionHash = this.queue.shift()
      const result = await this.provider.getTransaction(transactionHash)
      console.log('to', result?.to)
      // result.to从数据库里查询如果有这个的话就更新pool信息
      // if () {
      //   // 更新pool信息
      //   const poolData = await this.getPoolData(result.to)
      //   // 更新数据库
      // }
    }
    this.processing = false
  }
  // 更新pool信息
  async getPoolData (poolAddress) {
    try {
      let result = null;
      result = await this.gePoolDataContract.methods.getPoolData(poolAddress).call();
      return result;
    } catch (error) {
      console.log(error);
    }
  }
  // 更新pair地址列表
  async updatePairList () {
    const { provider, startBlock, endBlock } = this
    const filter = {
      address: contractAddress,
      fromBlock: startBlock,
      toBlock: endBlock,
      topics: [iface.getEventTopic('NewPair')]
    };
    provider.getLogs(filter).then(async (logs) => {
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
        }, 2000)
      } else {
        this.startBlock = startBlock + 1000
        this.endBlock = this.startBlock + 1000
        setTimeout(() => {
          this.updatePairList()
        }, 2000)
      }
    }).catch((err) => {
      setTimeout(() => {
        this.updatePairList()
      }, 2000)
    });
  }
  // 开始同步区块
  async startSyncBlock () {
    console.log('startSyncBlock')
    const { provider, startBlock, endBlock } = this
    const filter = {
      address: contractAddress,
      fromBlock: startBlock,
      toBlock: endBlock,
      topics: [iface.getEventTopic('NewPair')]
    };
    try {
      provider.on("block", async (blockNumber) => {
        const filter = {
          fromBlock: blockNumber,
          toBlock: blockNumber,
          address: contractAddress,
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
        console.log('txs', txs.length)
      });
      provider.on("error", async (blockNumber) => {
        console.log('error', blockNumber)
      });
    } catch (error) {
      console.log('同步error', error)
      this.start()
    }

  }
  // 开始
  async start () {
    this.updatePairList()
  }
}

const zksPool = new poolSerice('wss://mainnet.era.zksync.io/ws', 6139735, '0x4332465E5C9Ac98e91EEeeCe7989bDD0387f0cBA', '0x4332465E5C9Ac98e91EEeeCe7989bDD0387f0cBA')
zksPool.start()