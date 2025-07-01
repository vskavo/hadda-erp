const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HitoProyecto = sequelize.define('HitoProyecto', {
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
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT
    },
    fecha_objetivo: {
      type: DataTypes.DATE
    },
    prioridad: {
      type: DataTypes.ENUM('baja', 'media', 'alta', 'crítica'),
      defaultValue: 'media'
    },
    porcentaje_proyecto: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Porcentaje que representa este hito en el avance total del proyecto'
    },
    completado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fecha_completado: {
      type: DataTypes.DATE
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    orden: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'hitos_proyecto',
    timestamps: true
  });

  return HitoProyecto;
}; 