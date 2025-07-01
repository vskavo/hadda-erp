const { Sesion, Curso, Usuario } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener todas las sesiones de un curso
 */
exports.getSesionesByCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;
    
    // Verificar si el curso existe
    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({
        success: false,
        message: 'Curso no encontrado'
      });
    }
    
    // Obtener sesiones del curso
    const sesiones = await Sesion.findAll({
      where: { curso_id: cursoId },
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ],
      order: [['numero', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      data: sesiones
    });
  } catch (error) {
    console.error('Error al obtener sesiones del curso:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las sesiones del curso',
      error: error.message
    });
  }
};

/**
 * Obtener una sesión por ID
 */
exports.getSesionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sesion = await Sesion.findByPk(id, {
      include: [
        {
          model: Curso,
          attributes: ['id', 'nombre', 'codigo_sence']
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });
    
    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: sesion
    });
  } catch (error) {
    console.error('Error al obtener sesión por ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la sesión',
      error: error.message
    });
  }
};

/**
 * Crear una nueva sesión
 */
exports.createSesion = async (req, res) => {
  try {
    const {
      curso_id,
      numero,
      fecha,
      hora_inicio,
      hora_fin,
      duracion_minutos,
      modalidad,
      lugar,
      enlace_virtual,
      contenidos,
      estado,
      observaciones
    } = req.body;
    
    // Validar campos obligatorios
    if (!curso_id || !numero || !fecha || !hora_inicio || !hora_fin || !duracion_minutos) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: curso_id, numero, fecha, hora_inicio, hora_fin, duracion_minutos'
      });
    }
    
    // Verificar si el curso existe
    const curso = await Curso.findByPk(curso_id);
    if (!curso) {
      return res.status(404).json({
        success: false,
        message: 'El curso especificado no existe'
      });
    }
    
    // Verificar si ya existe una sesión con el mismo número para este curso
    const sesionExistente = await Sesion.findOne({
      where: { 
        curso_id,
        numero
      }
    });
    
    if (sesionExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una sesión con el mismo número para este curso'
      });
    }
    
    // Crear la sesión
    const nuevaSesion = await Sesion.create({
      curso_id,
      numero,
      fecha,
      hora_inicio,
      hora_fin,
      duracion_minutos,
      modalidad,
      lugar,
      enlace_virtual,
      contenidos,
      estado: estado || 'programada',
      observaciones,
      usuario_id: req.userId // ID del usuario que crea la sesión
    });
    
    return res.status(201).json({
      success: true,
      message: 'Sesión creada exitosamente',
      data: nuevaSesion
    });
  } catch (error) {
    console.error('Error al crear sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear la sesión',
      error: error.message
    });
  }
};

/**
 * Actualizar una sesión existente
 */
exports.updateSesion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numero,
      fecha,
      hora_inicio,
      hora_fin,
      duracion_minutos,
      modalidad,
      lugar,
      enlace_virtual,
      contenidos,
      estado,
      observaciones
    } = req.body;
    
    // Verificar si la sesión existe
    const sesion = await Sesion.findByPk(id);
    
    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }
    
    // Si se está cambiando el número, verificar que no exista otra sesión con ese número
    if (numero && numero !== sesion.numero) {
      const sesionExistente = await Sesion.findOne({
        where: { 
          curso_id: sesion.curso_id,
          numero,
          id: { [Op.ne]: id }
        }
      });
      
      if (sesionExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra sesión con el mismo número para este curso'
        });
      }
    }
    
    // Actualizar la sesión
    await sesion.update({
      numero,
      fecha,
      hora_inicio,
      hora_fin,
      duracion_minutos,
      modalidad,
      lugar,
      enlace_virtual,
      contenidos,
      estado,
      observaciones
    });
    
    return res.status(200).json({
      success: true,
      message: 'Sesión actualizada exitosamente',
      data: sesion
    });
  } catch (error) {
    console.error('Error al actualizar sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar la sesión',
      error: error.message
    });
  }
};

/**
 * Eliminar una sesión
 */
