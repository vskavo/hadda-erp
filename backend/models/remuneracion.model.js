const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Remuneracion = sequelize.define('Remuneracion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sueldo_base: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    gratificacion: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    horas_extra: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    monto_horas_extra: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    bonos: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    aguinaldo: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    comisiones: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_haberes_imponibles: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_haberes_no_imponibles: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_haberes: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    afp_nombre: {
      type: DataTypes.STRING
    },
    afp_porcentaje: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    afp_monto: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    isapre_nombre: {
      type: DataTypes.STRING
    },
    isapre_monto: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    fonasa_monto: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    seguro_cesantia_trabajador: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    seguro_cesantia_empleador: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    impuesto_renta: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_descuentos_legales: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    anticipos: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    otros_descuentos: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_descuentos: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    sueldo_liquido: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    fecha_pago: {
      type: DataTypes.DATE
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'anulado'),
      defaultValue: 'pendiente'
    },
    metodo_pago: {
      type: DataTypes.ENUM('transferencia', 'cheque', 'efectivo', 'otro'),
      defaultValue: 'transferencia'
    },
    cuenta_bancaria_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'cuentas_bancarias',
        key: 'id'
      }
    },
    url_liquidacion: {
      type: DataTypes.STRING
    },
    observaciones: {
      type: DataTypes.TEXT
    },
    dias_trabajados: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    },
    estado_envio: {
      type: DataTypes.ENUM('pendiente', 'enviado', 'recibido'),
      defaultValue: 'pendiente'
    },
    fecha_envio: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'remuneraciones',
    timestamps: true,
    hooks: {
      beforeCreate: (remuneracion) => {
        // Calcular totales
        remuneracion.total_haberes_imponibles = 
          parseFloat(remuneracion.sueldo_base) + 
          parseFloat(remuneracion.gratificacion) + 
          parseFloat(remuneracion.monto_horas_extra) +
          parseFloat(remuneracion.comisiones);
        
        remuneracion.total_haberes_no_imponibles = 
          parseFloat(remuneracion.bonos) + 
          parseFloat(remuneracion.aguinaldo);
        
        remuneracion.total_haberes = 
          parseFloat(remuneracion.total_haberes_imponibles) + 
          parseFloat(remuneracion.total_haberes_no_imponibles);
        
        remuneracion.total_descuentos_legales = 
          parseFloat(remuneracion.afp_monto) + 
          parseFloat(remuneracion.isapre_monto) + 
          parseFloat(remuneracion.fonasa_monto) +
          parseFloat(remuneracion.seguro_cesantia_trabajador) +
          parseFloat(remuneracion.impuesto_renta);
        
        remuneracion.total_descuentos = 
          parseFloat(remuneracion.total_descuentos_legales) + 
          parseFloat(remuneracion.anticipos) + 
          parseFloat(remuneracion.otros_descuentos);
        
        remuneracion.sueldo_liquido = 
          parseFloat(remuneracion.total_haberes) - 
          parseFloat(remuneracion.total_descuentos);
      }
    }
  });

  return Remuneracion;
}; 