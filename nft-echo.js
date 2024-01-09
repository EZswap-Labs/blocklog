import { ethers } from "ethers";
import erc721abi from "./abi/ERC721.js";
import nft_table from "./db/models/nft_echo_table.js";
import Sequelize from "sequelize";
import { getMySqlClient } from "./db/mysql.js";
import { createModel } from "./db/baseAction.js";
import dotenv from "dotenv";

// get client
const mode = process.env.NODE_ENV;
const envFile = mode ? `.env.${mode}` : ".env";
dotenv.config({ path: envFile });
const client = await getMySqlClient();
const echo_table = new nft_table(client, Sequelize);
await createModel(echo_table);

// setup provider
const iface = new ethers.utils.Interface(erc721abi);
let provider = new ethers.providers.JsonRpcProvider(
  "https://api.evm.eosnetwork.com/"
);

async function getStartBlock() {
  const lastRecord = await echo_table.findOne({
    order: [["block_number", "DESC"]],
  });
  return lastRecord ? lastRecord.block_number + 1 : 24054000;
}

// process logs
async function processLogs(fromBlock, toBlock) {
  const filter = {
    address: "0xC10A988680355BdFfE0B998Cd12098264C3957Bd",
    fromBlock: fromBlock,
    toBlock: toBlock,
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    ],
  };

  const logs = await provider.getLogs(filter);

  const records = [];

  for (const log of logs) {
    try {
      const tokenId = ethers.utils.defaultAbiCoder
        .decode(["uint256"], log.topics[3])[0]
        .toString();
      const ownerAddress = ethers.utils.getAddress(
        "0x" + log.topics[2].slice(26)
      );

      records.push({
        token_id: tokenId,
        owner_address: ownerAddress,
        block_number: log.blockNumber,
        update_at: new Date(),
      });
    } catch (error) {
      console.error(error);
    }
  }

  if (records.length > 0) {
    await echo_table.bulkCreate(records, {
      updateOnDuplicate: ["owner_address", "block_number", "update_at"],
    });
  }
}

// main 
async function main() {
  let fromBlock = await getStartBlock();
  const pollInterval = 5000; // 5s
  const maxBlockRange = 1000;

  setInterval(async () => {
    try {
      const currentBlock = await provider.getBlockNumber();
      let toBlock;

      if (fromBlock + maxBlockRange < currentBlock) {
        toBlock = fromBlock + maxBlockRange;
      } else {
        toBlock = currentBlock;
      }

      if (fromBlock < toBlock) {
        console.log(
          "time:",
          new Date(),
          "--fromblock:",
          fromBlock,
          "--toblock;",
          toBlock
        );
        await processLogs(fromBlock, toBlock);
        fromBlock = toBlock + 1;
      }
    } catch (error) {
      console.error(error);
    }
  }, pollInterval);
}

main();
