const nft_echo_table = function (sequelize, DataTypes) {
  return sequelize.define("nft_echo", { 
    token_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    owner_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    block_number: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    update_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });
};
export default nft_echo_table;
