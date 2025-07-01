const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ingreso = sequelize.define('Ingreso', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: false
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    proyecto_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'proyectos',
        key: 'id'
      }
    },
    factura_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'facturas',
        key: 'id'
      }
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    tipo_ingreso: {
      type: DataTypes.ENUM('factura', 'transferencia', 'cheque', 'efectivo', 'deposito', 'otro'),
      defaultValue: 'factura'
    },
    categoria: {
      type: DataTypes.STRING
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'confirmado', 'anulado'),
      defaultValue: 'pendiente'
    },
    fecha_confirmacion: {
      type: DataTypes.DATE
    },
    cuenta_bancaria_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'cuentas_bancarias',
        key: 'id'
      }
    },
    numero_documento: {
      type: DataTypes.STRING
    },
    fecha_documento: {
      type: DataTypes.DATEONLY
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
    conciliado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fecha_conciliacion: {
      type: DataTypes.DATE
    },
    archivo_respaldo: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'ingresos',
    timestamps: true,
    hooks: {
      // Se elimina la validación que requería factura_id para ingresos de tipo factura
    }
  });

  return Ingreso;
}; 