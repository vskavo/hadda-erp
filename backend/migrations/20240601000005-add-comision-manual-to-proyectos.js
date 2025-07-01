"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('proyectos', 'usar_comision_manual', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si se debe usar el valor manual de comisión'
    });
    await queryInterface.addColumn('proyectos', 'comision_manual', {
      type: Sequelize.DECIMAL(5,2),
      allowNull: true,
      comment: 'Porcentaje de comisión definido manualmente por un admin'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('proyectos', 'usar_comision_manual');
    await queryInterface.removeColumn('proyectos', 'comision_manual');
  }
}; 