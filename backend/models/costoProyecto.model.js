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
      afterSave: async (costo, options) => {
        try {
          console.log(`🔄 Hook afterSave ejecutándose para costo ID: ${costo.id}, proyecto: ${costo.proyecto_id}, estado: ${costo.estado}`);

          const { Proyecto } = sequelize.models;

          // Solo recalcular si el costo está ejecutado e incluido en rentabilidad
          if (costo.estado === 'ejecutado' && costo.incluido_rentabilidad === true) {
            const totalCostos = await CostoProyecto.sum('monto', {
              where: {
                proyecto_id: costo.proyecto_id,
                estado: 'ejecutado',
                incluido_rentabilidad: true
              },
              transaction: options.transaction
            });

            console.log(`📊 Recalculando costo_real para proyecto ${costo.proyecto_id}: ${totalCostos || 0}`);

            await Proyecto.update(
              { costo_real: totalCostos || 0 },
              {
                where: { id: costo.proyecto_id },
                transaction: options.transaction
              }
            );

            console.log(`✅ costo_real actualizado correctamente para proyecto ${costo.proyecto_id}`);
          } else {
            console.log(`⏭️  Hook omitido: estado=${costo.estado}, incluido_rentabilidad=${costo.incluido_rentabilidad}`);
          }
        } catch (error) {
          console.error(`❌ Error en hook afterSave de CostoProyecto para proyecto ${costo.proyecto_id}:`, error);
          console.error('Detalles del error:', error.message);
        }
      },
      afterDestroy: async (costo, options) => {
        try {
          console.log(`🗑️  Hook afterDestroy ejecutándose para costo ID: ${costo.id}, proyecto: ${costo.proyecto_id}`);

          const { Proyecto } = sequelize.models;

          // Siempre recalcular al eliminar, ya que el costo eliminado podría haber afectado el total
          const totalCostos = await CostoProyecto.sum('monto', {
            where: {
              proyecto_id: costo.proyecto_id,
              estado: 'ejecutado',
              incluido_rentabilidad: true
            },
            transaction: options.transaction
          });

          console.log(`📊 Recalculando costo_real después de eliminación para proyecto ${costo.proyecto_id}: ${totalCostos || 0}`);

          await Proyecto.update(
            { costo_real: totalCostos || 0 },
            {
              where: { id: costo.proyecto_id },
              transaction: options.transaction
            }
          );

          console.log(`✅ costo_real actualizado después de eliminación para proyecto ${costo.proyecto_id}`);
        } catch (error) {
          console.error(`❌ Error en hook afterDestroy de CostoProyecto para proyecto ${costo.proyecto_id}:`, error);
          console.error('Detalles del error:', error.message);
        }
      }
    }
  });

  return CostoProyecto;
}; 