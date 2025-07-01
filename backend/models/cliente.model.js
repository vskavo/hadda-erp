const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cliente = sequelize.define('Cliente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    razon_social: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rut: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        // Validación de formato RUT chileno (XX.XXX.XXX-X)
        is: /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$/
      }
    },
    giro: {
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
    telefono: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    sitio_web: {
      type: DataTypes.STRING
    },
    contacto_nombre: {
      type: DataTypes.STRING
    },
    contacto_cargo: {
      type: DataTypes.STRING
    },
    contacto_email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    contacto_telefono: {
      type: DataTypes.STRING
    },
    estado: {
      type: DataTypes.STRING,
      // En PostgreSQL, se usa el tipo ENUM creado previamente
      // o se puede usar STRING y validar con valores permitidos
      defaultValue: 'activo',
      validate: {
        isIn: [['activo', 'inactivo', 'prospecto']]
      }
    },
    notas: {
      type: DataTypes.TEXT
    },
    fecha_ultimo_contacto: {
      type: DataTypes.DATE
    },
    holding: {
      type: DataTypes.STRING
    },
    owner: {
      type: DataTypes.INTEGER,
      allowNull: true, // Cambiar a false cuando todos los clientes tengan owner
      comment: 'Propietario del cliente, FK a usuarios.id'
    }
  }, {
    tableName: 'clientes',
    timestamps: true
  });

  return Cliente;
}; 