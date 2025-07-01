const { Participante, Curso } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener todos los participantes de un curso
 */
exports.getParticipantesByCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = '',
      estado
    } = req.query;

    // Verificar si el curso existe
    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({
        success: false,
        message: 'Curso no encontrado'
      });
    }

    const offset = (page - 1) * limit;
    
    // Construir condiciones de filtrado
    const whereConditions = { curso_id: cursoId };
    
    if (search) {
      whereConditions[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { apellido: { [Op.iLike]: `%${search}%` } },
        { rut: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (estado) {
      whereConditions.estado = estado;
    }

    // Obtener participantes con paginación
    const { count, rows: participantes } = await Participante.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      attributes: { include: ['certificado'] }
    });

    return res.status(200).json({
      success: true,
      data: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        participantes
      }
    });
  } catch (error) {
    console.error('Error al obtener participantes del curso:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los participantes del curso',
      error: error.message
    });
  }
};

/**
 * Obtener un participante por ID
 */
exports.getParticipanteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const participante = await Participante.findByPk(id, {
      attributes: { include: ['certificado'] },
      include: [
        {
          model: Curso,
          attributes: ['id', 'nombre', 'codigo_sence', 'fecha_inicio', 'fecha_fin']
        }
      ]
    });
    
    if (!participante) {
      return res.status(404).json({
        success: false,
        message: 'Participante no encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: participante
    });
  } catch (error) {
    console.error('Error al obtener participante por ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el participante',
      error: error.message
    });
  }
};

/**
 * Crear un nuevo participante
 */
exports.createParticipante = async (req, res) => {
  try {
    const {
      curso_id,
      rut,
      nombre,
      apellido,
      email,
      telefono,
      fecha_nacimiento,
      genero,
      direccion,
      comuna,
      ciudad,
      nivel_educacional,
      empresa,
      cargo,
      estado,
      observaciones,
      certificado
    } = req.body;
    
    // Validar campos obligatorios
    if (!curso_id || !rut || !nombre || !apellido || !email) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: curso_id, rut, nombre, apellido, email'
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
    
    // Verificar si ya existe un participante con el mismo RUT en el mismo curso
    const participanteExistente = await Participante.findOne({
      where: { 
        curso_id,
        rut
      }
    });
    
    if (participanteExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un participante con el mismo RUT en este curso'
      });
    }
    
    // Crear el participante
    const nuevoParticipante = await Participante.create({
      curso_id,
      rut,
      nombre,
      apellido,
      email,
      telefono,
      fecha_nacimiento,
      genero,
      direccion,
      comuna,
      ciudad,
      nivel_educacional,
      empresa,
      cargo,
      estado: estado || 'inscrito',
      observaciones,
      certificado: certificado !== undefined ? certificado : false
    });
    
    // Actualizar el contador de participantes en el curso
    await curso.update({
      nro_participantes: curso.nro_participantes + 1,
      fecha_actualizacion: new Date()
    });
    
    return res.status(201).json({
      success: true,
      message: 'Participante creado exitosamente',
      data: nuevoParticipante
    });
  } catch (error) {
    console.error('Error al crear participante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear el participante',
      error: error.message
    });
  }
};

/**
 * Actualizar un participante existente
 */
