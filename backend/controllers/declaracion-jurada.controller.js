const { DeclaracionJurada, Curso, Participante, Usuario } = require('../models');
const senceService = require('../services/sence.service');
const { Op } = require('sequelize');

// Estado de sincronización en memoria (puedes migrar a Redis o BD si lo necesitas a futuro)
const syncStatus = {};

/**
 * Obtener todas las declaraciones juradas con paginación y filtros
 */
exports.getDeclaracionesJuradas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      estado,
      id_sence
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Construir condiciones de filtrado
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { rut: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (estado) {
      whereConditions.estado = estado;
    }
    
    if (id_sence) {
      whereConditions.id_sence = id_sence;
    }

    // Obtener declaraciones juradas con paginación
    const { count, rows: declaracionesJuradas } = await DeclaracionJurada.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        declaracionesJuradas
      }
    });
  } catch (error) {
    console.error('Error al obtener declaraciones juradas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las declaraciones juradas',
      error: error.message
    });
  }
};

/**
 * Obtener una declaración jurada por ID
 */
exports.getDeclaracionJuradaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const declaracionJurada = await DeclaracionJurada.findByPk(id);
    
    if (!declaracionJurada) {
      return res.status(404).json({
        success: false,
        message: 'Declaración jurada no encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: declaracionJurada
    });
  } catch (error) {
    console.error('Error al obtener declaración jurada por ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la declaración jurada',
      error: error.message
    });
  }
};

/**
 * Obtener declaraciones juradas por id_sence
 */
exports.getDeclaracionesJuradasByIdSence = async (req, res) => {
  try {
    const { idSence } = req.params;
    
    // Obtener declaraciones juradas con el id_sence proporcionado
    const declaracionesJuradas = await DeclaracionJurada.findAll({
      where: { id_sence: idSence },
      order: [['created_at', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: declaracionesJuradas
    });
  } catch (error) {
    console.error('Error al obtener declaraciones juradas por id_sence:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las declaraciones juradas',
      error: error.message
    });
  }
};

/**
 * Crear una nueva declaración jurada
 */
exports.createDeclaracionJurada = async (req, res) => {
  try {
    const {
      id_sence,
      estado,
      rut,
      nombre,
      sesiones
    } = req.body;
    
    // Validar campos obligatorios
    if (!id_sence || !rut || !nombre) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: id_sence, rut, nombre'
      });
    }
    
    // Crear la declaración jurada
    const nuevaDeclaracionJurada = await DeclaracionJurada.create({
      id_sence,
      estado: estado || 'borrador',
      rut,
      nombre,
      sesiones: sesiones || 0
    });
    
    return res.status(201).json({
      success: true,
      message: 'Declaración jurada creada exitosamente',
      data: nuevaDeclaracionJurada
    });
  } catch (error) {
    console.error('Error al crear declaración jurada:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear la declaración jurada',
      error: error.message
    });
  }
};

/**
 * Actualizar una declaración jurada existente
 */
exports.updateDeclaracionJurada = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_sence,
      estado,
      rut,
      nombre,
      sesiones
    } = req.body;
    
    // Verificar si la declaración jurada existe
    const declaracionJurada = await DeclaracionJurada.findByPk(id);
    
    if (!declaracionJurada) {
      return res.status(404).json({
        success: false,
        message: 'Declaración jurada no encontrada'
      });
    }
    
    // Restringir cambios si no está en estado borrador (a menos que sea admin)
    if (declaracionJurada.estado !== 'borrador' && declaracionJurada.estado !== 'rechazada' && !req.userRoles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'No se puede modificar una declaración jurada que no está en estado borrador o rechazada'
      });
    }
    
    // Actualizar la declaración jurada
    await declaracionJurada.update({
      id_sence: id_sence || declaracionJurada.id_sence,
      estado: estado || declaracionJurada.estado,
      rut: rut || declaracionJurada.rut,
      nombre: nombre || declaracionJurada.nombre,
      sesiones: sesiones !== undefined ? sesiones : declaracionJurada.sesiones
    });
    
    return res.status(200).json({
      success: true,
      message: 'Declaración jurada actualizada exitosamente',
      data: declaracionJurada
    });
  } catch (error) {
    console.error('Error al actualizar declaración jurada:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar la declaración jurada',
      error: error.message
    });
  }
};

/**
 * Eliminar una declaración jurada
 */
exports.deleteDeclaracionJurada = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la declaración jurada existe
    const declaracionJurada = await DeclaracionJurada.findByPk(id);
    
    if (!declaracionJurada) {
      return res.status(404).json({
        success: false,
        message: 'Declaración jurada no encontrada'
      });
    }
    
    // Restringir eliminación si no está en estado borrador (a menos que sea admin)
    if (declaracionJurada.estado !== 'borrador' && !req.userRoles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'No se puede eliminar una declaración jurada que no está en estado borrador'
      });
    }
    
    // Eliminar la declaración jurada
    await declaracionJurada.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Declaración jurada eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar declaración jurada:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la declaración jurada',
      error: error.message
    });
  }
};

