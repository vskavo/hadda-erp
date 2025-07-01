const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AvanceProyecto = sequelize.define('AvanceProyecto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    proyecto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'proyectos',
        key: 'id'
      }
    },
    porcentaje_anterior: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    porcentaje_nuevo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    nota: {
      type: DataTypes.TEXT
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    }
  }, {
    tableName: 'avances_proyecto',
    timestamps: true
  });

  return AvanceProyecto;
}; 