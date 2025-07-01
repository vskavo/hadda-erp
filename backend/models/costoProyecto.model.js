const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CostoProyecto = sequelize.define('CostoProyecto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    proyecto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'proyectos',
        key: 'id'
      }
    },
    concepto: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo_costo: {
      type: DataTypes.ENUM(
        'recursos_humanos', 
        'materiales', 
        'equipos', 
        'servicios', 
        'logistica', 
        'administrativos', 
        'impuestos', 
        'otros'
      ),
      allowNull: false,
      defaultValue: 'recursos_humanos'
    },
    descripcion: {
      type: DataTypes.STRING
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    estado: {
      type: DataTypes.STRING,
      defaultValue: 'planificado'
    },
    proveedor: {
      type: DataTypes.STRING
    },
    numero_documento: {
      type: DataTypes.STRING
    },
    fecha_documento: {
      type: DataTypes.DATEONLY
    },
    tipo_documento: {
      type: DataTypes.STRING,
      defaultValue: 'factura'
    },
    egreso_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'egresos',
        key: 'id'
      }
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    observaciones: {
      type: DataTypes.TEXT
    },
    adjunto_url: {
      type: DataTypes.STRING
    },
    aprobado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    aprobado_por: {
      type: DataTypes.INTEGER,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    incluido_rentabilidad: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    aplica_iva: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Indica si este costo debe tener IVA aplicado o no'
    },
    aplica_honorarios: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si este costo es un honorario y debe aplicarse retención'
    }
  }, {
    tableName: 'costos_proyecto',
    timestamps: true,
    hooks: {
      afterCreate: async (costo, options) => {
        if (costo.estado === 'ejecutado') {
          try {
            // Actualizar costo estimado del proyecto
            const { Proyecto } = require('./');
            const proyecto = await Proyecto.findByPk(costo.proyecto_id, { transaction: options.transaction });
            
            if (proyecto) {
              // Obtener suma de todos los costos ejecutados
              const totalCostos = await CostoProyecto.sum('monto', {
                where: { 
                  proyecto_id: costo.proyecto_id,
                  estado: 'ejecutado',
                  incluido_rentabilidad: true
                },
                transaction: options.transaction
              });
              
              // Actualizar costo total estimado del proyecto
              await proyecto.update(
                { costo_real: totalCostos },
                { transaction: options.transaction }
              );
            }
          } catch (error) {
            console.error('Error al actualizar costo estimado del proyecto:', error);
          }
        }
      },
      afterUpdate: async (costo, options) => {
        if (costo.changed('estado') || costo.changed('monto') || costo.changed('incluido_rentabilidad')) {
          try {
            // Actualizar costo estimado del proyecto
            const { Proyecto } = require('./');
            const proyecto = await Proyecto.findByPk(costo.proyecto_id, { transaction: options.transaction });
            
            if (proyecto) {
              // Obtener suma de todos los costos ejecutados
              const totalCostos = await CostoProyecto.sum('monto', {
                where: { 
                  proyecto_id: costo.proyecto_id,
                  estado: 'ejecutado',
                  incluido_rentabilidad: true
                },
                transaction: options.transaction
              });
              
              // Actualizar costo total estimado del proyecto
              await proyecto.update(
                { costo_real: totalCostos },
                { transaction: options.transaction }
              );
            }
          } catch (error) {
            console.error('Error al actualizar costo estimado del proyecto:', error);
          }
        }
      }
    }
  });

  return CostoProyecto;
}; 