/**
 * Cambiar el estado de una declaración jurada
 */
exports.cambiarEstadoDeclaracionJurada = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    
    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }
    
    // Verificar si la declaración jurada existe
    const declaracionJurada = await DeclaracionJurada.findByPk(id);
    
    if (!declaracionJurada) {
      return res.status(404).json({
        success: false,
        message: 'Declaración jurada no encontrada'
      });
    }
    
    // Definir datos a actualizar
    const datosActualizacion = {
      estado
    };
    
    // Actualizar la declaración jurada
    await declaracionJurada.update(datosActualizacion);
    
    return res.status(200).json({
      success: true,
      message: `Estado de la declaración jurada actualizado a "${estado}"`,
      data: declaracionJurada
    });
  } catch (error) {
    console.error('Error al cambiar estado de declaración jurada:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado de la declaración jurada',
      error: error.message
    });
  }
};

/**
 * CONSULTA GENÉRICA - NO USAR PARA SINCRONIZAR DECLARACIONES JURADAS DE CURSOS
 * La única forma válida de sincronizar declaraciones juradas de cursos es usando
 * la función sincronizarDeclaracionesJuradas.
 */
exports.consultarDeclaracionesSence = async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      otec,
      djtype,
      input_data
    } = req.body;
    
    // Validar campos obligatorios
    if (!input_data || !Array.isArray(input_data) || input_data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un ID SENCE para consultar'
      });
    }
    
    // Consultar declaraciones juradas en SENCE
    const respuestaSence = await senceService.obtenerDeclaracionesJuradas({
      username,
      password,
      email,
      otec,
      djtype,
      input_data
    });
    
    return res.status(200).json({
      success: true,
      message: 'Consulta de declaraciones juradas realizada exitosamente',
      data: respuestaSence
    });
  } catch (error) {
    console.error('Error al consultar declaraciones juradas en SENCE:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar declaraciones juradas en SENCE',
      error: error.message
    });
  }
};

/**
 * CONSULTA POR CURSO - NO USAR PARA SINCRONIZAR DECLARACIONES JURADAS DE CURSOS
 * La única forma válida de sincronizar declaraciones juradas de cursos es usando
 * la función sincronizarDeclaracionesJuradas.
 */
exports.consultarDeclaracionesPorCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const {
      username,
      password,
      email,
      otec,
      djtype
    } = req.body;
    
    // Verificar si el curso existe
    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({
        success: false,
        message: 'Curso no encontrado'
      });
    }
    
    // Verificar si el curso tiene código SENCE
    if (!curso.codigo_sence) {
      return res.status(400).json({
        success: false,
        message: 'El curso no tiene un código SENCE asignado'
      });
    }
    
    // Consultar declaraciones juradas en SENCE
    const respuestaSence = await senceService.obtenerDeclaracionesPorCurso({
      username,
      password,
      email,
      otec,
      djtype,
      codigo_curso: curso.codigo_sence
    });
    
    // Procesar los datos recibidos y actualizar la base de datos
    if (respuestaSence.status === 'success' && respuestaSence.data.length > 0) {
      // Actualizar la cantidad de participantes en el curso
      await curso.update({
        nro_participantes: respuestaSence.data.length
      });
      
      // Crear o actualizar participantes basados en los datos de SENCE
      for (const declaracion of respuestaSence.data) {
        // Extraer RUT sin formato
        const rutSinFormato = declaracion.RUT.replace(/\./g, '').replace('-', '');
        const dv = rutSinFormato.slice(-1);
        const rutNumerico = rutSinFormato.slice(0, -1);
        
        // Buscar o crear participante
        const [participante, created] = await Participante.findOrCreate({
          where: {
            curso_id: cursoId,
            rut: declaracion.RUT
          },
          defaults: {
            nombre: declaracion.Nombre,
            apellido: '',
            email: `${rutNumerico}@placeholder.com`, // Email placeholder
            estado: declaracion.Estado_Declaracion_Jurada === 'Emitida' ? 'confirmado' : 'inscrito'
          }
        });
        
        // Si el participante ya existía, actualizar su estado
        if (!created && participante) {
          await participante.update({
            estado: declaracion.Estado_Declaracion_Jurada === 'Emitida' ? 'confirmado' : 'inscrito'
          });
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Consulta de declaraciones juradas por curso realizada exitosamente',
      data: respuestaSence
    });
  } catch (error) {
    console.error('Error al consultar declaraciones juradas por curso en SENCE:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar declaraciones juradas por curso en SENCE',
      error: error.message
    });
  }
};

/**
 * Consultar el estado de la sincronización de declaraciones juradas para un curso
 */
