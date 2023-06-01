/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-29 19:28:08
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-01 21:15:23
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
const mode = argv?.[2] === '--mode' ? argv[3] : ''
// const mode = process.env.NODE_ENV
const envFile = mode ? `.env.${mode}` : '.env'
// 配置环境变量
dotenv.config({ path: envFile })
const client = await getMySqlClient()
const EzswapPoolModel = new EzswapPool(client, Sequelize);
await createModel(EzswapPoolModel)


// zks测试网
const PairlistModel = new Pairlist(client, Sequelize, 'zks_test');
const BlockConfigModel = new BlockConfig(client, Sequelize, 'zks_test');
await createModel(PairlistModel)
await createModel(BlockConfigModel)
// await insertStartBlock(BlockConfigModel, 6639000)   // 第一次运行的时候要设定初始区块高度
const zks_startBlock = await getStartBlock(BlockConfigModel)
const zksTestPool = new PoolSerice('wss://testnet.era.zksync.dev/ws', PairlistModel, BlockConfigModel, EzswapPoolModel, zks_startBlock.startBlock, '0xBcB7032c1e1Ea0Abc3850590349560e1333d6848', '0x8fB6a250adA61cDEA897C35f5404d94ada89633f', 'zks_test')
zksTestPool.start()