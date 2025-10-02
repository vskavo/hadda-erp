const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Factura = sequelize.define('Factura', {
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
    numero_factura: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    fecha_emision: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: false
    },
    monto_neto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    iva: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    monto_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'emitida', 'pagada', 'anulada', 'vencida'),
      defaultValue: 'borrador'
    },
    fecha_pago: {
      type: DataTypes.DATE
    },
    metodo_pago: {
      type: DataTypes.ENUM('CREDITO', 'transferencia', 'cheque', 'efectivo', 'tarjeta', 'otro'),
      defaultValue: 'CREDITO'
    },
    observaciones: {
      type: DataTypes.TEXT
    },
    url_pdf: {
      type: DataTypes.STRING
    },
    url_xml: {
      type: DataTypes.STRING
    },
    folio_sii: {
      type: DataTypes.STRING
    },
    proyecto_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'proyectos',
        key: 'id'
      }
    },
    ciudad_emision: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ciudad_receptor: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'facturas',
    timestamps: true,
    hooks: {
      beforeCreate: (factura) => {
        // Calcular fecha de vencimiento si no está definida (30 días por defecto)
        if (!factura.fecha_vencimiento) {
          const fechaEmision = new Date(factura.fecha_emision);
          fechaEmision.setDate(fechaEmision.getDate() + 30);
          factura.fecha_vencimiento = fechaEmision;
        }
      }
    }
  });

  return Factura;
}; 