exports.updateParticipante = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rut,
      nombre,
      apellido,
      email,
      telefono,
      fecha_nacimiento,
      genero,
      direccion,
      comuna,
      ciudad,
      nivel_educacional,
      empresa,
      cargo,
      estado,
      porcentaje_asistencia,
      nota_final,
      observaciones,
      certificado
    } = req.body;
    
    // Verificar si el participante existe
    const participante = await Participante.findByPk(id);
    
    if (!participante) {
      return res.status(404).json({
        success: false,
        message: 'Participante no encontrado'
      });
    }
    
    // Si se está cambiando el RUT, verificar que no exista otro participante con ese RUT en el mismo curso
    if (rut && rut !== participante.rut) {
      const participanteExistente = await Participante.findOne({
        where: { 
          curso_id: participante.curso_id,
          rut,
          id: { [Op.ne]: id }
        }
      });
      
      if (participanteExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro participante con el mismo RUT en este curso'
        });
      }
    }
    
    // Actualizar el participante
    await participante.update({
      rut,
      nombre,
      apellido,
      email,
      telefono,
      fecha_nacimiento,
      genero,
      direccion,
      comuna,
      ciudad,
      nivel_educacional,
      empresa,
      cargo,
      estado,
      porcentaje_asistencia,
      nota_final,
      observaciones,
      certificado: certificado !== undefined ? certificado : participante.certificado
    });
    
    // Si se cambió el estado a 'aprobado', 'reprobado' o 'retirado', actualizar los contadores del curso
    if (estado && estado !== participante.estado) {
      const curso = await Curso.findByPk(participante.curso_id);
      
      if (curso) {
        // Si el estado anterior era 'aprobado', 'reprobado' o 'retirado', restar del contador correspondiente
        if (participante.estado === 'aprobado') {
          curso.participantes_aprobados = Math.max(0, curso.participantes_aprobados - 1);
        } else if (participante.estado === 'reprobado') {
          curso.participantes_reprobados = Math.max(0, curso.participantes_reprobados - 1);
        } else if (participante.estado === 'retirado') {
          curso.participantes_eliminados = Math.max(0, curso.participantes_eliminados - 1);
        }
        
        // Sumar al contador correspondiente según el nuevo estado
        if (estado === 'aprobado') {
          curso.participantes_aprobados += 1;
        } else if (estado === 'reprobado') {
          curso.participantes_reprobados += 1;
        } else if (estado === 'retirado') {
          curso.participantes_eliminados += 1;
        }
        
        await curso.update({
          participantes_aprobados: curso.participantes_aprobados,
          participantes_reprobados: curso.participantes_reprobados,
          participantes_eliminados: curso.participantes_eliminados,
          fecha_actualizacion: new Date()
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Participante actualizado exitosamente',
      data: participante
    });
  } catch (error) {
    console.error('Error al actualizar participante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el participante',
      error: error.message
    });
  }
};

/**
 * Eliminar un participante
 */
exports.deleteParticipante = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el participante existe
    const participante = await Participante.findByPk(id);
    
    if (!participante) {
      return res.status(404).json({
        success: false,
        message: 'Participante no encontrado'
      });
    }
    
    // Obtener el curso para actualizar contadores
    const curso = await Curso.findByPk(participante.curso_id);
    
    // En vez de eliminar físicamente, marcamos como retirado
    if (participante.estado !== 'retirado') {
      await participante.update({ estado: 'retirado' });
      // Actualizar contadores del curso
      if (curso) {
        // Restar del contador correspondiente según el estado anterior
        if (participante.estado === 'aprobado') {
          curso.participantes_aprobados = Math.max(0, curso.participantes_aprobados - 1);
        } else if (participante.estado === 'reprobado') {
          curso.participantes_reprobados = Math.max(0, curso.participantes_reprobados - 1);
        }
        // Sumar al contador de eliminados
        curso.participantes_eliminados += 1;
        // Actualizar el número total de participantes
        curso.nro_participantes = Math.max(0, curso.nro_participantes - 1);
        await curso.update({
          nro_participantes: curso.nro_participantes,
          participantes_aprobados: curso.participantes_aprobados,
          participantes_reprobados: curso.participantes_reprobados,
          participantes_eliminados: curso.participantes_eliminados,
          fecha_actualizacion: new Date()
        });
      }
    }
    return res.status(200).json({
      success: true,
      message: 'Participante marcado como retirado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar participante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar el participante',
      error: error.message
    });
  }
};

/**
 * Cambiar el estado de un participante
 */
