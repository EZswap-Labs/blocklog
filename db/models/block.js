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
      unique: true,
      defaultValue: 0,
    },
    mode: {
      primaryKey: true,
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true,
    },
    update_timestamp: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "1681455607"
    },
  }, {
    sequelize,
    tableName: `block_config`,
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "mode" }
        ]
      }
    ]
  });
};
export default blockConfig;