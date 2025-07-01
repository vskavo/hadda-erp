const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Venta = sequelize.define('Venta', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    proyecto_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'proyectos',
        key: 'id'
      }
    },
    cotizacion_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'cotizaciones',
        key: 'id'
      }
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT
    },
    fecha_venta: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    monto_neto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    iva: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    monto_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_proceso', 'completada', 'facturada', 'anulada'),
      defaultValue: 'pendiente'
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
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
    metodo_pago: {
      type: DataTypes.STRING
    },
    observaciones: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'ventas',
    timestamps: true,
    hooks: {
      beforeCreate: (venta) => {
        // Calcular montos si no están definidos
        if (venta.monto_neto && !venta.monto_total) {
          // Calcular IVA y total
          venta.iva = parseFloat((venta.monto_neto * 0.19).toFixed(2));
          venta.monto_total = parseFloat((parseFloat(venta.monto_neto) + parseFloat(venta.iva)).toFixed(2));
        }
      }
    }
  });

  return Venta;
}; 