/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-29 19:28:08
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-01 13:04:47
 */
import dotenv from 'dotenv'
import Sequelize from 'sequelize';
import { getMySqlClient } from './db/mysql.js'
import Pairlist from './db/models/pairlist.js';
import BlockConfig from './db/models/block.js';
import { createModel, dropModel, getStartBlock, insertStartBlock } from './db/baseAction.js';
import PoolSerice from './service/index.js';
const argv = process.argv
const mode = argv?.[2] === '--mode' ? argv[3] : ''
// const mode = process.env.NODE_ENV
const envFile = mode ? `.env.${mode}` : '.env'
// 配置环境变量
dotenv.config({ path: envFile })
const client = await getMySqlClient()

// zks
const PairlistModel = new Pairlist(client, Sequelize, 'zksync');
const BlockConfigModel = new BlockConfig(client, Sequelize, 'zksync');
await createModel(PairlistModel)
await createModel(BlockConfigModel)
// await insertStartBlock(BlockConfigModel, 6639000)
const zks_startBlock = await getStartBlock(BlockConfigModel)
console.log('zks_startBlock', zks_startBlock.startBlock)
const zksTestPool = new PoolSerice('wss://testnet.era.zksync.dev/ws', PairlistModel, BlockConfigModel, zks_startBlock.startBlock, '0xBcB7032c1e1Ea0Abc3850590349560e1333d6848', '0x4332465E5C9Ac98e91EEeeCe7989bDD0387f0cBA')
zksTestPool.start()