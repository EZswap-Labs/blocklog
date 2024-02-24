import axios from 'axios';

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
        const response = await axios.get('https://explorer.evm.eosnetwork.com/api?module=account&&action=txlistinternal&address=' + queryAddress + '&start_block=' + queryBlock + "&sort=asc")
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

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

let collectionVolMap = new Map();

async function processBalance(startBlock, address) {

    // 查询指定区块内的内部交易
    // -1的目的是下次查的时候多查一个区块,保证不会漏区块
    let txListInternalResponse = await queryTxListInternal(address, startBlock - 1)
    while (null === txListInternalResponse || txListInternalResponse.status !== 200) {
        console.error("查询失败:", txListInternalResponse)
        await sleep(1000);
        txListInternalResponse = await queryTxListInternal(address, startBlock - 1)
    }
    for (const tx of txListInternalResponse.data.result) {
        if (tx.blockNumber > startBlock) {
            // 因为一个block可能有多个交易,一个区块都算在一个collection上,没处理过的区块
            let queryTxInfoResponse = await queryTxInfo(tx.transactionHash)
            while (null === queryTxInfoResponse || queryTxInfoResponse.status !== 200) {
                console.error("查询失败:", queryTxInfoResponse)
                await sleep(1000);
                queryTxInfoResponse = await queryTxInfo(tx.transactionHash)
            }
            for (const log of queryTxInfoResponse.data.result.logs) {
                if (log.topics.includes("0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62") || log.topics.includes("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")) {
                    // 查下当前和之前的余额,算这个block有多少交易量
                    // 查询指定区块的余额
                    let response = await queryBalance(address, tx.blockNumber - 1)
                    while (null === response || response.status !== 200) {
                        console.error("查询失败:", response)
                        await sleep(1000);
                        response = await queryBalance(address, tx.blockNumber - 1)
                    }
                    const beforeBalance = Number(response.data.result)
                    // console.log('beforeBalance', Number(beforeBalance))
                    let responseAfterBalance = await queryBalance(address, tx.blockNumber)
                    while (null === responseAfterBalance || responseAfterBalance.status !== 200) {
                        console.error("查询失败:", responseAfterBalance)
                        await sleep(1000);
                        responseAfterBalance = await queryBalance(address, tx.blockNumber)
                    }
                    const afterBalance = Number(responseAfterBalance.data.result)
                    const chazhi = afterBalance - beforeBalance
                    console.log('txhash ', tx.transactionHash.toString(),' topic: ', log.address, ' currentBlock: ', tx.blockNumber, ' beforeBalance: ', beforeBalance, ' afterBalance: ', afterBalance, ' chazhi:', chazhi)

                    if (collectionVolMap.has(log.address)) {
                        collectionVolMap.set(log.address, collectionVolMap.get(log.address) + chazhi)
                    } else {
                        collectionVolMap.set(log.address, chazhi)
                    }
                    console.log('collectionVolMap', JSON.stringify([...collectionVolMap]))
                    startBlock = tx.blockNumber
                    break
                }
            }
        }
    }
    if (startBlock < 28060420) {
        processBalance(startBlock)
    }
}

// main
async function main() {

    let startBlock = 21615731
    let address = "0x353F4106641Db62384cF0e4F1Ef15F8Ac9A9fb4B";
    // 如果重启了,可以在这里初始化已经处理好的区块的余额,然后增量更新
    // collectionVolMap.set('0xd2ffd7e6644ec7266ffb50582784ea3d4686026d', 49504950495047)
    console.log('开始任务 ', startBlock, address)
    await processBalance(startBlock, address)


    // let response = await queryBalance(address, 27807758)
    // const beforeBalance = Number(response.data.result)
    // console.log(beforeBalance)
    //
    // let response2 = await queryBalance(address, 27807760)
    // const after = Number(response2.data.result)
    // console.log(after)
    // let queryTxInfoResponse = await queryTxInfo('0x93adfb13668f8a65f19d21f533c789e0d42fed88dfc2fa73c0d9e0f80c289a0c')
    // console.log(queryTxInfoResponse.data)


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
