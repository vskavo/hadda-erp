'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si la columna ya existe
    const tableInfo = await queryInterface.describeTable('Participantes');
    
    if (!tableInfo.porcentaje_asistencia) {
      await queryInterface.addColumn('Participantes', 'porcentaje_asistencia', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Participantes', 'porcentaje_asistencia');
  }
}; 