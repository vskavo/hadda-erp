const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CursoSence = sequelize.define('CursoSence', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo_curso: {
      type: DataTypes.STRING,
      allowNull: true
    },
    solicitud_curso: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nombre_curso: {
      type: DataTypes.STRING,
      allowNull: false
    },
    modalidad: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'A distancia, elearning o presencial'
    },
    modo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nivel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    horas: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    valor_franquicia: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    valor_efectivo_participante: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    valor_imputable_participante: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    resolucion_autorizacion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: true
    },
    numero_deposito: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fecha_ingreso: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_evaluacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_resolucion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_vigencia: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_pago: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'cursos_sence',
    timestamps: false
  });

  return CursoSence;
}; 