/*
 * @Descripttion :
 * @version      : 1.0.0
 * @Author       :
 * @Date         : 2023-05-29 19:28:08
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-14 15:52:15
 */
import dotenv from "dotenv";
import Sequelize from "sequelize";
import { getMySqlClient } from "./db/mysql.js";
import Pairlist from "./db/models/pairlist.js";
import BlockConfig from "./db/models/block.js";
import EzswapPool from "./db/models/ezswap_pool.js";
import {
  createModel,
  dropModel,
  getStartBlock,
  insertStartBlock,
} from "./db/baseAction.js";
import PoolSerice from "./service/index.js";
const argv = process.argv;
// const mode = argv?.[2] === '--mode' ? argv[3] : ''
const mode = process.env.NODE_ENV;
const envFile = mode ? `.env.${mode}` : ".env";

console.log(envFile);
// 配置环境变量
dotenv.config({ path: envFile });
const client = await getMySqlClient();
process.setMaxListeners(0);
const EzswapPoolModel = new EzswapPool(client, Sequelize);
await createModel(EzswapPoolModel);
const PairlistModel = new Pairlist(client, Sequelize);
const BlockConfigModel = new BlockConfig(client, Sequelize);
await createModel(PairlistModel);
await createModel(BlockConfigModel);

const eosTest_startBlock =
  (await getStartBlock(BlockConfigModel, "eostest")) ||
  (await insertStartBlock(BlockConfigModel, 20926440, "eostest"));
const eosTestPool = new PoolSerice(
  "https://api.testnet.evm.eosnetwork.com/",
  PairlistModel,
  BlockConfigModel,
  EzswapPoolModel,
  eosTest_startBlock.startBlock,
  "0xe893287f3B0e5682e639caa51fdAfe9653AB4abf",
  "0x4d7c33766130b818896BbE81dc7a5fA2fdCb1251",
  "eostest"
);
eosTestPool.start();
eosTestPool.updatePairInfo();
eosTestPool.provider.on("error", async (error) => {
  //   eosTestPool.provider.terminate();
  setTimeout(() => {
    eosTestPool.start();
    eosTestPool.updatePairInfo();
  }, 3000);
});
