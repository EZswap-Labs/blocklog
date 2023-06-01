/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-30 14:37:52
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-01 10:57:10
 */
const Pairlist = function (sequelize, DataTypes, chainName) {
  return sequelize.define(`${chainName}_pair`, {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    pair_address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'active',
    }
  }, {
    sequelize,
    tableName: `${chainName}_pairlist`,
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
export default Pairlist;