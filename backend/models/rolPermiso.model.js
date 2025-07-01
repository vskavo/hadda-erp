const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RolPermiso = sequelize.define('RolPermiso', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rol_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    permiso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'permisos',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'rol_permisos',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['rol_id', 'permiso_id']
      }
    ]
  });

  return RolPermiso;
}; 