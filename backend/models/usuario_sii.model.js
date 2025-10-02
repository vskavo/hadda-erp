const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UsuarioSii = sequelize.define('UsuarioSii', {
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
    tableName: 'usuario_sii',
    timestamps: false
  });

  return UsuarioSii;
};
