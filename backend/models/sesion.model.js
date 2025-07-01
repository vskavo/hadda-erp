const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sesion = sequelize.define('Sesion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    curso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Cursos',
        key: 'id'
      }
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Usuarios',
        key: 'id'
      },
      comment: 'Usuario que creó o modificó la sesión'
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Número de la sesión dentro del curso'
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Fecha de la sesión'
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Hora de inicio de la sesión'
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Hora de fin de la sesión'
    },
    duracion_minutos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duración de la sesión en minutos'
    },
    modalidad: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'presencial',
      comment: 'Modalidad de la sesión'
    },
    ubicacion: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Ubicación física o enlace de la sesión'
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Contenido o temario de la sesión'
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'programada',
      comment: 'Estado de la sesión'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observaciones adicionales sobre la sesión'
    }
  }, {
    tableName: 'sesiones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Sesion;
}; 