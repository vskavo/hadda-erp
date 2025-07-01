const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Egreso = sequelize.define('Egreso', {
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
    proveedor_nombre: {
      type: DataTypes.STRING
    },
    proveedor_rut: {
      type: DataTypes.STRING,
      validate: {
        // Validación de formato RUT chileno (XX.XXX.XXX-X)
        is: /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$/
      }
    },
    tipo_documento: {
      type: DataTypes.ENUM('factura', 'boleta', 'transferencia', 'cheque', 'efectivo', 'nota_credito', 'otro'),
      defaultValue: 'factura'
    },
    numero_documento: {
      type: DataTypes.STRING
    },
    fecha_documento: {
      type: DataTypes.DATEONLY
    },
    categoria: {
      type: DataTypes.STRING
    },
    subcategoria: {
      type: DataTypes.STRING
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'anulado'),
      defaultValue: 'pendiente'
    },
    fecha_pago: {
      type: DataTypes.DATE
    },
    cuenta_bancaria_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'cuentas_bancarias',
        key: 'id'
      }
    },
    metodo_pago: {
      type: DataTypes.ENUM('transferencia', 'cheque', 'efectivo', 'tarjeta_credito', 'tarjeta_debito', 'otro'),
      defaultValue: 'transferencia'
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    observaciones: {
      type: DataTypes.TEXT
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
    },
    retencion_impuesto: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    iva: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    monto_neto: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    }
  }, {
    tableName: 'egresos',
    timestamps: true,
    hooks: {
      beforeCreate: (egreso) => {
        // Calcular IVA y monto neto si no están definidos
        if (egreso.tipo_documento === 'factura' && egreso.monto && !egreso.monto_neto) {
          egreso.monto_neto = parseFloat((egreso.monto / 1.19).toFixed(2));
          egreso.iva = parseFloat((egreso.monto - egreso.monto_neto).toFixed(2));
        }
      }
    }
  });

  return Egreso;
}; 