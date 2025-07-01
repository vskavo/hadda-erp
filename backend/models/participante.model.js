const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Participante = sequelize.define('Participante', {
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
    rut: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        // Nueva validación: acepta formato 12345678-9
        is: /^\d{7,8}-[\dkK]{1}$/
      }
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    telefono: {
      type: DataTypes.STRING
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY
    },
    genero: {
      type: DataTypes.STRING
    },
    direccion: {
      type: DataTypes.STRING
    },
    comuna: {
      type: DataTypes.STRING
    },
    ciudad: {
      type: DataTypes.STRING
    },
    nivel_educacional: {
      type: DataTypes.STRING
    },
    empresa: {
      type: DataTypes.STRING
    },
    cargo: {
      type: DataTypes.STRING
    },
    estado: {
      type: DataTypes.STRING,
      defaultValue: 'inscrito'
    },
    porcentaje_asistencia: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    nota_final: {
      type: DataTypes.DECIMAL(3, 1),
      validate: {
        min: 1.0,
        max: 7.0
      }
    },
    fecha_inscripcion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    observaciones: {
      type: DataTypes.TEXT
    },
    tramo_sence: {
      type: DataTypes.STRING(10)
    },
    certificado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si el certificado fue enviado al participante'
    }
  }, {
    tableName: 'participantes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['curso_id', 'rut'],
        name: 'participante_curso_rut_unique'
      }
    ]
  });

  return Participante;
}; 