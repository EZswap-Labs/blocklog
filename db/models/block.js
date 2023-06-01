/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-31 20:41:49
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-05-31 20:53:53
 */
const blockConfig = function (sequelize, DataTypes, chainName) {
  return sequelize.define(`${chainName}_blockConfig`, {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    startBlock: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      defaultValue: 0,
    }
  }, {
    sequelize,
    tableName: `${chainName}_blockConfig`,
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" }
        ]
      }
    ]
  });
};
export default blockConfig;