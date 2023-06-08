/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-31 20:41:49
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-08 10:16:49
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
    }
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