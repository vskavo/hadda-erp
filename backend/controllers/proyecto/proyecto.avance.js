/**
 * Controlador para gestionar avances de proyectos
 */
const { models } = require('./proyecto.utils');
const { Proyecto, AvanceProyecto, Usuario, sequelize } = models;

// Actualizar porcentaje de avance de un proyecto
exports.actualizarAvance = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      porcentaje_avance, 
      nota_avance,
      fecha_reporte = new Date()
    } = req.body;
    
    if (porcentaje_avance === undefined || porcentaje_avance < 0 || porcentaje_avance > 100) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'El porcentaje de avance debe ser un valor entre 0 y 100' 
      });
    }
    
    const proyecto = await Proyecto.findByPk(id);
    
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Guardar el registro histórico de avance
    await AvanceProyecto.create({
      proyecto_id: id,
      porcentaje_anterior: proyecto.porcentaje_avance,
      porcentaje_nuevo: porcentaje_avance,
      nota: nota_avance,
      fecha: fecha_reporte,
      usuario_id: req.usuario.id
    }, { transaction: t });
    
    // Actualizar el porcentaje en el proyecto
    await proyecto.update({
      porcentaje_avance,
      usuario_modificacion_id: req.usuario.id
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Avance de proyecto actualizado exitosamente',
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        porcentaje_avance,
        fecha_reporte
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar avance de proyecto:', error);
    res.status(500).json({ 
      message: 'Error al actualizar avance de proyecto', 
      error: error.message 
    });
  }
};

// Obtener historial de avance de un proyecto
exports.historialAvance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proyecto = await Proyecto.findByPk(id, {
      attributes: ['id', 'nombre', 'porcentaje_avance', 'fecha_inicio', 'fecha_fin']
    });
    
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    const historial = await AvanceProyecto.findAll({
      where: { proyecto_id: id },
      order: [['fecha', 'DESC']],
      include: [{
        model: Usuario,
        as: 'Usuario',
        attributes: ['id', 'nombre', 'apellido']
      }]
    });
    
    res.status(200).json({
      proyecto,
      historial
    });
  } catch (error) {
    console.error('Error al obtener historial de avance:', error);
    res.status(500).json({ 
      message: 'Error al obtener historial de avance', 
      error: error.message 
    });
  }
}; 