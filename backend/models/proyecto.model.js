const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proyecto = sequelize.define('Proyecto', {
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
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fecha_fin: {
      type: DataTypes.DATE
    },
    presupuesto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    costo_real: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    estado: {
      type: DataTypes.ENUM('No iniciado', 'En curso', 'Liquidado', 'Facturado'),
      defaultValue: 'No iniciado'
    },
    responsable_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    observaciones: {
      type: DataTypes.TEXT
    },
    prioridad: {
      type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
      defaultValue: 'media'
    },
    porcentaje_avance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    aprobado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    comision_proyecto: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      allowNull: false
    },
    porcentaje_comision: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false
    },
    proyect_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    usar_comision_manual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si se debe usar el valor manual de comisión'
    },
    comision_manual: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Porcentaje de comisión definido manualmente por un admin'
    }
  }, {
    tableName: 'proyectos',
    timestamps: true,
    hooks: {
      beforeCreate: (proyecto) => {
        // No calculamos margen estimado porque no existe en la base de datos
      },
      beforeUpdate: (proyecto) => {
        // No calculamos margen estimado porque no existe en la base de datos
      }
    }
  });

  return Proyecto;
}; 