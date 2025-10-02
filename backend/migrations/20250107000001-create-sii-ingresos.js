'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sii_ingresos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      proyecto_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'proyectos',
          key: 'id'
        },
        allowNull: true
      },
      tipo_dte: {
        type: Sequelize.STRING(3),
        allowNull: false,
        comment: 'Tipo de Documento Tributario Electrónico'
      },
      folio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Número de folio del documento'
      },
      fecha_emision: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Fecha de emisión del documento'
      },
      fecha_venc: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha de vencimiento del documento'
      },
      cliente_rut: {
        type: Sequelize.STRING(12),
        allowNull: false,
        comment: 'RUT del cliente/receptor'
      },
      cliente_nombre: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Nombre del cliente/receptor'
      },
      emisor_rut: {
        type: Sequelize.STRING(12),
        allowNull: false,
        comment: 'RUT del emisor'
      },
      emisor_nombre: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Nombre del emisor'
      },
      monto_neto: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Monto neto del documento'
      },
      monto_exento: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Monto exento del documento'
      },
      iva: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Monto del IVA'
      },
      tasa_iva: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 19.00,
        comment: 'Tasa de IVA aplicada'
      },
      monto_total: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Monto total del documento'
      },
      estado_sii: {
        type: Sequelize.ENUM('ACEPTADO', 'RECHAZADO', 'PENDIENTE', 'ANULADO'),
        defaultValue: 'PENDIENTE',
        comment: 'Estado del documento en el SII'
      },
      url_xml: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL del archivo XML del documento'
      },
      url_pdf: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL del archivo PDF del documento'
      },
      ref_tipo_dte: {
        type: Sequelize.STRING(3),
        allowNull: true,
        comment: 'Tipo de documento de referencia'
      },
      ref_folio: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Folio del documento de referencia'
      },
      ref_fecha: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha del documento de referencia'
      },
      ref_cod: {
        type: Sequelize.STRING(3),
        allowNull: true,
        comment: 'Código de referencia'
      },
      ref_razon: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Razón de referencia'
      },
      digest_xml: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Digest del XML para validación'
      },
      source_filename: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Nombre del archivo fuente'
      },
      monto_total_signed: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Monto total con firma digital'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Crear índices
    await queryInterface.addIndex('sii_ingresos', ['tipo_dte', 'folio']);
    await queryInterface.addIndex('sii_ingresos', ['emisor_rut']);
    await queryInterface.addIndex('sii_ingresos', ['fecha_emision']);
    await queryInterface.addIndex('sii_ingresos', ['estado_sii']);
    await queryInterface.addIndex('sii_ingresos', ['proyecto_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sii_ingresos');
  }
};
