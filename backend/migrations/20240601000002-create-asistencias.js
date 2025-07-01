'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear tipo ENUM para PostgreSQL
    await queryInterface.sequelize.query('CREATE TYPE "asistencia_estado_enum" AS ENUM (\'presente\', \'ausente\', \'justificado\', \'atraso\')');
    
    await queryInterface.createTable('Asistencias', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      participante_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Participantes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      sesion_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Sesiones',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      estado: {
        type: Sequelize.DataTypes.ENUM,
        values: ['presente', 'ausente', 'justificado', 'atraso'],
        allowNull: false,
        defaultValue: 'ausente'
      },
      hora_entrada: {
        type: Sequelize.TIME,
        allowNull: true
      },
      hora_salida: {
        type: Sequelize.TIME,
        allowNull: true
      },
      duracion_minutos: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Crear índice único para participante_id y fecha
    await queryInterface.addIndex('Asistencias', ['participante_id', 'fecha'], {
      unique: true,
      name: 'asistencia_participante_fecha_unique'
    });

    // Crear índice para búsquedas por curso y fecha
    await queryInterface.addIndex('Asistencias', ['curso_id', 'fecha'], {
      name: 'asistencia_curso_fecha_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Asistencias');
    
    // Eliminar el tipo ENUM
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "asistencia_estado_enum"');
  }
}; 