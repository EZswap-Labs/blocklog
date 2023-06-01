const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ezswap_pool', {
    id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true,
      comment: "0xfa2f98f339a14f4c3b7a1f594e4314f5fde89406"
    },
    collection: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "0xc7a096b4c6610ba3a836070333ff7922b9866a36"
    },
    owner: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "0xe3a463d743f762d538031bad3f1e748bb41f96ec"
    },
    token: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "null"
    },
    type: {
      type: DataTypes.STRING(2),
      allowNull: true,
      comment: "2"
    },
    asset_recipient: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "0x0000000000000000000000000000000000000000"
    },
    bonding_curve: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "0xfad6ba8976b23faf7f7c9b7aeee1a9e2c953d2c5"
    },
    delta: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "0"
    },
    fee: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "0"
    },
    spot_price: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "995024875621891"
    },
    eth_balance: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "null"
    },
    token_balance: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "null"
    },
    eth_volume: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "0"
    },
    create_timestamp: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "1676971198"
    },
    update_timestamp: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "1681455607"
    },
    nft_count: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "0"
    },
    mode: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    swap_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    nft_ids: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    from_platform: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is1155: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    nft_id1155: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    nft_count1155: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    collection_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    token_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ezswap_pool',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "collection",
        using: "BTREE",
        fields: [
          { name: "collection" },
          { name: "mode" },
          { name: "type" },
        ]
      },
      {
        name: "uni",
        using: "BTREE",
        fields: [
          { name: "id" },
          { name: "mode" },
        ]
      },
    ]
  });
};
