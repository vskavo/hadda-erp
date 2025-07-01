const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cotizacion = sequelize.define('Cotizacion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero_cotizacion: {
      type: DataTypes.STRING,
      unique: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
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
    fecha_emision: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_validez: {
      type: DataTypes.DATE,
      allowNull: false
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
    descuento_porcentaje: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    descuento_monto: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'enviada', 'aprobada', 'rechazada', 'vencida', 'convertida'),
      defaultValue: 'borrador'
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    contacto_nombre: {
      type: DataTypes.STRING
    },
    contacto_email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    contacto_telefono: {
      type: DataTypes.STRING
    },
    fecha_envio: {
      type: DataTypes.DATE
    },
    fecha_respuesta: {
      type: DataTypes.DATE
    },
    url_pdf: {
      type: DataTypes.STRING
    },
    observaciones: {
      type: DataTypes.TEXT
    },
    condiciones_pago: {
      type: DataTypes.TEXT
    },
    plazo_entrega: {
      type: DataTypes.STRING
    },
    incluye_iva: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    venta_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'ventas',
        key: 'id'
      }
    }
  }, {
    tableName: 'cotizaciones',
    timestamps: true,
    hooks: {
      beforeCreate: (cotizacion) => {
        // Generación de número de cotización si no está definido
        if (!cotizacion.numero_cotizacion) {
          const anio = new Date().getFullYear();
          const mes = (new Date().getMonth() + 1).toString().padStart(2, '0');
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          cotizacion.numero_cotizacion = `COT-${anio}${mes}-${random}`;
        }
        
        // Calcular montos si incluye IVA
        if (cotizacion.incluye_iva) {
          // Calcular monto neto y descuento
          let montoNeto = parseFloat(cotizacion.monto_neto);
          const descuentoPorcentaje = parseFloat(cotizacion.descuento_porcentaje) || 0;
          
          if (descuentoPorcentaje > 0) {
            cotizacion.descuento_monto = parseFloat((montoNeto * descuentoPorcentaje / 100).toFixed(2));
            montoNeto -= cotizacion.descuento_monto;
          }
          
          // Calcular IVA y total
          cotizacion.iva = parseFloat((montoNeto * 0.19).toFixed(2));
          cotizacion.monto_total = parseFloat((montoNeto + cotizacion.iva).toFixed(2));
        }
        
        // Establecer fecha de validez si no está definida (30 días por defecto)
        if (!cotizacion.fecha_validez) {
          const fechaValidez = new Date(cotizacion.fecha_emision);
          fechaValidez.setDate(fechaValidez.getDate() + 30);
          cotizacion.fecha_validez = fechaValidez;
        }
      }
    }
  });

  return Cotizacion;
}; 