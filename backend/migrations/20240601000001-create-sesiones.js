'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Sesiones', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      curso_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Cursos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      numero: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      hora_inicio: {
        type: Sequelize.TIME,
        allowNull: true
      },
      hora_fin: {
        type: Sequelize.TIME,
        allowNull: true
      },
      duracion_minutos: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      modalidad: {
        type: Sequelize.ENUM('presencial', 'online', 'mixta'),
        allowNull: true,
        defaultValue: 'presencial'
      },
      ubicacion: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contenido: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('programada', 'en_curso', 'finalizada', 'cancelada', 'reprogramada'),
        allowNull: false,
        defaultValue: 'programada'
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Crear índice único para curso_id y numero
    await queryInterface.addIndex('Sesiones', ['curso_id', 'numero'], {
      unique: true,
      name: 'sesion_curso_numero_unique'
    });

    // Crear índice para búsquedas por fecha
    await queryInterface.addIndex('Sesiones', ['fecha'], {
      name: 'sesion_fecha_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Sesiones');
  }
}; 