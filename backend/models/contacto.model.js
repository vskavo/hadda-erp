const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Contacto = sequelize.define('Contacto', {
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
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING
    },
    cargo: {
      type: DataTypes.STRING
    },
    departamento: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    telefono_directo: {
      type: DataTypes.STRING
    },
    telefono_movil: {
      type: DataTypes.STRING
    },
    es_principal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    es_decision_maker: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY
    },
    notas: {
      type: DataTypes.TEXT
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ultima_interaccion: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'contactos',
    timestamps: true,
    hooks: {
      beforeCreate: async (contacto, options) => {
        // Si es el primer contacto o se marca como principal, verificamos que no haya otro principal
        if (contacto.es_principal) {
          const { Contacto } = require('./');
          const contactoExistente = await Contacto.findOne({
            where: { 
              cliente_id: contacto.cliente_id,
              es_principal: true
            },
            transaction: options.transaction
          });
          
          // Si ya existe un contacto principal, actualizamos ese registro
          if (contactoExistente) {
            await contactoExistente.update(
              { es_principal: false },
              { transaction: options.transaction }
            );
          }
        }
      },
      beforeUpdate: async (contacto, options) => {
        // Si se está estableciendo como principal, actualizamos los demás contactos
        if (contacto.changed('es_principal') && contacto.es_principal) {
          const { Contacto } = require('./');
          await Contacto.update(
            { es_principal: false },
            { 
              where: { 
                cliente_id: contacto.cliente_id,
                id: { [sequelize.Op.ne]: contacto.id }
              },
              transaction: options.transaction
            }
          );
        }
      }
    }
  });

  return Contacto;
}; 