const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reporte = sequelize.define('Reporte', {
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
    formato: {
      type: DataTypes.ENUM('pdf', 'excel', 'csv', 'html', 'json'),
      defaultValue: 'pdf'
    },
    fecha_generacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    parametros: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    ruta_archivo: {
      type: DataTypes.STRING
    },
    url_publica: {
      type: DataTypes.STRING
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'generando', 'completado', 'error', 'expirado'),
      defaultValue: 'pendiente'
    },
    predefinido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    programado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    frecuencia: {
      type: DataTypes.ENUM('diario', 'semanal', 'mensual', 'trimestral', 'anual', 'bajo_demanda'),
      defaultValue: 'bajo_demanda'
    },
    proxima_ejecucion: {
      type: DataTypes.DATE
    },
    ultima_ejecucion: {
      type: DataTypes.DATE
    },
    compartido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    roles_permitidos: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    filtros_guardados: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    template_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'reporte_templates',
        key: 'id'
      }
    },
    tamano_archivo: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    contador_descargas: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    fecha_expiracion: {
      type: DataTypes.DATE
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'reportes',
    timestamps: true,
    hooks: {
      beforeCreate: (reporte) => {
        // Establecer fecha de expiración para reportes (30 días por defecto)
        if (!reporte.fecha_expiracion) {
          const fechaExpiracion = new Date(reporte.fecha_generacion);
          fechaExpiracion.setDate(fechaExpiracion.getDate() + 30);
          reporte.fecha_expiracion = fechaExpiracion;
        }
        
        // Establecer próxima ejecución si es programado
        if (reporte.programado && !reporte.proxima_ejecucion) {
          const fechaProxima = new Date();
          
          switch (reporte.frecuencia) {
            case 'diario':
              fechaProxima.setDate(fechaProxima.getDate() + 1);
              break;
            case 'semanal':
              fechaProxima.setDate(fechaProxima.getDate() + 7);
              break;
            case 'mensual':
              fechaProxima.setMonth(fechaProxima.getMonth() + 1);
              break;
            case 'trimestral':
              fechaProxima.setMonth(fechaProxima.getMonth() + 3);
              break;
            case 'anual':
              fechaProxima.setFullYear(fechaProxima.getFullYear() + 1);
              break;
            default:
              // bajo_demanda no requiere próxima ejecución
              fechaProxima = null;
          }
          
          if (fechaProxima) {
            reporte.proxima_ejecucion = fechaProxima;
          }
        }
      },
      afterCreate: async (reporte, options) => {
        try {
          // Si es un reporte bajo demanda, iniciamos la generación
          if (reporte.estado === 'pendiente' && reporte.frecuencia === 'bajo_demanda') {
            // Actualizar estado a 'generando'
            await reporte.update({ estado: 'generando' }, { transaction: options.transaction });
            
            // En una implementación real, aquí se enviaría una tarea a una cola
            // para generar el reporte de forma asíncrona
            // Por ejemplo:
            // await enqueueReportGeneration(reporte.id);
          }
        } catch (error) {
          console.error('Error al iniciar generación de reporte:', error);
        }
      }
    }
  });

  return Reporte;
}; 