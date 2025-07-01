const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SeguimientoCliente = sequelize.define('SeguimientoCliente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    contacto_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'contactos',
        key: 'id'
      }
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    tipo_actividad: {
      type: DataTypes.ENUM('llamada', 'reunion', 'email', 'visita', 'propuesta', 'otro'),
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    asunto: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT
    },
    resultado: {
      type: DataTypes.TEXT
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'completada', 'cancelada', 'reprogramada'),
      defaultValue: 'pendiente'
    },
    fecha_siguiente: {
      type: DataTypes.DATE
    },
    accion_siguiente: {
      type: DataTypes.STRING
    },
    prioridad: {
      type: DataTypes.ENUM('baja', 'media', 'alta'),
      defaultValue: 'media'
    },
    recordatorio: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fecha_recordatorio: {
      type: DataTypes.DATE
    },
    documentos_url: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  }, {
    tableName: 'seguimientos_cliente',
    timestamps: true,
    underscored: true,
    hooks: {
      afterCreate: async (seguimiento, options) => {
        if (seguimiento.estado === 'completada') {
          try {
            // Actualizar fecha del último contacto en cliente
            const { Cliente } = require('./');
            await Cliente.update(
              { fecha_ultimo_contacto: seguimiento.fecha },
              { 
                where: { id: seguimiento.cliente_id },
                transaction: options.transaction
              }
            );
            
            // Actualizar fecha de última interacción con el contacto si existe
            if (seguimiento.contacto_id) {
              const { Contacto } = require('./');
              await Contacto.update(
                { ultima_interaccion: seguimiento.fecha },
                { 
                  where: { id: seguimiento.contacto_id },
                  transaction: options.transaction
                }
              );
            }
          } catch (error) {
            console.error('Error al actualizar fechas de contacto:', error);
          }
        }
      },
      afterUpdate: async (seguimiento, options) => {
        if (seguimiento.changed('estado') && seguimiento.estado === 'completada') {
          try {
            // Actualizar fecha del último contacto en cliente
            const { Cliente } = require('./');
            await Cliente.update(
              { fecha_ultimo_contacto: seguimiento.fecha },
              { 
                where: { id: seguimiento.cliente_id },
                transaction: options.transaction
              }
            );
            
            // Actualizar fecha de última interacción con el contacto si existe
            if (seguimiento.contacto_id) {
              const { Contacto } = require('./');
              await Contacto.update(
                { ultima_interaccion: seguimiento.fecha },
                { 
                  where: { id: seguimiento.contacto_id },
                  transaction: options.transaction
                }
              );
            }
          } catch (error) {
            console.error('Error al actualizar fechas de contacto:', error);
          }
        }
      }
    }
  });

  return SeguimientoCliente;
}; 