const { Asistencia, Participante, Curso, Usuario, Sesion } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener asistencias por curso y fecha
 */
exports.getAsistenciasByCursoFecha = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const { fecha } = req.query;
    
    // Validar campos obligatorios
    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar una fecha para consultar las asistencias'
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
    
    // Obtener asistencias del curso para la fecha especificada
    const asistencias = await Asistencia.findAll({
      where: { 
        curso_id: cursoId,
        fecha
      },
      include: [
        {
          model: Participante,
          attributes: ['id', 'nombre', 'apellido', 'rut', 'email']
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ],
      order: [
        [{ model: Participante }, 'apellido', 'ASC'],
        [{ model: Participante }, 'nombre', 'ASC']
      ]
    });
    
    // Obtener todos los participantes del curso
    const participantes = await Participante.findAll({
      where: { curso_id: cursoId },
      attributes: ['id', 'nombre', 'apellido', 'rut', 'email', 'estado'],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });
    
    // Verificar si existe una sesión para esta fecha
    const sesion = await Sesion.findOne({
      where: {
        curso_id: cursoId,
        fecha
      }
    });
    
    // Crear un mapa de asistencias por participante_id
    const asistenciasPorParticipante = {};
    asistencias.forEach(asistencia => {
      asistenciasPorParticipante[asistencia.participante_id] = asistencia;
    });
    
    // Crear un array con todos los participantes y su asistencia (si existe)
    const resultado = participantes.map(participante => {
      const asistencia = asistenciasPorParticipante[participante.id];
      return {
        participante,
        asistencia: asistencia || null
      };
    });
    
    return res.status(200).json({
      success: true,
      data: {
        fecha,
        sesion: sesion || null,
        participantes: resultado,
        total_participantes: participantes.length,
        total_asistencias: asistencias.length
      }
    });
  } catch (error) {
    console.error('Error al obtener asistencias por curso y fecha:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las asistencias',
      error: error.message
    });
  }
};

/**
 * Obtener asistencias por participante
 */
exports.getAsistenciasByParticipante = async (req, res) => {
  try {
    const { participanteId } = req.params;
    
    // Verificar si el participante existe
    const participante = await Participante.findByPk(participanteId, {
      include: [
        {
          model: Curso,
          attributes: ['id', 'nombre', 'codigo_sence']
        }
      ]
    });
    
    if (!participante) {
      return res.status(404).json({
        success: false,
        message: 'Participante no encontrado'
      });
    }
    
    // Obtener asistencias del participante
    const asistencias = await Asistencia.findAll({
      where: { participante_id: participanteId },
      order: [['fecha', 'ASC']]
    });
    
    // Calcular porcentaje de asistencia
    const totalSesiones = await Sesion.count({
      where: { 
        curso_id: participante.curso_id,
        fecha: { [Op.lte]: new Date() } // Solo sesiones hasta la fecha actual
      }
    });
    
    const asistenciasPresente = asistencias.filter(a => a.estado === 'presente' || a.estado === 'atraso').length;
    const porcentajeAsistencia = totalSesiones > 0 ? (asistenciasPresente / totalSesiones) * 100 : 0;
    
    // Actualizar el porcentaje de asistencia en el participante
    await participante.update({
      porcentaje_asistencia: porcentajeAsistencia
    });
    
    return res.status(200).json({
      success: true,
      data: {
        participante,
        asistencias,
        estadisticas: {
          total_sesiones: totalSesiones,
          asistencias_presente: asistenciasPresente,
          asistencias_ausente: asistencias.filter(a => a.estado === 'ausente').length,
          asistencias_justificado: asistencias.filter(a => a.estado === 'justificado').length,
          asistencias_atraso: asistencias.filter(a => a.estado === 'atraso').length,
          porcentaje_asistencia: porcentajeAsistencia
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener asistencias por participante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las asistencias del participante',
      error: error.message
    });
  }
};

/**
 * Registrar asistencia individual
 */
exports.registrarAsistencia = async (req, res) => {
  try {
    const {
      participante_id,
      curso_id,
      fecha,
      estado,
      hora_entrada,
      hora_salida,
      duracion_minutos,
      observaciones
    } = req.body;
    
    // Validar campos obligatorios
    if (!participante_id || !curso_id || !fecha || !estado) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: participante_id, curso_id, fecha, estado'
      });
    }
    
    // Validar el estado
    const estadosValidos = ['presente', 'ausente', 'justificado', 'atraso'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido. Los estados permitidos son: presente, ausente, justificado, atraso'
      });
    }
    
    // Verificar si el participante existe y pertenece al curso
    const participante = await Participante.findOne({
      where: {
        id: participante_id,
        curso_id
      }
    });
    
    if (!participante) {
      return res.status(404).json({
        success: false,
        message: 'Participante no encontrado o no pertenece al curso especificado'
      });
    }
    
    // Verificar si ya existe una asistencia para este participante en esta fecha
    const asistenciaExistente = await Asistencia.findOne({
      where: {
        participante_id,
        curso_id,
        fecha
      }
    });
    
    let asistencia;
    
    if (asistenciaExistente) {
      // Actualizar la asistencia existente
      asistencia = await asistenciaExistente.update({
        estado,
        hora_entrada,
        hora_salida,
        duracion_minutos,
        observaciones,
        usuario_id: req.userId
      });
    } else {
      // Crear una nueva asistencia
      asistencia = await Asistencia.create({
        participante_id,
        curso_id,
        fecha,
        estado,
        hora_entrada,
        hora_salida,
        duracion_minutos,
        observaciones,
        usuario_id: req.userId
      });
    }
    
    // Actualizar el porcentaje de asistencia del participante
    const totalSesiones = await Sesion.count({
      where: { 
        curso_id,
        fecha: { [Op.lte]: new Date() }
      }
    });
    
    const asistenciasParticipante = await Asistencia.findAll({
      where: { 
        participante_id,
        curso_id
      }
    });
    
    const asistenciasPresente = asistenciasParticipante.filter(a => a.estado === 'presente' || a.estado === 'atraso').length;
    const porcentajeAsistencia = totalSesiones > 0 ? (asistenciasPresente / totalSesiones) * 100 : 0;
    
    await participante.update({
      porcentaje_asistencia: porcentajeAsistencia
    });
    
    return res.status(201).json({
      success: true,
      message: asistenciaExistente ? 'Asistencia actualizada exitosamente' : 'Asistencia registrada exitosamente',
      data: asistencia
    });
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la asistencia',
      error: error.message
    });
  }
};

