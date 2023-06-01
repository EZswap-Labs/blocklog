const abi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_pair",
        "type": "address"
      }
    ],
    "name": "getInfo",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "collection",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "bondingCurve",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "poolType",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "assetRecipient",
            "type": "address"
          },
          {
            "internalType": "uint128",
            "name": "delta",
            "type": "uint128"
          },
          {
            "internalType": "uint96",
            "name": "fee",
            "type": "uint96"
          },
          {
            "internalType": "uint128",
            "name": "spotPrice",
            "type": "uint128"
          },
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "nftIds",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "nftCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nftId1155",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nftCount1155",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "is1155",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "uri1155",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol721",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "name721",
            "type": "string"
          }
        ],
        "internalType": "struct EZSWAPV2Information2.Info",
        "name": "info",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_pairs",
        "type": "address[]"
      }
    ],
    "name": "getMultiInfo",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "collection",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "bondingCurve",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "poolType",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "assetRecipient",
            "type": "address"
          },
          {
            "internalType": "uint128",
            "name": "delta",
            "type": "uint128"
          },
          {
            "internalType": "uint96",
            "name": "fee",
            "type": "uint96"
          },
          {
            "internalType": "uint128",
            "name": "spotPrice",
            "type": "uint128"
          },
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "nftIds",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "nftCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nftId1155",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nftCount1155",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "is1155",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "uri1155",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol721",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "name721",
            "type": "string"
          }
        ],
        "internalType": "struct EZSWAPV2Information2.Info[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
export default abi;
