import { ethers } from "ethers";
import erc721abi from "./abi/ERC721.js";
import nft_index_table from "./db/models/nft_index_table.js";
import Sequelize from "sequelize";
import { getMySqlClient } from "./db/mysql.js";
import { createModel } from "./db/baseAction.js";
import dotenv from "dotenv";

// get client
const mode = process.env.NODE_ENV;
const envFile = mode ? `.env.${mode}` : ".env";
dotenv.config({ path: envFile });
const client = await getMySqlClient();
const nft_index = new nft_index_table(client, Sequelize);
await createModel(nft_index);

// setup provider
const iface = new ethers.utils.Interface(erc721abi);
let provider = new ethers.providers.JsonRpcProvider(
    'https://pacific-rpc.manta.network/http'
);

async function getStartBlock(nft, mode, startBlock) {
    const lastRecord = await nft_index.findOne({
        where: {
            collection_address: nft,
            mode: mode
        },
        order: [["block_number", "DESC"]],
    });
    console.log(lastRecord ? lastRecord.block_number + 1 : startBlock)
    return lastRecord ? lastRecord.block_number + 1 : startBlock;
}

// process logs
async function processLogs(nft, mode, fromBlock, toBlock) {
    const filter = {
        address: nft,
        fromBlock: fromBlock,
        toBlock: toBlock,
        topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        ],
    };

    const logs = await provider.getLogs(filter);

    //   console.log(logs);

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
                collection_address: nft,
                token_id: tokenId,
                owner_address: ownerAddress,
                block_number: log.blockNumber,
                mode: mode,
                update_at: new Date(),
            });
        } catch (error) {
            console.error(error);
        }
    }

    if (records.length > 0) {
        await nft_index.bulkCreate(records, {
            updateOnDuplicate: ["owner_address", "block_number", "update_at"],
        });
    }
}

// main 
async function main() {

    let nft = '0x1008bB9C06Ff83f9d5e744A53893baCE03092eB9'
    let mode = 'manta'
    let startBlock = 1369502

    let fromBlock = await getStartBlock(nft, mode, startBlock);
    const pollInterval = 5000; // 5s
    const maxBlockRange = 1000;

    setInterval(async () => {
        try {
            const currentBlock = await provider.getBlockNumber();
            console.log(currentBlock)
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
                await processLogs(nft, mode, fromBlock, toBlock);
                fromBlock = toBlock + 1;
            }
        } catch (error) {
            console.error(error);
        }
    }, pollInterval);
}

main();
