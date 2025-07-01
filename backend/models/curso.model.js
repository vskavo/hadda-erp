const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Curso = sequelize.define('Curso', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    codigo_sence: {
      type: DataTypes.STRING,
      unique: false
    },
    id_sence: {
      type: DataTypes.STRING,
      unique: true
    },
    duracion_horas: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    valor_hora: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    valor_participante: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    modalidad: {
      type: DataTypes.STRING,
      defaultValue: 'presencial'
    },
    descripcion: {
      type: DataTypes.TEXT
    },
    objetivos: {
      type: DataTypes.TEXT
    },
    contenidos: {
      type: DataTypes.TEXT
    },
    requisitos: {
      type: DataTypes.TEXT
    },
    materiales: {
      type: DataTypes.TEXT
    },
    nro_participantes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY
    },
    fecha_fin: {
      type: DataTypes.DATEONLY
    },
    participantes_aprobados: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    participantes_reprobados: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    participantes_eliminados: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    estado: {
      type: DataTypes.STRING,
      defaultValue: 'activo'
    },
    estado_sence: {
      type: DataTypes.STRING,
      defaultValue: 'pendiente'
    },
    tipo_de_contrato: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estado_pre_contrato: {
      type: DataTypes.STRING,
      allowNull: true
    },
    proyecto_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'proyectos',
        key: 'id'
      }
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    owner: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Propietario del curso, FK a usuarios.id'
    },
    owner_operaciones: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      comment: 'Responsable de operaciones, FK a usuarios.id'
    }
  }, {
    tableName: 'cursos',
    timestamps: true
  });

  Curso.belongsTo(sequelize.models.Usuario, {
    foreignKey: 'owner_operaciones',
    as: 'ResponsableOperaciones'
  });

  return Curso;
}; 