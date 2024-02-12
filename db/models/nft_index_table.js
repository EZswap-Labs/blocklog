const nft_index_table = function (sequelize, DataTypes) {
    return sequelize.define("nft_index", { 
      collection_address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      token_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      owner_address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      block_number: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      mode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      update_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      freezeTableName: true,
      indexes: [
        {
          name: 'unique_collection_token_mode',
          fields: ['collection_address', 'token_id', 'mode'],
          unique: true
        }
      ]
    });
  };
  export default nft_index_table;
  