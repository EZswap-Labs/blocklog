/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-30 14:55:22
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-01 19:51:22
 */
// 创建表
import { getMySqlClient } from './mysql.js'
import { Op } from "sequelize";
export const createModel = async (Model) => {
  try {
    await Model?.sync({})
    return true
  } catch (error) {
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
export const insertPair = async (Model, address) => {
  try {
    await Model.create({ pair_address: address }, { updateOnDuplicate: ["updatedAt"] });
    return true
  } catch (error) {
    return false
  }
}
// 获取数据库区块高度
export const getStartBlock = async (Model) => {
  try {
    const block = await Model.findOne({
      where: {
        id: 1
      }
    })
    return JSON.parse(JSON.stringify(block, null, 2))
  } catch (error) {
    return false
  }
}

// 插入区块高度
export const insertStartBlock = async (Model, startBlock) => {
  try {
    await Model.create({ startBlock: startBlock });
    console.log('insertStartBlock', startBlock)
    return true
  } catch (error) {
    console.log('error', error)
    return false
  }
}

// 更新数据库区块高度
export const updateStartBlock = async (Model, startBlock) => {
  const client = await getMySqlClient()
  const transaction = await client.transaction();
  try {
    const block = await Model.update({ startBlock: startBlock }, {
      where: {
        id: 1
      }
    })
    console.log('updatablock', block[0])
    await transaction.commit();
    return true
  } catch (error) {
    transaction.rollback();
    return false
  }
}

// 批量更新pair
export const batchUpdate = async (Model, list) => {
  const client = await getMySqlClient()
  const transaction = await client.transaction();
  try {
    // 获取到数据库的pair列表
    const oldList = await Model.findAll();
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
          }
        },
        transaction
      })
      await transaction.commit();
    } else {
      await transaction.rollback();
    }
    return true
  } catch (error) {
    console.log('error', error);
    transaction.rollback();
    return false
  }
}

// 寻找pair里async_index跟数据库里active_index不一致的pair
export const findDiffPair = async (Model) => {
  try {
    const list = await Model.findAll({
      where: {
        status: 'active'
      }
    });
    const _list = JSON.parse(JSON.stringify(list, null, 2))
    return _list
  } catch (error) {
    return false
  }
}

// 更新pair
export const updatePair = async (Model, updateList) => {
  const client = await getMySqlClient()
  const transaction = await client.transaction();
  try {
    await Model.update({ status: 'asynced' }, {
      where: {
        id: {
          [Op.or]: updateList.map(item => item.id)
        }
      },
      transaction
    })
    await transaction.commit();
    return true
  } catch (error) {
    transaction.rollback();
    return false
  }
}

// 批量更新pairinfo
export const batchUpdatePairInfo = async (Model, list) => {
  const client = await getMySqlClient()
  const transaction = await client.transaction();
  try {
    await Model.bulkCreate(list, { updateOnDuplicate: ["delta", "fee", "spot_price", "eth_balance", "token_balance", "eth_volume", "update_timestamp", "nft_count", "swap_type", "nft_ids", "nft_id1155", "nft_count1155"], transaction });
    await transaction.commit();
    return true
  } catch (error) {
    console.log('error', error);
    transaction.rollback();
    return false
  }
}