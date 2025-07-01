'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('participantes', 'certificado', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si el certificado fue enviado al participante'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('participantes', 'certificado');
  }
}; 