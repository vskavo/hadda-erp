const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SiiEgreso = sequelize.define('SiiEgreso', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    proyecto_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'proyectos',
        key: 'id'
      }
    },
    tipo_dte: {
      type: DataTypes.STRING(3),
      allowNull: false,
      comment: 'Tipo de Documento Tributario Electrónico'
    },
    folio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Número de folio del documento'
    },
    fecha_emision: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Fecha de emisión del documento'
    },
    fecha_venc: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de vencimiento del documento'
    },
    proveedor_rut: {
      type: DataTypes.STRING(12),
      allowNull: false,
      comment: 'RUT del proveedor/emisor'
    },
    proveedor_nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nombre del proveedor/emisor'
    },
    receptor_rut: {
      type: DataTypes.STRING(12),
      allowNull: false,
      comment: 'RUT del receptor/empresa'
    },
    receptor_nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nombre del receptor/empresa'
    },
    monto_neto: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Monto neto del documento'
    },
    monto_exento: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Monto exento del documento'
    },
    iva: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Monto del IVA'
    },
    tasa_iva: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 19.00,
      comment: 'Tasa de IVA aplicada'
    },
    monto_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Monto total del documento'
    },
    estado_sii: {
      type: DataTypes.ENUM('ACEPTADO', 'RECHAZADO', 'PENDIENTE', 'ANULADO'),
      defaultValue: 'PENDIENTE',
      comment: 'Estado del documento en el SII'
    },
    url_xml: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL del archivo XML del documento'
    },
    url_pdf: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL del archivo PDF del documento'
    },
    ref_tipo_dte: {
      type: DataTypes.STRING(3),
      allowNull: true,
      comment: 'Tipo de documento de referencia'
    },
    ref_folio: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Folio del documento de referencia'
    },
    ref_fecha: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha del documento de referencia'
    },
    ref_cod: {
      type: DataTypes.STRING(3),
      allowNull: true,
      comment: 'Código de referencia'
    },
    ref_razon: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Razón de referencia'
    },
    digest_xml: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Digest del XML para validación'
    },
    source_filename: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Nombre del archivo fuente'
    },
    monto_total_signed: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Monto total con firma digital (GENERATED ALWAYS)',
      // IMPORTANTE: Esta columna es GENERATED ALWAYS en PostgreSQL
      // Sequelize no debe intentar insertar/actualizar esta columna
      // Se calcula automáticamente con una expresión como:
      // CASE WHEN tipo_dte=61 THEN -monto_total ELSE monto_total END
    }
  }, {
    tableName: 'sii_egresos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['tipo_dte', 'folio']
      },
      {
        fields: ['proveedor_rut']
      },
      {
        fields: ['receptor_rut']
      },
      {
        fields: ['fecha_emision']
      },
      {
        fields: ['estado_sii']
      },
      {
        fields: ['proyecto_id']
      }
    ]
  });

  // Definir asociaciones
  SiiEgreso.associate = (models) => {
    SiiEgreso.belongsTo(models.Proyecto, {
      foreignKey: 'proyecto_id',
      as: 'Proyecto'
    });
  };

  return SiiEgreso;
};
