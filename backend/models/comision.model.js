const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Cambiar nombre del modelo a Comision
  const Comision = sequelize.define('Comision', { 
    margen_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'margen_id' 
    },
    margen_desde: {
      type: DataTypes.DECIMAL(5, 2), 
      allowNull: false,
      field: 'margen_desde'
    },
    margen_hasta: {
      type: DataTypes.DECIMAL(5, 2), 
      allowNull: false,
      field: 'margen_hasta'
    },
    // Nueva columna para la comisión
    comision: {
      type: DataTypes.DECIMAL(5, 2), // Ajustar precisión si es necesario
      allowNull: false,
      field: 'comision' // Asegurar nombre de columna
    },
    // Volver a tipo INTEGER, Sequelize manejará el mapeo a la columna 'rol' (texto con números)
    rol_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: 'roles', key: 'id' }, 
        field: 'rol' 
    }
  }, {
    tableName: 'comisiones', // Cambiar nombre de la tabla
    timestamps: true, 
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Actualizar hook para validar solapamiento POR ROL
  Comision.addHook('beforeValidate', async (comisionInstance, options) => {
    // Validaciones básicas de valores
    if (comisionInstance.margen_desde !== null && comisionInstance.margen_hasta !== null) {
      if (parseFloat(comisionInstance.margen_desde) >= parseFloat(comisionInstance.margen_hasta)) {
        throw new Error('El margen "desde" debe ser menor que el margen "hasta".');
      }
    }
    if (parseFloat(comisionInstance.margen_desde) < 0 || parseFloat(comisionInstance.margen_hasta) < 0 || parseFloat(comisionInstance.comision) < 0 ){
        throw new Error('Los márgenes y la comisión no pueden ser negativos.');
    }

    // Validación de solapamiento simplificada (usa rol_id como INTEGER)
    if (comisionInstance.rol_id && comisionInstance.margen_desde !== null && comisionInstance.margen_hasta !== null) {
        const { Op } = require("sequelize");
        const whereCondition = {
            rol_id: comisionInstance.rol_id, // Comparar INTEGER con la columna 'rol' (texto numérico)
            [Op.or]: [
                { margen_desde: { [Op.lte]: comisionInstance.margen_desde }, margen_hasta: { [Op.gte]: comisionInstance.margen_hasta } },
                { margen_desde: { [Op.lte]: comisionInstance.margen_desde }, margen_hasta: { [Op.gt]: comisionInstance.margen_desde } },
                { margen_desde: { [Op.lt]: comisionInstance.margen_hasta }, margen_hasta: { [Op.gte]: comisionInstance.margen_hasta } },
                { margen_desde: { [Op.gte]: comisionInstance.margen_desde }, margen_hasta: { [Op.lte]: comisionInstance.margen_hasta } },
            ]
        };
        
        if (comisionInstance.margen_id) {
            whereCondition.margen_id = { [Op.ne]: comisionInstance.margen_id };
        }

        // Buscar solapamientos
        const overlapping = await Comision.findOne({ where: whereCondition });

        if (overlapping) {
            // Intentar obtener nombre del rol para mensaje de error (mejor esfuerzo)
            let rolNombre = `ID ${comisionInstance.rol_id}`;
            try {
                 const Rol = sequelize.models.Rol;
                 const rol = await Rol.findByPk(comisionInstance.rol_id);
                 if(rol) rolNombre = rol.nombre;
            } catch(e){ console.error("Error buscando nombre de rol para mensaje de error:", e); }
            
            throw new Error(`El rango [${comisionInstance.margen_desde} - ${comisionInstance.margen_hasta}] para el rol "${rolNombre}" se solapa con un rango existente [${overlapping.margen_desde} - ${overlapping.margen_hasta}].`);
        }
    }
  });

  // Retornar el nuevo nombre de modelo
  return Comision;
}; 