/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-04-26 15:49:02
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-05-17 12:42:46
 */
const Web3 = require('web3');
const SeaDropAbi = require('./SeaDrop');
const SeaDrop1155Abi = require('./SeaDrop1155');
const ERC721SeaDrop = require('./ERC721SeaDrop');
const SeaDropAddress = '0x06CBA4e8FA00B0A732Ba52c00AB51990a497eE2e';
const SeaDrop1155Address = '0xeDD8Dbce783Ed8C1Bc6E949A3E8d1B013bE5EB25';
const rpc = 'https://eth-mainnet.g.alchemy.com/v2/eeb2JnW2JdlOkqPH6NZVhVpRSXKaSW8D'

class SeaDropService {
  constructor(rpc, SeaDropAddress, SeaDrop1155Address) {
    this.web3 = new Web3(rpc);
    this.SeaDropContract = new this.web3.eth.Contract(SeaDropAbi.abi, SeaDropAddress);
    this.SeaDrop1155Contract = new this.web3.eth.Contract(
      SeaDrop1155Abi.abi,
      SeaDrop1155Address
    );
  }
  async getPublicDrop (id, type = '721') {
    try {
      let result = null;
      if (type === '721') {
        result = await this.SeaDropContract.methods.getPublicDrop(id).call();
      } else {
        result = await this.SeaDrop1155Contract.methods.getPublicDrop(id).call();
      }

      const total = result[0]?.maxTokenSupplyForStage?.toString() || 0;
      const minted = result[2] || 0;
      return { total, minted };
    } catch (error) {
      console.log(error);
    }
  }

  async getAirDrop (id, type = '721') {
    try {
      let result = null;
      if (type === '721') {
        result = await this.SeaDropContract.methods.getAirDrop(id).call();
      } else {
        result = await this.SeaDrop1155Contract.methods.getAirDrop(id).call();
      }
      console.log('getAirDrop', result);
      const total = result[0]?.maxTokenSupplyForStage?.toString() || 0;
      const minted = result[1] || 0;
      return { total, minted };
    } catch (error) {
      console.log(error);
    }
  }

  async getPrivateDrop (id, type = '721') {
    try {
      let result = null;
      if (type === '721') {
        result = await this.SeaDropContract.methods.getPrivateDrop(id).call();
      } else {
        result = await this.SeaDrop1155Contract.methods.getPrivateDrop(id).call();
      }

      const total = result[0]?.maxTokenSupplyForStage?.toString() || 0;
      const minted = result[2] || 0;
      return { total, minted };
    } catch (error) {
      console.log(error);
    }
  }

  async getMintStats (id, type = '721') {
    try {
      let result = null;
      if (type === '721') {
        result = await this.SeaDropContract.methods.getMintStats(id).call();
      } else {
        result = await this.SeaDropContract.methods.getMintStats(id).call();
      }
      const total = result[0]?.toString() || 0;
      const minted = result[1]?.toString() || 0;
      return { total, minted };
    } catch (error) {
      console.log(error);
    }

  }

  async start (nftId, type) {
    setInterval(async () => {
      // await this.getPrivateDrop(nftId, type), await this.getPublicDrop(nftId, type), await this.getMintStats(nftId, type)
      console.log('done', await this.getAirDrop(nftId, type), await this.getPrivateDrop(nftId, type), await this.getPublicDrop(nftId, type), await this.getMintStats(nftId, type));
    }, 10000);
  }
}


const seaDropService = new SeaDropService(rpc, SeaDropAddress, SeaDrop1155Address);
seaDropService.start('0x3688C106ba15F0Ff5C7e95dD4DBDD954e0F1615C', '721');