exports.deleteSesion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la sesión existe
    const sesion = await Sesion.findByPk(id);
    
    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }
    
    // Verificar si la sesión ya tiene asistencias registradas
    const asistenciasCount = await sesion.countAsistencias();
    
    if (asistenciasCount > 0) {
      // En lugar de eliminar, marcar como cancelada
      await sesion.update({
        estado: 'cancelada',
        observaciones: sesion.observaciones 
          ? `${sesion.observaciones} - Cancelada por usuario ${req.userId}`
          : `Cancelada por usuario ${req.userId}`
      });
      
      return res.status(200).json({
        success: true,
        message: 'La sesión tiene asistencias registradas. Se ha marcado como cancelada en lugar de eliminarla.'
      });
    }
    
    // Eliminar la sesión
    await sesion.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Sesión eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la sesión',
      error: error.message
    });
  }
};

/**
 * Cambiar el estado de una sesión
 */
exports.cambiarEstadoSesion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    
    // Validar el estado
    const estadosValidos = ['programada', 'en_curso', 'finalizada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido. Los estados permitidos son: programada, en_curso, finalizada, cancelada'
      });
    }
    
    // Verificar si la sesión existe
    const sesion = await Sesion.findByPk(id);
    
    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }
    
    // Actualizar el estado de la sesión
    await sesion.update({
      estado,
      observaciones: observaciones || sesion.observaciones
    });
    
    return res.status(200).json({
      success: true,
      message: `Estado de la sesión actualizado a "${estado}" exitosamente`,
      data: sesion
    });
  } catch (error) {
    console.error('Error al cambiar estado de la sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado de la sesión',
      error: error.message
    });
  }
};

/**
 * Generar sesiones automáticamente para un curso
 */
exports.generarSesiones = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const {
      fecha_inicio,
      fecha_fin,
      dias_semana,
      hora_inicio,
      hora_fin,
      duracion_minutos,
      modalidad,
      lugar,
      enlace_virtual
    } = req.body;
    
    // Validar campos obligatorios
    if (!fecha_inicio || !fecha_fin || !dias_semana || !hora_inicio || !hora_fin || !duracion_minutos) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: fecha_inicio, fecha_fin, dias_semana, hora_inicio, hora_fin, duracion_minutos'
      });
    }
    
    // Verificar si el curso existe
    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({
        success: false,
        message: 'Curso no encontrado'
      });
    }
    
    // Convertir fechas a objetos Date
    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);
    
    // Validar que la fecha de inicio sea anterior a la fecha de fin
    if (fechaInicio > fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }
    
    // Validar días de la semana (0: domingo, 1: lunes, ..., 6: sábado)
    if (!Array.isArray(dias_semana) || dias_semana.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un día de la semana'
      });
    }
    
    // Obtener el último número de sesión para este curso
    const ultimaSesion = await Sesion.findOne({
      where: { curso_id: cursoId },
      order: [['numero', 'DESC']]
    });
    
    let numeroSesion = ultimaSesion ? ultimaSesion.numero + 1 : 1;
    const sesionesGeneradas = [];
    
    // Generar sesiones para cada día entre fecha_inicio y fecha_fin
    const fechaActual = new Date(fechaInicio);
    while (fechaActual <= fechaFin) {
      // Verificar si el día de la semana está incluido
      if (dias_semana.includes(fechaActual.getDay())) {
        // Crear la sesión
        const nuevaSesion = await Sesion.create({
          curso_id: cursoId,
          numero: numeroSesion,
          fecha: fechaActual.toISOString().split('T')[0], // Formato YYYY-MM-DD
          hora_inicio,
          hora_fin,
          duracion_minutos,
          modalidad: modalidad || curso.modalidad || 'presencial',
          lugar,
          enlace_virtual,
          estado: 'programada',
          usuario_id: req.userId
        });
        
        sesionesGeneradas.push(nuevaSesion);
        numeroSesion++;
      }
      
      // Avanzar al siguiente día
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    return res.status(201).json({
      success: true,
      message: `Se generaron ${sesionesGeneradas.length} sesiones exitosamente`,
      data: sesionesGeneradas
    });
  } catch (error) {
    console.error('Error al generar sesiones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar las sesiones',
      error: error.message
    });
  }
}; 