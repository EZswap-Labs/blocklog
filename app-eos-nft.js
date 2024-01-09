import {ethers, utils} from 'ethers'
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
let startBlock = 24053903

async function syncBlock() {
    // 实时获取最新区块
    let endBlock = await provider.getBlockNumber()
    while (startBlock <= endBlock) {
        const currentEndBlock = startBlock + 500
        console.log(startBlock, currentEndBlock)
        const filter = {
            address: "0xC10A988680355BdFfE0B998Cd12098264C3957Bd",
            fromBlock: startBlock,
            toBlock: currentEndBlock,
            topics: [["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]]
        };
        const logs = await provider.getLogs(filter);
        const tokenMap = new Map();
        for (const log of logs) {
            // todo mint了又转移要去掉,如果topic[1]不是 0x0000000000000000000000000000000000000000000000000000000000000000, 要删掉数据库里,但是好像不用管,
            //  因为有这条记录就直接覆盖之前的了
            let normalizedAddress = '0x' + log.topics[2].slice(26);
            const a = {
                token_id: parseInt(log.topics[3], 16),
                address: normalizedAddress
            }
            tokenMap.set(parseInt(log.topics[3], 16), a)
        }
        if (tokenMap.size > 0) {
            const alsit = []
            tokenMap.forEach(function (value, key) {
                alsit.push(value)
            })
            await batchInsertToken(sqlConnect, alsit)
        }
        startBlock = currentEndBlock
    }
}

async function main() {
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



