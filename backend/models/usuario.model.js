const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rol_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    rut: {
      type: DataTypes.STRING,
      validate: {
        // Validación de formato RUT chileno (XX.XXX.XXX-X)
        is: /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$/
      }
    },
    telefono: {
      type: DataTypes.STRING
    },
    cargo: {
      type: DataTypes.STRING
    },
    direccion: {
      type: DataTypes.STRING
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ultimo_login: {
      type: DataTypes.DATE
    },
    intentos_fallidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    bloqueado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fecha_bloqueo: {
      type: DataTypes.DATE
    },
    requiere_cambio_password: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    token_recuperacion: {
      type: DataTypes.STRING
    },
    fecha_expiracion_token: {
      type: DataTypes.DATE
    },
    ultima_ip: {
      type: DataTypes.STRING
    },
    imagen_perfil: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'usuarios',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (usuario) => {
        if (usuario.password) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      },
      beforeUpdate: async (usuario) => {
        if (usuario.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      }
    }
  });

  // Método para comparar contraseñas
  Usuario.prototype.comparePassword = async function(candidatePassword) {
    try {
      console.log('Ejecutando comparePassword');
      
      // Verificación de seguridad
      if (!candidatePassword || !this.password) {
        console.error('Contraseña candidata o almacenada no válida');
        return false;
      }
      
      // Comparar la contraseña proporcionada con la almacenada
      const result = await bcrypt.compare(candidatePassword, this.password);
      return result;
    } catch (error) {
      console.error('Error al comparar contraseñas:', error);
      return false;
    }
  };

  return Usuario;
}; 