/**
 * Registrar asistencias masivas
 */
exports.registrarAsistenciasMasivas = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const { fecha, asistencias } = req.body;
    
    // Validar campos obligatorios
    if (!fecha || !asistencias || !Array.isArray(asistencias) || asistencias.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar una fecha y un array de asistencias'
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
    
    // Obtener todos los participantes del curso
    const participantes = await Participante.findAll({
      where: { curso_id: cursoId },
      attributes: ['id', 'rut']
    });
    
    // Crear un mapa de participantes por ID
    const participantesPorId = {};
    participantes.forEach(participante => {
      participantesPorId[participante.id] = participante;
    });
    
    // Procesar cada asistencia
    const resultados = {
      exitosos: 0,
      fallidos: 0,
      errores: []
    };
    
    for (const asistenciaData of asistencias) {
      try {
        const { participante_id, estado, hora_entrada, hora_salida, duracion_minutos, observaciones } = asistenciaData;
        
        // Validar campos obligatorios
        if (!participante_id || !estado) {
          resultados.fallidos++;
          resultados.errores.push({
            participante_id,
            error: 'Faltan campos obligatorios: participante_id, estado'
          });
          continue;
        }
        
        // Validar el estado
        const estadosValidos = ['presente', 'ausente', 'justificado', 'atraso'];
        if (!estadosValidos.includes(estado)) {
          resultados.fallidos++;
          resultados.errores.push({
            participante_id,
            error: 'Estado no válido. Los estados permitidos son: presente, ausente, justificado, atraso'
          });
          continue;
        }
        
        // Verificar si el participante existe y pertenece al curso
        if (!participantesPorId[participante_id]) {
          resultados.fallidos++;
          resultados.errores.push({
            participante_id,
            error: 'Participante no encontrado o no pertenece al curso especificado'
          });
          continue;
        }
        
        // Verificar si ya existe una asistencia para este participante en esta fecha
        const asistenciaExistente = await Asistencia.findOne({
          where: {
            participante_id,
            curso_id: cursoId,
            fecha
          }
        });
        
        if (asistenciaExistente) {
          // Actualizar la asistencia existente
          await asistenciaExistente.update({
            estado,
            hora_entrada,
            hora_salida,
            duracion_minutos,
            observaciones,
            usuario_id: req.userId
          });
        } else {
          // Crear una nueva asistencia
          await Asistencia.create({
            participante_id,
            curso_id: cursoId,
            fecha,
            estado,
            hora_entrada,
            hora_salida,
            duracion_minutos,
            observaciones,
            usuario_id: req.userId
          });
        }
        
        resultados.exitosos++;
      } catch (error) {
        resultados.fallidos++;
        resultados.errores.push({
          participante_id: asistenciaData.participante_id,
          error: error.message
        });
      }
    }
    
    // Actualizar los porcentajes de asistencia de todos los participantes
    for (const participante of participantes) {
      const totalSesiones = await Sesion.count({
        where: { 
          curso_id: cursoId,
          fecha: { [Op.lte]: new Date() }
        }
      });
      
      const asistenciasParticipante = await Asistencia.findAll({
        where: { 
          participante_id: participante.id,
          curso_id: cursoId
        }
      });
      
      const asistenciasPresente = asistenciasParticipante.filter(a => a.estado === 'presente' || a.estado === 'atraso').length;
      const porcentajeAsistencia = totalSesiones > 0 ? (asistenciasPresente / totalSesiones) * 100 : 0;
      
      await participante.update({
        porcentaje_asistencia: porcentajeAsistencia
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Registro de asistencias completado: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`,
      data: resultados
    });
  } catch (error) {
    console.error('Error al registrar asistencias masivas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar las asistencias masivas',
      error: error.message
    });
  }
};

/**
 * Eliminar una asistencia
 */
exports.deleteAsistencia = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la asistencia existe
    const asistencia = await Asistencia.findByPk(id, {
      include: [
        {
          model: Participante,
          attributes: ['id', 'nombre', 'apellido', 'rut']
        }
      ]
    });
    
    if (!asistencia) {
      return res.status(404).json({
        success: false,
        message: 'Asistencia no encontrada'
      });
    }
    
    // Guardar información del participante para actualizar su porcentaje después
    const participanteId = asistencia.participante_id;
    const cursoId = asistencia.curso_id;
    
    // Eliminar la asistencia
    await asistencia.destroy();
    
    // Actualizar el porcentaje de asistencia del participante
    const participante = await Participante.findByPk(participanteId);
    if (participante) {
      const totalSesiones = await Sesion.count({
        where: { 
          curso_id: cursoId,
          fecha: { [Op.lte]: new Date() }
        }
      });
      
      const asistenciasParticipante = await Asistencia.findAll({
        where: { 
          participante_id: participanteId,
          curso_id: cursoId
        }
      });
      
      const asistenciasPresente = asistenciasParticipante.filter(a => a.estado === 'presente' || a.estado === 'atraso').length;
      const porcentajeAsistencia = totalSesiones > 0 ? (asistenciasPresente / totalSesiones) * 100 : 0;
      
      await participante.update({
        porcentaje_asistencia: porcentajeAsistencia
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Asistencia eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar asistencia:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la asistencia',
      error: error.message
    });
  }
};

/**
 * Obtener reporte de asistencia por curso
 */
exports.getReporteAsistenciaCurso = async (req, res) => {
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
    
    // Obtener todas las sesiones del curso
    const sesiones = await Sesion.findAll({
      where: { curso_id: cursoId },
      order: [['fecha', 'ASC']]
    });
    
    // Obtener todos los participantes del curso
    const participantes = await Participante.findAll({
      where: { curso_id: cursoId },
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });
    
    // Obtener todas las asistencias del curso
    const asistencias = await Asistencia.findAll({
      where: { curso_id: cursoId }
    });
    
    // Crear un mapa de asistencias por participante_id y fecha
    const asistenciasPorParticipanteFecha = {};
    asistencias.forEach(asistencia => {
      const key = `${asistencia.participante_id}_${asistencia.fecha}`;
      asistenciasPorParticipanteFecha[key] = asistencia;
    });
    
    // Crear matriz de asistencia: filas (participantes) x columnas (sesiones)
    const matrizAsistencia = participantes.map(participante => {
      const asistenciasPorSesion = sesiones.map(sesion => {
        const key = `${participante.id}_${sesion.fecha}`;
        return asistenciasPorParticipanteFecha[key] || null;
      });
      
      // Calcular estadísticas de asistencia para este participante
      const totalAsistencias = asistenciasPorSesion.filter(a => a && (a.estado === 'presente' || a.estado === 'atraso')).length;
      const totalAusencias = asistenciasPorSesion.filter(a => a && a.estado === 'ausente').length;
      const totalJustificadas = asistenciasPorSesion.filter(a => a && a.estado === 'justificado').length;
      const totalAtrasos = asistenciasPorSesion.filter(a => a && a.estado === 'atraso').length;
      const porcentajeAsistencia = sesiones.length > 0 ? (totalAsistencias / sesiones.length) * 100 : 0;
      
      return {
        participante: {
          id: participante.id,
          nombre: participante.nombre,
          apellido: participante.apellido,
          rut: participante.rut,
          email: participante.email,
          estado: participante.estado
        },
        asistencias: asistenciasPorSesion,
        estadisticas: {
          total_asistencias: totalAsistencias,
          total_ausencias: totalAusencias,
          total_justificadas: totalJustificadas,
          total_atrasos: totalAtrasos,
          porcentaje_asistencia: porcentajeAsistencia
        }
      };
    });
    
    return res.status(200).json({
      success: true,
      data: {
        curso: {
          id: curso.id,
          nombre: curso.nombre,
          codigo_sence: curso.codigo_sence,
          fecha_inicio: curso.fecha_inicio,
          fecha_fin: curso.fecha_fin
        },
        sesiones: sesiones.map(sesion => ({
          id: sesion.id,
          numero: sesion.numero,
          fecha: sesion.fecha,
          estado: sesion.estado
        })),
        matriz_asistencia: matrizAsistencia,
        estadisticas_generales: {
          total_sesiones: sesiones.length,
          total_participantes: participantes.length,
          promedio_asistencia: participantes.reduce((sum, p) => sum + p.porcentaje_asistencia, 0) / participantes.length
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener reporte de asistencia por curso:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el reporte de asistencia',
      error: error.message
    });
  }
}; 