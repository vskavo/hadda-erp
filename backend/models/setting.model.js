const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'string', // Posibles valores: string, number, boolean, json
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'general'
    }
  }, {
    tableName: 'settings',
    timestamps: false,
    underscored: true,
    hooks: {
      beforeCreate: (setting) => {
        // Para valores numéricos, asegurarnos que esté correctamente formateado
        if (setting.type === 'number') {
          try {
            setting.value = parseFloat(setting.value).toString();
          } catch (e) {
            // Manejar el error si no se puede convertir
            console.error('Error al convertir valor a número:', e);
          }
        }
      }
    }
  });

  return Setting;
}; 