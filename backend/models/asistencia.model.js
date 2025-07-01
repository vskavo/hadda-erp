const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Asistencia = sequelize.define('Asistencia', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    participante_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Participantes',
        key: 'id'
      }
    },
    curso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Cursos',
        key: 'id'
      }
    },
    sesion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Sesiones',
        key: 'id'
      },
      comment: 'Referencia opcional a la sesión específica'
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Fecha de la asistencia'
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'ausente',
      comment: 'Estado de asistencia del participante'
    },
    hora_entrada: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Hora de entrada registrada'
    },
    hora_salida: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Hora de salida registrada'
    },
    duracion_minutos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duración de la asistencia en minutos'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observaciones sobre la asistencia'
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Usuarios',
        key: 'id'
      },
      comment: 'Usuario que registró la asistencia'
    }
  }, {
    tableName: 'asistencias',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['participante_id', 'fecha'],
        name: 'asistencia_participante_fecha_unique'
      }
    ]
  });

  return Asistencia;
}; 