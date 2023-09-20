/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-31 20:41:49
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-13 18:45:49
 */
const blockConfig = function (sequelize, DataTypes) {
  return sequelize.define(`block_config`, {
    startBlock: { 
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    mode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    update_timestamp: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "1681455607"
    },
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
  }, {
    sequelize,
    tableName: `block_config`,
    timestamps: true,
    indexes: [
      {
        name: "startBlock",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "startBlock" },
          { name: "mode" }
        ]
      }
    ]
  });
};
export default blockConfig;