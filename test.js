/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-29 19:28:08
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-09 13:01:26
 */
import dotenv from 'dotenv'
import Sequelize from 'sequelize';
import { getMySqlClient } from './db/mysql.js'
import User from './db/models/user.js';
import Book from './db/models/book.js';
import { createModel, dropModel, getStartBlock, insertStartBlock } from './db/baseAction.js';
import PoolSerice from './service/index.js';
const argv = process.argv
const mode = argv?.[2] === '--mode' ? argv[3] : ''
// const mode = process.env.NODE_ENV
const envFile = mode ? `.env.${mode}` : '.env'
// 配置环境变量
dotenv.config({ path: envFile })
const client = await getMySqlClient()
const userModel = new User(client, Sequelize);
const BookModel = new Book(client, Sequelize);
userModel.hasOne(BookModel, {
  foreignKey: 'uId',
  sourceKey: 'id'
});
BookModel.belongsTo(userModel, {
  foreignKey: 'uId',
  sourceKey: 'id'
});
await createModel(userModel)
await createModel(BookModel)
let userData = await BookModel.findAll({
  include: {
    model: userModel
  }
});

console.log(userData.book);
// console.log(userData.book.dataValues);

// const zks_startBlock = await getStartBlock(BlockConfigModel, 'zks_dev') || await insertStartBlock(BlockConfigModel, 6639000, 'zks_dev')
// const zksTestPool = new PoolSerice('wss://testnet.era.zksync.dev/ws', PairlistModel, BlockConfigModel, EzswapPoolModel, zks_startBlock.startBlock, '0xBcB7032c1e1Ea0Abc3850590349560e1333d6848', '0x8fB6a250adA61cDEA897C35f5404d94ada89633f', 'zks_dev')
// zksTestPool.start()