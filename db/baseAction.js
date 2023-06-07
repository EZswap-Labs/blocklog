/*
 * @Descripttion :
 * @version      : 1.0.0
 * @Author       :
 * @Date         : 2023-05-30 14:55:22
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-07 16:05:43
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
        mode: mode
      }
    }), { updateOnDuplicate: ["updatedAt", "mode"] });
    // await Model.create({ pair_address: address, mode: mode }, { updateOnDuplicate: ["updatedAt", "mode"] });
    return true
  } catch (error) {
    return false
  }
}
// 获取数据库区块高度
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

// 插入区块高度
export const insertStartBlock = async (Model, startBlock, mode) => {
  try {
    const block = await Model.create({ startBlock: startBlock, mode: mode }, { updateOnDuplicate: ["updatedAt", "startBlock"], });
    console.log('insertStartBlock', JSON.parse(JSON.stringify(block, null, 2)))
    return JSON.parse(JSON.stringify(block, null, 2))
  } catch (error) {
    console.log('error', error)
    return false
  }
}

// 更新数据库区块高度
export const updateStartBlock = async (Model, startBlock, mode) => {
  try {
    const block = await Model.update({ startBlock: startBlock }, {
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

// 批量更新pair
export const batchUpdate = async (Model, list, mode) => {
  /**
   * todo 这个事务没有用,因为只有一个写操作. 事务是最少两个写操作的时候,保证这这些写操作,要么成功要么失败,和读操作无关.就算读1亿次,只有一次写操作,都不用开事务
   *      这里要考虑的是是否有分布式事务.或者事务的粒度不够
   *      事务粒度: 比如在事务之外有个写操作,必须要跟下面事务中的写操作保持原子性,那么事务开启的地方就错了,要写在你想保证原子性的地方
   *      分布式事务: 线程/进程 之间要保证写操作原子性,client.transaction();只是针对当前线程,就不顶用了,需要引入redis来做事务
   */
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
          }
        }
      })
    }
    return true
  } catch (error) {
    console.log('error', error);
    return false
  }
}

// 寻找pair里async_index跟数据库里active_index不一致的pair
export const findDiffPair = async (Model, mode) => {
  try {
    /**
     *todo 这里推荐在mysql中开启status索引,索引就像字典前面的拼音页码查询功能,开启索引后,mysql会将status字段分类记录,这样你查询的时候,mysql就会直接查status=active的分类,而不是全表查询
     */
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

// 更新pair
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

// 批量更新pairinfo
export const batchUpdatePairInfo = async (Model, list) => {
  try {
    await Model.bulkCreate(list, { updateOnDuplicate: ["delta", "fee", "spot_price", "eth_balance", "token_balance", "eth_volume", "update_timestamp", "nft_count", "swap_type", "nft_ids", "nft_id1155", "nft_count1155", "collection_name", "mode"] });
    return true
  } catch (error) {
    console.log('error', error);
    return false
  }
}
