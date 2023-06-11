/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-31 20:41:49
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-08 14:39:46
 */
const user = function (sequelize, DataTypes) {
  return sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    age: {
      type: DataTypes.TINYINT,
      defaultValue: 66
    },
    gender: {
      type: DataTypes.ENUM(['男', '女', '妖']),
      defaultValue: '妖'
    }
  }, {
    // 告诉 sequelize 不需要自动将表名变成复数
    freezeTableName: true,

    // 不需要自动创建 createAt / updateAt 这两个字段
    timestamps: false,
  });
};
export default user;