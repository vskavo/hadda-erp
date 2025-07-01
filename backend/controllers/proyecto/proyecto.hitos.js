/**
 * Controlador para gestionar hitos (milestones) de proyectos
 */
const { models } = require('./proyecto.utils');
const { Proyecto, HitoProyecto, Usuario, AvanceProyecto, sequelize } = models;

// Crear un nuevo hito
exports.crearHito = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      fecha_objetivo, 
      prioridad = 'media',
      porcentaje_proyecto,
      completado = false
    } = req.body;
    
    const proyecto = await Proyecto.findByPk(id);
    
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    const hito = await HitoProyecto.create({
      proyecto_id: id,
      nombre,
      descripcion,
      fecha_objetivo,
      prioridad,
      porcentaje_proyecto,
      completado,
      usuario_id: req.usuario.id
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).json({
      message: 'Hito creado exitosamente',
      hito
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear hito de proyecto:', error);
    res.status(500).json({ 
      message: 'Error al crear hito de proyecto', 
      error: error.message 
    });
  }
};

// Obtener hitos de un proyecto
exports.listarHitos = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proyecto = await Proyecto.findByPk(id, {
      attributes: ['id', 'nombre']
    });
    
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    const hitos = await HitoProyecto.findAll({
      where: { proyecto_id: id },
      order: [
        ['completado', 'ASC'],
        ['fecha_objetivo', 'ASC']
      ]
    });
    
    res.status(200).json({
      proyecto,
      hitos
    });
  } catch (error) {
    console.error('Error al obtener hitos del proyecto:', error);
    res.status(500).json({ 
      message: 'Error al obtener hitos del proyecto', 
      error: error.message 
    });
  }
};

// Actualizar un hito
exports.actualizarHito = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id, hitoId } = req.params;
    const { 
      nombre, 
      descripcion, 
      fecha_objetivo, 
      prioridad,
      porcentaje_proyecto,
      completado
    } = req.body;
    
    const hito = await HitoProyecto.findOne({
      where: {
        id: hitoId,
        proyecto_id: id
      }
    });
    
    if (!hito) {
      await t.rollback();
      return res.status(404).json({ message: 'Hito no encontrado' });
    }
    
    await hito.update({
      nombre,
      descripcion,
      fecha_objetivo,
      prioridad,
      porcentaje_proyecto,
      completado,
      fecha_completado: completado && !hito.completado ? new Date() : hito.fecha_completado
    }, { transaction: t });
    
    // Si el hito se marca como completado, actualizamos el avance del proyecto
    if (completado && !hito.completado && hito.porcentaje_proyecto) {
      const proyecto = await Proyecto.findByPk(id);
      
      if (proyecto) {
        // Calculamos el nuevo porcentaje basado en los hitos completados
        const hitosCompletados = await HitoProyecto.findAll({
          where: {
            proyecto_id: id,
            completado: true
          }
        });
        
        const porcentajeTotal = hitosCompletados.reduce(
          (sum, h) => sum + (h.porcentaje_proyecto || 0), 
          0
        );
        
        await proyecto.update({
          porcentaje_avance: Math.min(porcentajeTotal, 100),
          usuario_modificacion_id: req.usuario.id
        }, { transaction: t });
        
        // Registrar el avance automático
        await AvanceProyecto.create({
          proyecto_id: id,
          porcentaje_anterior: proyecto.porcentaje_avance,
          porcentaje_nuevo: Math.min(porcentajeTotal, 100),
          nota: `Avance automático por completar hito: ${hito.nombre}`,
          fecha: new Date(),
          usuario_id: req.usuario.id
        }, { transaction: t });
      }
    }
    
    await t.commit();
    
    res.status(200).json({
      message: 'Hito actualizado exitosamente',
      hito
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar hito:', error);
    res.status(500).json({ 
      message: 'Error al actualizar hito', 
      error: error.message 
    });
  }
};

// Eliminar un hito
exports.eliminarHito = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id, hitoId } = req.params;
    
    const hito = await HitoProyecto.findOne({
      where: {
        id: hitoId,
        proyecto_id: id
      }
    });
    
    if (!hito) {
      await t.rollback();
      return res.status(404).json({ message: 'Hito no encontrado' });
    }
    
    await hito.destroy({ transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Hito eliminado exitosamente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar hito:', error);
    res.status(500).json({ 
      message: 'Error al eliminar hito', 
      error: error.message 
    });
  }
}; 