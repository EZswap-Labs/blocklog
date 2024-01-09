const tokenIdAddress = function (sequelize, DataTypes) {
  return sequelize.define(
    "tokenid_address",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      token_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "",
      },
      address: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "",
      },
    },
  );
};
export default tokenIdAddress;
