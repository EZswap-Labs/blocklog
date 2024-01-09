import {ethers} from 'ethers'
import ContractABI from "./abi/721seaport.js";
import tokenAddress from "./db/models/tokenIdAddress.js";
import Sequelize from "sequelize";
import {getMySqlClient} from "./db/mysql.js";

const client = await getMySqlClient();
const sqlConnect = new tokenAddress(client, Sequelize);

const iface = new ethers.utils.Interface(ContractABI);
// https://api.evm.eosnetwork.com/
let provider = new ethers.providers.JsonRpcProvider("https://api.evm.eosnetwork.com/");

// 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef maybe mint event
let startBlock = 24044003
async function syncBlock () {
    // 实时获取最新区块
    let endBlock = 24105038
    while (startBlock <= endBlock) {
        const currentEndBlock = startBlock + 100
        console.log(startBlock, currentEndBlock)
        const filter = {
            address: "0xC10A988680355BdFfE0B998Cd12098264C3957Bd",
            fromBlock: startBlock,
            endBlock: currentEndBlock,
            topics: [["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]]
        };
        console.log(1)
        const logs=await provider.getLogs(filter);
        console.log(2)
        const tokenMap = new Map();
        for (const log of logs) {
            // todo mint了又转移要去掉
            // console.log(log.topics[1], log.topics[2], log.topics[3])
            const a={
                token_id: log.topics[3],
                    address: log.topics[2]
            }
            tokenMap.set(log.topics[3],a)
        }
        if (tokenMap.size > 0) {
            const alsit = []
            tokenMap.forEach(function(value, key) {
                alsit.push(value)
            })
            await batchInsertToken(sqlConnect, alsit)
        }
        startBlock = currentEndBlock
    }
}

async function main () {
    await syncBlock()
    setTimeout(() => {
         syncBlock()
    }, 1000);
}

main()

const batchInsertToken = async (Model, addresslist) => {
    try {
        // 批量插入
        await Model.bulkCreate(addresslist, {updateOnDuplicate: ["address"]});
        console.log('success')
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}