exports.getSyncStatus = (req, res) => {
  const { cursoId } = req.params;
  const status = syncStatus[cursoId] || { status: 'no_iniciado' };
  
  // Adaptar la respuesta al formato que espera el frontend
  let success = true;
  let data = {
    progress: 0,
    estado: 'pendiente',
    mensaje: ''
  };
  
  switch (status.status) {
    case 'en_progreso':
      data.estado = 'en_progreso';
      data.progress = 50; // Por defecto 50% mientras está en proceso
      data.mensaje = 'Sincronización en progreso...';
      break;
    case 'completado':
      data.estado = 'completado';
      data.progress = 100;
      data.mensaje = 'Sincronización completada con éxito';
      break;
    case 'error':
      data.estado = 'error';
      data.mensaje = status.error || 'Ocurrió un error durante la sincronización';
      success = false;
      break;
    default:
      data.mensaje = 'No hay sincronización en progreso';
      success = false;
  }
  
  res.json({
    success: success,
    data: data,
    message: data.mensaje
  });
};

/**
 * Sincronizar declaraciones juradas de un curso con el endpoint externo (ahora asíncrono)
 */
exports.sincronizarDeclaracionesJuradas = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const { usuarioSenceRut } = req.body; // Permite seleccionar el usuario SENCE si hay más de uno

    // Marcar como en progreso
    syncStatus[cursoId] = { status: 'en_progreso', startedAt: new Date() };

    // Responder de inmediato al frontend
    res.status(202).json({ success: true, message: 'Sincronización iniciada', status: 'en_progreso' });

    // Ejecutar la sincronización en segundo plano
    (async () => {
      try {
        // Obtener curso
        const curso = await require('../models').Curso.findByPk(cursoId);
        if (!curso) {
          syncStatus[cursoId] = { status: 'error', error: 'Curso no encontrado' };
          return;
        }
        if (!curso.id_sence) {
          syncStatus[cursoId] = { status: 'error', error: 'El curso no tiene id_sence asignado' };
          return;
        }

        // Obtener usuario SENCE (puede haber más de uno, se puede seleccionar por rut)
        const UsuarioSence = require('../models').UsuarioSence;
        let usuarioSence;
        if (usuarioSenceRut) {
          usuarioSence = await UsuarioSence.findByPk(usuarioSenceRut);
        } else {
          usuarioSence = await UsuarioSence.findOne(); // Toma el primero si no se especifica
        }
        if (!usuarioSence) {
          syncStatus[cursoId] = { status: 'error', error: 'No hay usuario SENCE configurado' };
          return;
        }

        // Obtener OTEC
        const OtecData = require('../models').OtecData;
        const otec = await OtecData.findOne();
        if (!otec) {
          syncStatus[cursoId] = { status: 'error', error: 'No hay datos de OTEC configurados' };
          return;
        }

        // Determinar djtype
        let djtype = 3; // Por defecto elearning
        if (curso.modalidad && curso.modalidad.toLowerCase().includes('elearning')) {
          djtype = 2;
        }

        // Ajustar el RUT de la OTEC: quitar guion y dígito verificador
        const rutOtecLimpio = otec.rut.split('-')[0];

        // Preparar payload
        const payload = {
          login_data: {
            username: usuarioSence.rut,
            password: usuarioSence.clave_unica
          },
          otec: rutOtecLimpio,
          djtype: String(djtype),
          input_data: [String(curso.id_sence)]
        };

        // Llamar al endpoint externo
        const axios = require('axios');
        const url = process.env.DECLARACIONES_JURADAS_SYNC_URL;
        const response = await axios.post(url, payload);
        const { data } = response;

        if (data.status !== 'success' || !Array.isArray(data.data)) {
          syncStatus[cursoId] = { status: 'error', error: 'Error en la respuesta del servicio externo', data };
          return;
        }

        // Guardar/actualizar declaraciones juradas en la base de datos
        const DeclaracionJurada = require('../models').DeclaracionJurada;
        const declaraciones = data.data;
        // Mapeo de estados válidos
        const mapEstado = (estado) => {
          if (typeof estado !== 'string') return 'Pendiente';
          if (estado.toLowerCase() === 'emitida') return 'Emitida';
          if (estado.toLowerCase() === 'pendiente de emitir') return 'Pendiente';
          return 'Pendiente'; // Valor por defecto
        };
        for (const dj of declaraciones) {
          const [declaracionExistente, creada] = await DeclaracionJurada.findOrCreate({
            where: { 
              id_sence: String(dj.codigo_curso),
              rut: dj.RUT
            },
            defaults: {
              nombre: dj.Nombre,
              sesiones: dj.Sesiones,
              estado: mapEstado(dj.Estado_Declaracion_Jurada)
            }
          });

          if (!creada) {
            // Si no fue creada, significa que ya existía, entonces actualizamos
            await declaracionExistente.update({
              nombre: dj.Nombre,
              sesiones: dj.Sesiones,
              estado: mapEstado(dj.Estado_Declaracion_Jurada)
            });
          }
        }
        syncStatus[cursoId] = { status: 'completado', finishedAt: new Date() };
      } catch (error) {
        console.error('Error al sincronizar declaraciones juradas:', error);
        syncStatus[cursoId] = { status: 'error', error: error.message };
      }
    })();
  } catch (error) {
    console.error('Error al iniciar la sincronización:', error);
    res.status(500).json({ success: false, message: 'Error al iniciar la sincronización', error: error.message });
  }
}; 