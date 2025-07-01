const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DeclaracionJurada = sequelize.define('DeclaracionJurada', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_sence: {
      type: DataTypes.STRING
    },
    estado: {
      type: DataTypes.STRING,
      defaultValue: 'borrador'
    },
    rut: {
      type: DataTypes.STRING
    },
    nombre: {
      type: DataTypes.STRING
    },
    sesiones: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'declaraciones_juradas',
    timestamps: true
  });

  return DeclaracionJurada;
}; 