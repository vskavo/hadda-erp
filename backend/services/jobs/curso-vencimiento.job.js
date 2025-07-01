const { Op } = require('sequelize');
const { Curso, Usuario } = require('../../models');
const emailService = require('../email.service');
const { logInfo, logError } = require('../../utils/logger');

/**
 * Envía notificaciones sobre cursos próximos a vencer
 * @returns {Promise<void>}
 */
const notificarCursosVencimiento = async () => {
  try {
    const fechaHoy = new Date();
    // Fecha de 30 días en el futuro
    const fecha30Dias = new Date();
    fecha30Dias.setDate(fechaHoy.getDate() + 30);
    
    // Fecha de 15 días en el futuro
    const fecha15Dias = new Date();
    fecha15Dias.setDate(fechaHoy.getDate() + 15);
    
    // Fecha de 7 días en el futuro
    const fecha7Dias = new Date();
    fecha7Dias.setDate(fechaHoy.getDate() + 7);
    
    // Buscar cursos que vencen en los próximos 30 días
    const cursos = await Curso.findAll({
      where: {
        fechaFin: {
          [Op.between]: [fechaHoy, fecha30Dias]
        },
        activo: true
      },
      include: [
        {
          model: Usuario,
          as: 'responsable',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });
    
    if (cursos.length === 0) {
      logInfo('No hay cursos próximos a vencer en los siguientes 30 días');
      return;
    }
    
    logInfo(`Se encontraron ${cursos.length} cursos próximos a vencer`);
    
    // Agrupar cursos por días para vencimiento
    const cursos7Dias = [];
    const cursos15Dias = [];
    const cursos30Dias = [];
    
    cursos.forEach(curso => {
      const fechaVencimiento = new Date(curso.fechaFin);
      const diasDiferencia = Math.ceil((fechaVencimiento - fechaHoy) / (1000 * 60 * 60 * 24));
      
      if (diasDiferencia <= 7) {
        cursos7Dias.push(curso);
      } else if (diasDiferencia <= 15) {
        cursos15Dias.push(curso);
      } else {
        cursos30Dias.push(curso);
      }
    });
    
    // Enviar notificaciones para cursos que vencen en 7 días (urgente)
    if (cursos7Dias.length > 0) {
      await notificarGrupo(cursos7Dias, 7);
    }
    
    // Enviar notificaciones para cursos que vencen en 15 días
    if (cursos15Dias.length > 0) {
      await notificarGrupo(cursos15Dias, 15);
    }
    
    // Enviar notificaciones para cursos que vencen en 30 días
    if (cursos30Dias.length > 0) {
      await notificarGrupo(cursos30Dias, 30);
    }
    
    logInfo('Notificaciones de vencimiento de cursos enviadas exitosamente');
  } catch (error) {
    logError('Error al enviar notificaciones de vencimiento de cursos', error);
    throw error;
  }
};

/**
 * Envía notificaciones para un grupo de cursos
 * @param {Array} cursos - Lista de cursos
 * @param {number} dias - Días para vencimiento
 * @returns {Promise<void>}
 */
const notificarGrupo = async (cursos, dias) => {
  // Agrupar cursos por responsable
  const cursosPorResponsable = {};
  
  cursos.forEach(curso => {
    if (curso.responsable && curso.responsable.email) {
      if (!cursosPorResponsable[curso.responsable.email]) {
        cursosPorResponsable[curso.responsable.email] = {
          responsable: curso.responsable,
          cursos: []
        };
      }
      
      cursosPorResponsable[curso.responsable.email].cursos.push(curso);
    }
  });
  
  // Determinar la categoría de urgencia
  let categoria = 'normal';
  if (dias <= 7) {
    categoria = 'urgente';
  } else if (dias <= 15) {
    categoria = 'importante';
  }
  
  // Enviar emails a cada responsable
  const promesas = Object.values(cursosPorResponsable).map(async ({ responsable, cursos }) => {
    try {
      const asunto = dias <= 7 
        ? `URGENTE: ${cursos.length} cursos vencen en menos de ${dias} días`
        : `Notificación: ${cursos.length} cursos vencen en ${dias} días`;
      
      const infoCursos = cursos.map(curso => ({
        id: curso.id,
        nombre: curso.nombre,
        codigo: curso.codigo,
        fechaFin: new Date(curso.fechaFin).toLocaleDateString('es-CL'),
        diasRestantes: Math.ceil((new Date(curso.fechaFin) - new Date()) / (1000 * 60 * 60 * 24))
      }));
      
      await emailService.enviarEmail({
        to: responsable.email,
        subject: asunto,
        template: 'notificacion-vencimiento-curso',
        context: {
          responsable: `${responsable.nombre} ${responsable.apellido}`,
          cursos: infoCursos,
          diasVencimiento: dias,
          categoria
        }
      });
      
      logInfo(`Notificación de vencimiento enviada a ${responsable.email} para ${cursos.length} cursos`);
    } catch (error) {
      logError(`Error al enviar notificación a ${responsable.email}`, error);
    }
  });
  
  await Promise.all(promesas);
};

module.exports = notificarCursosVencimiento; 