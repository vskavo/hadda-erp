const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReporteTemplate = sequelize.define('ReporteTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT
    },
    tipo_reporte: {
      type: DataTypes.ENUM(
        'financiero', 
        'ventas', 
        'cursos', 
        'proyectos', 
        'participantes', 
        'clientes', 
        'recursos_humanos',
        'rendimiento',
        'personalizado'
      ),
      allowNull: false
    },
    modulo: {
      type: DataTypes.ENUM(
        'finanzas', 
        'ventas', 
        'cursos', 
        'proyectos', 
        'clientes', 
        'rrhh', 
        'dashboard'
      ),
      allowNull: false
    },
    codigo: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    ruta_template: {
      type: DataTypes.STRING
    },
    formatos_disponibles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['pdf']
    },
    parametros_requeridos: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    query_sql: {
      type: DataTypes.TEXT
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    sistema: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si es una plantilla del sistema (no editable)'
    },
    categoria: {
      type: DataTypes.STRING
    },
    icono: {
      type: DataTypes.STRING
    },
    orden: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    roles_permitidos: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    opciones_configuracion: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    version: {
      type: DataTypes.STRING,
      defaultValue: '1.0'
    }
  }, {
    tableName: 'reporte_templates',
    timestamps: true,
    hooks: {
      beforeCreate: (template) => {
        // Generar código de plantilla automáticamente si no está definido
        if (!template.codigo) {
          const prefix = template.tipo_reporte.substring(0, 3).toUpperCase();
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          template.codigo = `${prefix}-${random}`;
        }
      }
    }
  });

  return ReporteTemplate;
}; 