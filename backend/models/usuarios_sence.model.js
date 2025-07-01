const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UsuarioSence = sequelize.define('UsuarioSence', {
    rut: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clave_unica: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'usuarios_sence',
    timestamps: false
  });

  return UsuarioSence;
}; 