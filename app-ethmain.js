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

const ethMain_startBlock =
  (await getStartBlock(BlockConfigModel, "ethmain")) ||
  (await insertStartBlock(BlockConfigModel, 18820492, "ethmain"));
const ethMainPool = new PoolSerice(
  "wss://eth-mainnet.g.alchemy.com/v2/QiKmDPF30YH_1XdElVBI5B9d3WrwEHvg",
  PairlistModel,
  BlockConfigModel,
  EzswapPoolModel,
  ethMain_startBlock.startBlock,
  "0x2A95E4FDF5F12B9E9AC627fEcbF70420D3202db1",
  "0xb8b027a9f72a4a364449eaefdbe6bd0db7bed502",
  "ethmain"
);
ethMainPool.start();
ethMainPool.updatePairInfo();
ethMainPool.provider.on("error", async (error) => {
  // ethMainPool.provider._websocket.terminate();
  setTimeout(() => {
    ethMainPool.start();
    ethMainPool.updatePairInfo();
  }, 3000);
});
