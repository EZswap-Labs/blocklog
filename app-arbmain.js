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

const arbMain_startBlock =
  (await getStartBlock(BlockConfigModel, "arbmain")) ||
  (await insertStartBlock(BlockConfigModel, 161607850, "arbmain"));
const arbMainPool = new PoolSerice(
  "https://1rpc.io/arb",
  PairlistModel,
  BlockConfigModel,
  EzswapPoolModel,
  arbMain_startBlock.startBlock,
  "0x3d51749Cb2Db7355392100BAc202216BE7071E66",
  "0xaf11970cb4F206864FE8184b18e4B6A5b08DE332", //
  "arbmain"
);
arbMainPool.start();
arbMainPool.updatePairInfo();
arbMainPool.provider.on("error", async (error) => {
  // arbMainPool.provider._websocket.terminate();
  setTimeout(() => {
    arbMainPool.start();
    arbMainPool.updatePairInfo();
  }, 3000);
});
