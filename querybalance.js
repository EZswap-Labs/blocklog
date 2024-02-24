import {ethers} from "ethers";
import erc721abi from "./abi/ERC721.js";
import nft_index_table from "./db/models/nft_index_table.js";
import Sequelize from "sequelize";
import {getMySqlClient} from "./db/mysql.js";
import {createModel} from "./db/baseAction.js";
import dotenv from "dotenv";
import axios from 'axios';


// get client
const mode = process.env.NODE_ENV;
const envFile = mode ? `.env.${mode}` : ".env";
dotenv.config({path: envFile});
const client = await getMySqlClient();
const nft_index = new nft_index_table(client, Sequelize);
await createModel(nft_index);

// setup provider
let provider = new ethers.providers.JsonRpcProvider(
    'https://pacific-rpc.manta.network/http'
);

async function queryBalance(queryAddress, queryBlock) {
    try {
        const response = await axios.get('https://explorer.evm.eosnetwork.com/api?module=account&action=eth_get_balance&address=' + queryAddress + '&block=' + queryBlock)
        return response
    } catch (error) {
        console.log("balance request error", error);
    }
    return null
    // console.log('status:', response.status)
}

async function queryTxListInternal(queryAddress, queryBlock) {
    try {
        const response = await axios.get('https://explorer.evm.eosnetwork.com/api?module=account&&action=txlistinternal&address=' + queryAddress + '&start_block=' + queryBlock + '&end_block=' + (queryBlock + 1))
        // console.log('status:', response.status)
        return response
    } catch (error) {
        console.log("queryTxListInternal request error", error);
    }
    return null
}

async function queryTxInfo(txHash) {
    try {
        const response = await axios.get('https://explorer.evm.eosnetwork.com/api?module=transaction&action=gettxinfo&txhash=' + txHash)
        // console.log('status:', response.status)
        return response
    } catch (error) {
        console.log("queryTxInfo request error", error);
    }
    return null
}
function sleep(time){
    return new Promise((resolve) => setTimeout(resolve, time));
}

let collectionVolMap = new Map();

async function processBalance(startBlock) {

    let address = "0x353F4106641Db62384cF0e4F1Ef15F8Ac9A9fb4B";
    // 查询指定区块的余额
    let response = await queryBalance(address, startBlock)
    while (null === response || response.status !== 200) {
        console.error("查询失败:", response)
        await sleep(1000);
        response = await queryBalance(address, startBlock)
    }
    const beforeBalance = Number(response.data.result)
    // console.log('beforeBalance', Number(beforeBalance))
    startBlock = startBlock + 1
    let responseAfterBalance = await queryBalance(address, startBlock)
    while (null === responseAfterBalance || responseAfterBalance.status !== 200) {
        console.error("查询失败:", responseAfterBalance)
        await sleep(1000);
        responseAfterBalance = await queryBalance(address, startBlock)
    }
    const afterBalance = Number(responseAfterBalance.data.result)
    const chazhi = afterBalance - beforeBalance
    console.log('startBlock: ', startBlock, ' beforeBalance: ', beforeBalance, ' afterBalance: ', afterBalance, ' chazhi:', chazhi)
    if (chazhi > 0) {
        // 查询指定区块内的内部交易
        let txListInternalResponse = await queryTxListInternal(address, startBlock)
        while (null === txListInternalResponse || txListInternalResponse.status !== 200) {
            console.error("查询失败:", txListInternalResponse)
            await sleep(1000);
            txListInternalResponse = await queryTxListInternal(address, startBlock)
        }
        let queryTxInfoResponse = await queryTxInfo(txListInternalResponse.data.result[0].transactionHash)
        while (null === queryTxInfoResponse || queryTxInfoResponse.status !== 200) {
            console.error("查询失败:", queryTxInfoResponse)
            await sleep(1000);
            queryTxInfoResponse = await queryTxInfo(txListInternalResponse.data.result[0].transactionHash)
        }
        for (const log of queryTxInfoResponse.data.result.logs) {
            if (log.topics.includes("0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62") || log.topics.includes("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")) {
                console.log('查到topic:', log.address)
                if (collectionVolMap.has(log.address)) {
                    collectionVolMap.set(log.address, collectionVolMap.get(log.address) + chazhi)
                } else {
                    collectionVolMap.set(log.address, chazhi)
                }
                // console.log('collectionVolMap22', JSON.stringify(collectionVolMap))
            }
        }
    }
    // startBlock = startBlock +1
    processBalance(startBlock)
    console.log('collectionVolMap', JSON.stringify([...collectionVolMap]))
}

// main
async function main() {

    // let nft = '0x6B8a2dBdcfE02bee42b8bD5703eC28eb70d9862D'
    // let mode = 'mantatest'
    let startBlock = 24452552
    collectionVolMap.set('0xd2ffd7e6644ec7266ffb50582784ea3d4686026d', 49504950495047)
    // let END_BLOCK = 2920869

    // let fromBlock = await getStartBlock(nft, mode, 1920869);
    // const pollInterval = 5000; // 5s
    // const maxBlockRange = 1000;
    await processBalance(startBlock)


    //解析input

    // const buyiface = new ethers.utils.Interface(['function robustSwapETHForSpecificNFTs(tuple(tuple(address,uint256[],uint256[]),uint256)[],address,address,uint256) public payable returns (uint256)'])
    // const sellIface = new ethers.utils.Interface(['function robustSwapNFTsForToken(tuple(tuple(address,uint256[],uint256[]),uint256)[],address,uint256) public returns (uint256)'])

    // const aaa=iface.decodeFunctionData('robustSwapETHForSpecificNFTs', '0x9617b70e00000000000000000000000031753b319f03a7ca0264a1469da0149982ed7564')
    // console.log('aaa', aaa)

    // const raw = '0x9617b70e00000000000000000000000031753b319f03a7ca0264a1469da0149982ed7564'
    // let decodedData = iface.parseTransaction({ data: raw });
    // const tx = ethers.utils.parseTransaction(raw )
    // console.log('tx', decodedData)

    // const data = "0xc2e20c970000000000000000000000000000000000000000000000000000000000000060000000000000000000000000d9010a58b4f1371b36475f5234668bdf5e76b76a0000000000000000000000000000000000000000000000000000000065d939560000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000001cb529499d98d000000000000000000000000000cb2c8e1c949d7a08f3c192a88f3d24f9f8ef20ac000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002a";
    // const value = parseEther("1.0");

    // const aabb=sellIface.parseTransaction({ data });
    // console.log(JSON.stringify(aabb))
// gives: [e, ["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x08ba0619b1e7A582E0BCe5BBE9843322C954C340"], "0xC0C5eb43E2dF059e3Be6E4fb0284C283CAa59919", e] (4)

    // let etherscanProvider = new ethers.providers.EtherscanProvider();

    // // const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    // for (let blockNumber = startBlock; blockNumber < END_BLOCK; blockNumber++){
    //     const block = await provider.getBalance(blockNumber);
    //     const transactions = block.transactions
    //     for (const transaction of transactions){
    //         console.log(transaction)
    //     }
    // }

}

main();