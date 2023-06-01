/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-30 14:24:54
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-01 12:11:18
 */
import Sequelize from 'sequelize';
let client = null;
export async function getMySqlClient () {
  const params = {
    host: process.env.HOST,
    port: process.env.PORT,
    dialect: 'mysql',
    retry: {
      match: [
        /SQLITE_BUSY/,
      ],
      name: 'query',
      max: 0,
    },
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
    },
    logging: false, // 关闭日志
    // logging: (...msg) => console.log(msg), // 打印日志
    timezone: '+08:00',
    pool: {
      max: 20, // 最大连接数
      min: 5,     // 最小连接数
      acquire: 10000,   // 请求超时时间
      idle: 10000, // 断开连接后，连接实例在连接池保持的时间
    },
    define: {
      timestamps: false,
    },
    transactionType: 'IMMEDIATE',
    operatorsAliases: 0,
    logQueryParameters: true,
  };
  // 如果已经连接过了，直接返回
  if (client) {
    return client
  }
  try {
    // 连接数据库
    let sequelize = new Sequelize(process.env.DATABASE, process.env.USERNAME, process.env.PASSWORD, params)
    try {
      // 测试连接
      await sequelize.authenticate();
      // 将连接实例赋值给client
      client = sequelize;
      console.log('Connection has been established successfully.');
    } catch (error) {
      // 连接失败，将client置为null
      client = null
      console.error('Unable to connect to the database:', error);
    }
    // 返回连接实例
    return client;
  } catch (error) {
    console.log('connect failed', error.message)
    return null;
  }
}