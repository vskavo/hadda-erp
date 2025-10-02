'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Asegurar que la columna monto_total_signed permita NULL correctamente
    await queryInterface.changeColumn('sii_ingresos', 'monto_total_signed', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Monto total con firma digital'
    });

    // Asegurar que la columna monto_total_signed permita NULL correctamente en sii_egresos también
    await queryInterface.changeColumn('sii_egresos', 'monto_total_signed', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Monto total con firma digital'
    });
  },

  async down(queryInterface, Sequelize) {
    // No es necesario hacer cambios en down ya que esto es solo una corrección
  }
};
