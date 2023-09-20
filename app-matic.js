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

const maticMain_startBlock =
  (await getStartBlock(BlockConfigModel, "matic_main")) ||
  (await insertStartBlock(BlockConfigModel, 46444808, "matic_main"));
const maticMainPool = new PoolSerice(
  "wss://polygon-bor.publicnode.com",
  PairlistModel,
  BlockConfigModel,
  EzswapPoolModel,
  maticMain_startBlock.startBlock,
  "0x353F4106641Db62384cF0e4F1Ef15F8Ac9A9fb4B",
  "0x70058Fa8E51D5B41B8Cdcc96480d94E3337a8f96",
  "matic_main"
);
maticMainPool.start();
maticMainPool.updatePairInfo();
maticMainPool.provider._websocket.on("error", async (error) => {
  maticMainPool.provider._websocket.terminate();
  setTimeout(() => {
    maticMainPool.start();
    maticMainPool.updatePairInfo();
  }, 3000);
});
