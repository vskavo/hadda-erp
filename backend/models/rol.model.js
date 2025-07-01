const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rol = sequelize.define('Rol', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    descripcion: {
      type: DataTypes.TEXT
    },
    sistema: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si es un rol predefinido del sistema (no eliminable)'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'roles',
    timestamps: true
  });

  return Rol;
}; 