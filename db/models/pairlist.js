/*
 * @Descripttion :
 * @version      : 1.0.0
 * @Author       :
 * @Date         : 2023-05-30 14:37:52
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-08 10:17:00
 */
const Pairlist = function (sequelize, DataTypes) {
  return sequelize.define(
    `pair_list`,
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      pair_address: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "active",
      },
      mode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: `pair_list`,
      timestamps: true,
      indexes: [
        {
          name: "pair_list_status_mode",
          using: "BTREE",
          fields: [
            {
              name: "status",
            },
            {
              name: "mode",
            },
          ],
        },
        {
          name: "pair_address_mode",
          unique: true,
          using: "BTREE",
          fields: [{ name: "pair_address" }, { name: "mode" }],
        },
      ],
    }
  );
};
export default Pairlist;
