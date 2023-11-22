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

const eosMain_startBlock =
  (await getStartBlock(BlockConfigModel, "eosmain")) ||
  (await insertStartBlock(BlockConfigModel, 19899500, "eosmain"));
const eosMainPool = new PoolSerice(
  "https://api.evm.eosnetwork.com/",
  PairlistModel,
  BlockConfigModel,
  EzswapPoolModel,
  eosMain_startBlock.startBlock,
  "0x353F4106641Db62384cF0e4F1Ef15F8Ac9A9fb4B",
  "0x44444aeE2c51BeFA0ac20134b3205D9f44238058",
  "eosmain"
);
eosMainPool.start();
eosMainPool.updatePairInfo();
eosMainPool.provider._websocket.on("error", async (error) => {
  eosMainPool.provider._websocket.terminate();
  setTimeout(() => {
    eosMainPool.start();
    eosMainPool.updatePairInfo();
  }, 3000);
});
