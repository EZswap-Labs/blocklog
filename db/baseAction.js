/*
 * @Descripttion :
 * @version      : 1.0.0
 * @Author       :
 * @Date         : 2023-05-30 14:55:22
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-14 22:56:20
 */
// 创建表
import { getMySqlClient } from './mysql.js'
import { Op } from "sequelize";
export const createModel = async (Model) => {
  try {
    await Model?.sync({})
    return true
  } catch (error) {
    console.log('error', error)
    return false
  }
}
// 删除表
export const dropModel = async (Model) => {
  try {
    await Model?.drop()
    return true
  } catch (error) {
    return false
  }
}
// 插入pair
export const batchInsertPair = async (Model, addresslist, mode) => {
  try {
    // 批量插入
    await Model.bulkCreate(addresslist.map(res => {
      return {
        pair_address: res,
        mode: mode,
        status: 'active',
      }
    }), { updateOnDuplicate: ["updatedAt", "mode", "status"] });
    // await Model.create({ pair_address: address, mode: mode }, { updateOnDuplicate: ["updatedAt", "mode"] });
    return true
  } catch (error) {
    return false
  }
}
// 从block_coonfig中, 获取数据库区块高度
export const getStartBlock = async (Model, mode) => {
  try {
    const block = await Model.findOne({
      where: {
        mode: mode
      }
    })
    return block ? JSON.parse(JSON.stringify(block, null, 2)) : false
  } catch (error) {
    return false
  }
}

// 从block_coonfig中, 插入区块高度
export const insertStartBlock = async (Model, startBlock, mode) => {
  try {
    var timestamp = new Date().getTime();
    const block = await Model.create({ startBlock: startBlock, mode: mode, update_timestamp: Math.floor(timestamp / 1000) }, { updateOnDuplicate: ["updatedAt", "startBlock", "update_timestamp"], });
    console.log('insertStartBlock', JSON.parse(JSON.stringify(block, null, 2)))
    return JSON.parse(JSON.stringify(block, null, 2))
  } catch (error) {
    console.log('error', error)
    return false
  }
}

// 从block_coonfig中, 更新数据库区块高度
export const updateStartBlock = async (Model, startBlock, mode) => {
  try {
    var timestamp = new Date().getTime();
    const block = await Model.update({ startBlock: startBlock, update_timestamp: Math.floor(timestamp / 1000) }, {
      where: {
        mode: mode
      }
    })
    console.log('updatablock', block[0])
    return true
  } catch (error) {
    return false
  }
}

// 从pair_list中, 批量更新pair, 把新加入的pair都标记从active
export const batchUpdate = async (Model, list, mode) => {
  try {
    // 获取到数据库的pair列表
    const oldList = await Model.findAll({
      where: {
        mode: mode
      }
    });
    const _oldList = JSON.parse(JSON.stringify(oldList, null, 2))
    // 对比数据库中的pair列表和传入的列表，找出需要更新的pair
    let diffRows = _oldList.filter(item => list.some(oldItem => oldItem === item.pair_address));
    diffRows = diffRows.map(item => item.pair_address)
    console.log('diffRows', diffRows)
    // 批量更新pair
    if (diffRows.length > 0) {
      await Model.update({ status: 'active' }, {
        where: {
          pair_address: {
            [Op.or]: diffRows
          },
          mode: mode
        }
      })
    }
    return true
  } catch (error) {
    console.log('error', error);
    return false
  }
}

// 从pair_list中, 寻找pair里async_index跟数据库里active_index不一致的pair， 找出所有需要更新的pair
export const findDiffPair = async (Model, mode) => {
  try {
    const list = await Model.findAll({
      where: {
        status: 'active',
        mode: mode
      }
    });
    const _list = JSON.parse(JSON.stringify(list, null, 2))
    return _list
  } catch (error) {
    return false
  }
}

// 从pair_list中, 更新pair, 表示同步完成
export const updatePair = async (Model, updateList) => {
  try {
    await Model.update({ status: 'asynced' }, {
      where: {
        id: {
          [Op.or]: updateList.map(item => item.id)
        }
      }
    })
    return true
  } catch (error) {
    return false
  }
}

// 从ezswap_pool中, 批量更新pairinfo 
export const batchUpdatePairInfo = async (Model, list, mode) => {
  try {
    await Model.bulkCreate(list, { updateOnDuplicate: ["owner", "asset_recipient","delta", "fee", "spot_price", "eth_balance", "token_balance", "eth_volume", "update_timestamp", "nft_count", "swap_type", "nft_ids", "nft_id1155", "nft_count1155", "collection_name"] });
    return true
  } catch (error) {
    console.log('error', error);
    return false
  }
}


// 从ezswap_pool中, 批量获取pairinfo
export const batchGetPairInfo = async (Model, list, mode) => {
  try {
    const res = await Model.findAll({
      where: {
        id: {
          [Op.or]: list.map(item => item.pair_address)
        },
        mode: mode
      }
    });
    const _res = JSON.parse(JSON.stringify(res, null, 2))
    return _res
  } catch (error) {
    return false
  }
}
