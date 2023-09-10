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

const mantaTest_startBlock =
  (await getStartBlock(BlockConfigModel, "mantatest")) ||
  (await insertStartBlock(BlockConfigModel, 564680, "mantatest"));
const mantaTestPool = new PoolSerice(
  "wss://manta-testnet.calderachain.xyz/ws",
  PairlistModel,
  BlockConfigModel,
  EzswapPoolModel,
  mantaTest_startBlock.startBlock,
  "0x86388a46f5e3dafbf815b7521e244930E0727eE3",
  "0xEA926BB5aC32e68ebba1BfCE20d3Ced749198956",
  "mantatest"
);
mantaTestPool.start();
mantaTestPool.updatePairInfo();
mantaTestPool.provider._websocket.on("error", async (error) => {
  mantaTestPool.provider._websocket.terminate();
  setTimeout(() => {
    mantaTestPool.start();
    mantaTestPool.updatePairInfo();
  }, 3000);
});
