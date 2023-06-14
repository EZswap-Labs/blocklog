/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-29 19:28:08
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-14 15:52:15
 */
import dotenv from 'dotenv'
import Sequelize from 'sequelize';
import { getMySqlClient } from './db/mysql.js'
import Pairlist from './db/models/pairlist.js';
import BlockConfig from './db/models/block.js';
import EzswapPool from './db/models/ezswap_pool.js';
import { createModel, dropModel, getStartBlock, insertStartBlock } from './db/baseAction.js';
import PoolSerice from './service/index.js';
const argv = process.argv
// const mode = argv?.[2] === '--mode' ? argv[3] : ''
const mode = process.env.NODE_ENV
const envFile = mode ? `.env.${mode}` : '.env'
// 配置环境变量
dotenv.config({ path: envFile })
const client = await getMySqlClient()
process.setMaxListeners(0)
const EzswapPoolModel = new EzswapPool(client, Sequelize);
await createModel(EzswapPoolModel)
const PairlistModel = new Pairlist(client, Sequelize);
const BlockConfigModel = new BlockConfig(client, Sequelize);
await createModel(PairlistModel)
await createModel(BlockConfigModel)

const zks_startBlock = await getStartBlock(BlockConfigModel, 'zks_dev') || await insertStartBlock(BlockConfigModel, 6639000, 'zks_dev')
const zksTestPool = new PoolSerice('wss://testnet.era.zksync.dev/ws', PairlistModel, BlockConfigModel, EzswapPoolModel, zks_startBlock.startBlock, '0xBcB7032c1e1Ea0Abc3850590349560e1333d6848', '0x89484602989dF8eb6BB2AbEEAb977a910b39963b', 'zks_dev')
zksTestPool.start()
zksTestPool.updatePairInfo()
zksTestPool.provider._websocket.on("error", async (error) => {
  zksTestPool.provider._websocket.terminate();
  setTimeout(() => {
    zksTestPool.start()
    zksTestPool.updatePairInfo()
  }, 3000);
});