exports.cambiarEstadoParticipante = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, nota_final, porcentaje_asistencia } = req.body;
    
    // Validar el estado
    const estadosValidos = ['inscrito', 'confirmado', 'asistiendo', 'aprobado', 'reprobado', 'retirado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido. Los estados permitidos son: inscrito, confirmado, asistiendo, aprobado, reprobado, retirado'
      });
    }
    
    // Verificar si el participante existe
    const participante = await Participante.findByPk(id);
    
    if (!participante) {
      return res.status(404).json({
        success: false,
        message: 'Participante no encontrado'
      });
    }
    
    // Guardar el estado anterior para actualizar contadores
    const estadoAnterior = participante.estado;
    
    // Actualizar el participante
    const datosActualizacion = { estado };
    
    if (nota_final !== undefined) {
      datosActualizacion.nota_final = nota_final;
    }
    
    if (porcentaje_asistencia !== undefined) {
      datosActualizacion.porcentaje_asistencia = porcentaje_asistencia;
    }
    
    await participante.update(datosActualizacion);
    
    // Actualizar contadores del curso si el estado cambió
    if (estado !== estadoAnterior) {
      const curso = await Curso.findByPk(participante.curso_id);
      
      if (curso) {
        // Restar del contador correspondiente según el estado anterior
        if (estadoAnterior === 'aprobado') {
          curso.participantes_aprobados = Math.max(0, curso.participantes_aprobados - 1);
        } else if (estadoAnterior === 'reprobado') {
          curso.participantes_reprobados = Math.max(0, curso.participantes_reprobados - 1);
        } else if (estadoAnterior === 'retirado') {
          curso.participantes_eliminados = Math.max(0, curso.participantes_eliminados - 1);
        }
        
        // Sumar al contador correspondiente según el nuevo estado
        if (estado === 'aprobado') {
          curso.participantes_aprobados += 1;
        } else if (estado === 'reprobado') {
          curso.participantes_reprobados += 1;
        } else if (estado === 'retirado') {
          curso.participantes_eliminados += 1;
        }
        
        await curso.update({
          participantes_aprobados: curso.participantes_aprobados,
          participantes_reprobados: curso.participantes_reprobados,
          participantes_eliminados: curso.participantes_eliminados,
          fecha_actualizacion: new Date()
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Estado del participante actualizado a "${estado}" exitosamente`,
      data: participante
    });
  } catch (error) {
    console.error('Error al cambiar estado del participante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado del participante',
      error: error.message
    });
  }
};

/**
 * Importar participantes desde un archivo CSV
 */
exports.importarParticipantes = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const { participantes } = req.body;
    
    if (!Array.isArray(participantes) || participantes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron datos de participantes válidos'
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
    
    const resultados = {
      exitosos: 0,
      fallidos: 0,
      errores: []
    };
    
    // Procesar cada participante
    for (const participanteData of participantes) {
      try {
        // Verificar campos obligatorios
        if (!participanteData.rut || !participanteData.nombre || !participanteData.apellido || !participanteData.email) {
          resultados.fallidos++;
          resultados.errores.push({
            rut: participanteData.rut || 'No proporcionado',
            error: 'Faltan campos obligatorios: rut, nombre, apellido, email'
          });
          continue;
        }
        
        // Verificar si ya existe un participante con el mismo RUT en el curso
        const participanteExistente = await Participante.findOne({
          where: { 
            curso_id: cursoId,
            rut: participanteData.rut
          }
        });
        
        if (participanteExistente) {
          resultados.fallidos++;
          resultados.errores.push({
            rut: participanteData.rut,
            error: 'Ya existe un participante con este RUT en el curso'
          });
          continue;
        }
        
        // Crear el participante
        await Participante.create({
          curso_id: cursoId,
          rut: participanteData.rut,
          nombre: participanteData.nombre,
          apellido: participanteData.apellido,
          email: participanteData.email,
          telefono: participanteData.telefono,
          fecha_nacimiento: participanteData.fecha_nacimiento,
          genero: participanteData.genero,
          direccion: participanteData.direccion,
          comuna: participanteData.comuna,
          ciudad: participanteData.ciudad,
          nivel_educacional: participanteData.nivel_educacional,
          empresa: participanteData.empresa,
          cargo: participanteData.cargo,
          estado: participanteData.estado || 'inscrito',
          observaciones: participanteData.observaciones
        });
        
        resultados.exitosos++;
      } catch (error) {
        resultados.fallidos++;
        resultados.errores.push({
          rut: participanteData.rut || 'No proporcionado',
          error: error.message
        });
      }
    }
    
    // Actualizar el contador de participantes en el curso
    await curso.update({
      nro_participantes: curso.nro_participantes + resultados.exitosos,
      fecha_actualizacion: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: `Importación completada: ${resultados.exitosos} participantes importados exitosamente, ${resultados.fallidos} fallidos`,
      data: resultados
    });
  } catch (error) {
    console.error('Error al importar participantes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al importar participantes',
      error: error.message
    });
  }
};

/**
 * Buscar participantes por RUT
 */
exports.buscarPorRut = async (req, res) => {
  try {
    const { rut } = req.params;
    
    const participantes = await Participante.findAll({
      where: {
        rut: {
          [Op.iLike]: `%${rut}%`
        }
      },
      include: [
        {
          model: Curso,
          attributes: ['id', 'nombre', 'codigo_sence', 'fecha_inicio', 'fecha_fin']
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: participantes
    });
  } catch (error) {
    console.error('Error al buscar participantes por RUT:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar participantes por RUT',
      error: error.message
    });
  }
}; 