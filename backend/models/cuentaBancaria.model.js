const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CuentaBancaria = sequelize.define('CuentaBancaria', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    banco: {
      type: DataTypes.STRING,
      allowNull: false
    },
        // En el modelo CuentaBancaria
    ultimo_scraping: {
      type: DataTypes.DATE,
      allowNull: true
    },
    config_scraping: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    estado_scraping: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'activo' // 'activo', 'pausado', 'error'
    },
    tipo_cuenta: {
      type: DataTypes.ENUM('corriente', 'vista', 'ahorro', 'otra'),
      defaultValue: 'corriente'
    },
    numero_cuenta: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    titular: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rut_titular: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        // Validación de formato RUT chileno (XX.XXX.XXX-X)
        is: /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$/
      }
    },
    saldo_actual: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0
    },
    saldo_contable: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0
    },
    fecha_ultimo_movimiento: {
      type: DataTypes.DATE
    },
    fecha_ultima_conciliacion: {
      type: DataTypes.DATE
    },
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    moneda: {
      type: DataTypes.STRING,
      defaultValue: 'CLP'
    },
    observaciones: {
      type: DataTypes.TEXT
    },
    api_key: {
      type: DataTypes.STRING
    },
    api_secret: {
      type: DataTypes.STRING
    },
    api_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    ultimo_saldo_conciliado: {
      type: DataTypes.DECIMAL(14, 2)
    },
    fecha_saldo_conciliado: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'cuentas_bancarias',
    timestamps: true,
    hooks: {
      beforeUpdate: (cuenta) => {
        // Registrar última conciliación si el saldo contable cambia
        if (cuenta.changed('saldo_contable')) {
          cuenta.ultimo_saldo_conciliado = cuenta.saldo_contable;
          cuenta.fecha_saldo_conciliado = new Date();
        }
      }
    }
  });

  return CuentaBancaria;
}; 