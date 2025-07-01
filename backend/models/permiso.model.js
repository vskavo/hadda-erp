const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permiso = sequelize.define('Permiso', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT
    },
    modulo: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Módulo al que pertenece este permiso'
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Código único para identificar el permiso (ej: USUARIOS_CREAR)'
    },
    sistema: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si es un permiso predefinido del sistema (no eliminable)'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'permisos',
    timestamps: true
  });

  return Permiso;
}; 