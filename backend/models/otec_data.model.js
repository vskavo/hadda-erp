const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OtecData = sequelize.define('OtecData', {
    rut: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    razon_social_otec: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nombre_otec: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'otec_data',
    timestamps: false
  });

  return OtecData;
}; 