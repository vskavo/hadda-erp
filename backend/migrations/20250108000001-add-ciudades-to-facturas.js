'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('facturas', 'ciudad_emision', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Santiago'
    });

    await queryInterface.addColumn('facturas', 'ciudad_receptor', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Santiago'
    });

    // Hacer numero_factura opcional
    await queryInterface.changeColumn('facturas', 'numero_factura', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    // Actualizar ENUM de estado para incluir 'borrador'
    await queryInterface.changeColumn('facturas', 'estado', {
      type: Sequelize.ENUM('borrador', 'emitida', 'pagada', 'anulada', 'vencida'),
      defaultValue: 'borrador'
    });

    // Actualizar ENUM de metodo_pago para incluir 'CREDITO'
    await queryInterface.changeColumn('facturas', 'metodo_pago', {
      type: Sequelize.ENUM('CREDITO', 'transferencia', 'cheque', 'efectivo', 'tarjeta', 'otro'),
      defaultValue: 'CREDITO'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('facturas', 'ciudad_emision');
    await queryInterface.removeColumn('facturas', 'ciudad_receptor');

    // Revertir cambios en numero_factura
    await queryInterface.changeColumn('facturas', 'numero_factura', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });

    // Revertir cambios en estado
    await queryInterface.changeColumn('facturas', 'estado', {
      type: Sequelize.ENUM('emitida', 'pagada', 'anulada', 'vencida'),
      defaultValue: 'emitida'
    });

    // Revertir cambios en metodo_pago
    await queryInterface.changeColumn('facturas', 'metodo_pago', {
      type: Sequelize.ENUM('transferencia', 'cheque', 'efectivo', 'tarjeta', 'otro'),
      defaultValue: 'transferencia'
    });
  }
};
