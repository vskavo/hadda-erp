const { Setting, sequelize } = require('../models');

// Obtener todas las configuraciones
exports.findAll = async (req, res) => {
  try {
    const settings = await Setting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });
    
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    res.status(500).json({ 
      message: 'Error al obtener configuraciones', 
      error: error.message 
    });
  }
};

// Obtener una configuración por su clave
exports.findByKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await Setting.findOne({
      where: { key }
    });
    
    if (!setting) {
      return res.status(404).json({ message: `Configuración con clave '${key}' no encontrada` });
    }
    
    // Formatear valor según el tipo
    let formattedValue = setting.value;
    
    if (setting.type === 'number') {
      formattedValue = parseFloat(setting.value);
    } else if (setting.type === 'boolean') {
      formattedValue = setting.value === 'true';
    } else if (setting.type === 'json') {
      try {
        formattedValue = JSON.parse(setting.value);
      } catch (e) {
        console.error('Error al parsear JSON:', e);
      }
    }
    
    res.status(200).json({
      id: setting.id,
      key: setting.key,
      value: formattedValue,
      type: setting.type,
      description: setting.description,
      category: setting.category
    });
  } catch (error) {
    console.error('Error al obtener configuración por clave:', error);
    res.status(500).json({ 
      message: 'Error al obtener configuración', 
      error: error.message 
    });
  }
};

// Obtener valor de IVA (endpoint específico)
exports.getIVA = async (req, res) => {
  try {
    const ivaSetting = await Setting.findOne({
      where: { key: 'IVA' }
    });
    
    // Si no existe, crear con valor por defecto (19%)
    if (!ivaSetting) {
      const newSetting = await Setting.create({
        key: 'IVA',
        value: '19',
        description: 'Porcentaje de IVA para cálculos',
        type: 'number',
        category: 'finanzas'
      });
      
      return res.status(200).json({
        value: 19,
        description: 'Porcentaje de IVA para cálculos'
      });
    }
    
    // Devolver el valor como número
    return res.status(200).json({
      value: parseFloat(ivaSetting.value),
      description: ivaSetting.description
    });
  } catch (error) {
    console.error('Error al obtener valor de IVA:', error);
    res.status(500).json({ 
      message: 'Error al obtener valor de IVA', 
      error: error.message 
    });
  }
};

// Obtener valor de Retención de Honorarios (endpoint específico)
exports.getRetencionHonorarios = async (req, res) => {
  try {
    const retencionSetting = await Setting.findOne({
      where: { key: 'retencion_honorarios' }
    });
    
    // Si no existe, crear con valor por defecto (ej. 13.75%)
    if (!retencionSetting) {
      const newSetting = await Setting.create({
        key: 'retencion_honorarios',
        value: '13.75',
        description: 'Porcentaje de Retención de Honorarios Profesionales',
        type: 'number',
        category: 'finanzas'
      });
      
      return res.status(200).json({
        value: 13.75,
        description: 'Porcentaje de Retención de Honorarios Profesionales'
      });
    }
    
    // Devolver el valor como número
    return res.status(200).json({
      value: parseFloat(retencionSetting.value),
      description: retencionSetting.description
    });
  } catch (error) {
    console.error('Error al obtener valor de Retención de Honorarios:', error);
    res.status(500).json({ 
      message: 'Error al obtener valor de Retención de Honorarios', 
      error: error.message 
    });
  }
};

// Crear una nueva configuración
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { key, value, description, type, category } = req.body;
    
    // Validaciones básicas
    if (!key || value === undefined) {
      await t.rollback();
      return res.status(400).json({ message: 'La clave y el valor son obligatorios' });
    }
    
    // Verificar si ya existe la configuración
    const existingSetting = await Setting.findOne({ 
      where: { key },
      transaction: t
    });
    
    if (existingSetting) {
      await t.rollback();
      return res.status(400).json({ message: `Ya existe una configuración con la clave '${key}'` });
    }
    
    // Crear nueva configuración
    const setting = await Setting.create({
      key,
      value: value.toString(),
      description,
      type: type || 'string',
      category: category || 'general'
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).json({
      message: 'Configuración creada exitosamente',
      setting
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear configuración:', error);
    res.status(500).json({ 
      message: 'Error al crear configuración', 
      error: error.message 
    });
  }
};

// Actualizar una configuración existente
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { key } = req.params;
    const { value, description, type, category } = req.body;
    
    // Buscar la configuración
    const setting = await Setting.findOne({ 
      where: { key },
      transaction: t
    });
    
    if (!setting) {
      await t.rollback();
      return res.status(404).json({ message: `Configuración con clave '${key}' no encontrada` });
    }
    
    // Actualizar campos
    if (value !== undefined) setting.value = value.toString();
    if (description !== undefined) setting.description = description;
    if (type !== undefined) setting.type = type;
    if (category !== undefined) setting.category = category;
    
    await setting.save({ transaction: t });
    await t.commit();
    
    res.status(200).json({
      message: 'Configuración actualizada exitosamente',
      setting
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ 
      message: 'Error al actualizar configuración', 
      error: error.message 
    });
  }
};

// Eliminar una configuración
exports.delete = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { key } = req.params;
    
    // Buscar la configuración
    const setting = await Setting.findOne({ 
      where: { key },
      transaction: t
    });
    
    if (!setting) {
      await t.rollback();
      return res.status(404).json({ message: `Configuración con clave '${key}' no encontrada` });
    }
    
    await setting.destroy({ transaction: t });
    await t.commit();
    
    res.status(200).json({
      message: 'Configuración eliminada exitosamente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar configuración:', error);
    res.status(500).json({ 
      message: 'Error al eliminar configuración', 
      error: error.message 
    });
  }
}; 