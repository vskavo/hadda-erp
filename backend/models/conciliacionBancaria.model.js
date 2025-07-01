const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConciliacionBancaria = sequelize.define('ConciliacionBancaria', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cuenta_bancaria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cuentas_bancarias',
        key: 'id'
      }
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: false
    },
    saldo_inicial: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    saldo_final: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    saldo_banco: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    diferencia: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0
    },
    estado: {
      type: DataTypes.ENUM('en_progreso', 'finalizada', 'anulada'),
      defaultValue: 'en_progreso'
    },
    observaciones: {
      type: DataTypes.TEXT
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_finalizacion: {
      type: DataTypes.DATE
    },
    archivo_extracto: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'conciliaciones_bancarias',
    timestamps: true,
    hooks: {
      beforeCreate: (conciliacion) => {
        conciliacion.diferencia = parseFloat(conciliacion.saldo_banco) - parseFloat(conciliacion.saldo_final);
      },
      beforeUpdate: (conciliacion) => {
        if (conciliacion.changed('saldo_banco') || conciliacion.changed('saldo_final')) {
          conciliacion.diferencia = parseFloat(conciliacion.saldo_banco) - parseFloat(conciliacion.saldo_final);
        }
        
        // Si el estado cambia a finalizada, registrar la fecha
        if (conciliacion.changed('estado') && conciliacion.estado === 'finalizada') {
          conciliacion.fecha_finalizacion = new Date();
        }
      }
    }
  });

  // Modelo para registrar movimientos conciliados
  const MovimientoConciliacion = sequelize.define('MovimientoConciliacion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    conciliacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'conciliaciones_bancarias',
        key: 'id'
      }
    },
    tipo_movimiento: {
      type: DataTypes.ENUM('ingreso', 'egreso', 'ajuste'),
      allowNull: false
    },
    movimiento_id: {
      type: DataTypes.INTEGER
    },
    descripcion: {
      type: DataTypes.STRING
    },
    monto: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false
    },
    conciliado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    referencia_banco: {
      type: DataTypes.STRING
    },
    observaciones: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'movimientos_conciliacion',
    timestamps: true
  });

  // Establecer relaciones
  ConciliacionBancaria.hasMany(MovimientoConciliacion, {
    foreignKey: 'conciliacion_id',
    as: 'Movimientos'
  });
  
  MovimientoConciliacion.belongsTo(ConciliacionBancaria, {
    foreignKey: 'conciliacion_id',
    as: 'Conciliacion'
  });

  return { ConciliacionBancaria, MovimientoConciliacion };
}; 