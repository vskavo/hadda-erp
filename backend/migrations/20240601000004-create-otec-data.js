'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('otec_data', {
      rut: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      razon_social_otec: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nombre_otec: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('otec_data');
  }
}; 