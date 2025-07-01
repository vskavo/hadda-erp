const cursoService = require('../services/curso.service');

/**
 * Obtener todos los cursos con paginación y filtros
 */
exports.getCursos = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const userRol = req.usuario.rol;
    const result = await cursoService.getAllCursos(req.query, userId, userRol);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al obtener los cursos'
    });
  }
};

/**
 * Obtener un curso por ID
 */
exports.getCursoById = async (req, res) => {
  try {
    const { id } = req.params;
    const cursoData = await cursoService.getCursoById(id);
    return res.status(200).json({
      success: true,
      data: cursoData
    });
  } catch (error) {
    console.error('Error al obtener curso por ID:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al obtener el curso'
    });
  }
};

/**
 * Crear un nuevo curso
 */
exports.createCurso = async (req, res) => {
  try {
    const nuevoCurso = await cursoService.addNewCurso(req.body);
    return res.status(201).json({
      success: true,
      message: 'Curso creado exitosamente',
      data: nuevoCurso
    });
  } catch (error) {
    console.error('Error al crear curso:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al crear el curso'
    });
  }
};

/**
 * Actualizar un curso existente
 */
exports.updateCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const userRol = req.usuario.rol;
    const userId = req.usuario.id;
    const { curso, senceSyncResult } = await cursoService.updateExistingCurso(id, req.body, userRol, userId);
    return res.status(200).json({
      success: true,
      message: 'Curso actualizado exitosamente',
      data: curso,
      senceSync: senceSyncResult
    });
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al actualizar el curso'
    });
  }
};

/**
 * Eliminar un curso
 */
exports.deleteCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await cursoService.removeCurso(id);
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al eliminar el curso'
    });
  }
};

/**
 * Cambiar el estado de un curso
 */
exports.cambiarEstadoCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const curso = await cursoService.changeCursoEstado(id, estado);
    return res.status(200).json({
      success: true,
      message: `Estado del curso actualizado a "${estado}" exitosamente`,
      data: curso
    });
  } catch (error) {
    console.error('Error al cambiar estado del curso:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al cambiar el estado del curso'
    });
  }
};

/**
 * Obtener estadísticas de cursos
 */
exports.getEstadisticasCursos = async (req, res) => {
  try {
    const estadisticas = await cursoService.getCursoEstadisticas();
    return res.status(200).json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de cursos:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al obtener estadísticas de cursos'
    });
  }
};

/**
 * Buscar cursos por código SENCE
 */
exports.buscarPorCodigoSence = async (req, res) => {
  try {
    const { codigo } = req.params;
    const cursos = await cursoService.findCursosBySenceCode(codigo);
    return res.status(200).json({
      success: true,
      data: cursos
    });
  } catch (error) {
    console.error('Error al buscar cursos por código SENCE:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al buscar cursos por código SENCE'
    });
  }
};

/**
 * Obtener resumen de participantes por curso
 */
exports.getResumenParticipantes = async (req, res) => {
  try {
    const { id } = req.params;
    const resumen = await cursoService.getParticipantesResumen(id);
    return res.status(200).json({
      success: true,
      data: resumen
    });
  } catch (error) {
    console.error('Error al obtener resumen de participantes:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al obtener el resumen de participantes'
    });
  }
};

/**
 * Actualizar estado de múltiples participantes
 */
exports.actualizarEstadoMultiple = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await cursoService.updateMultipleParticipantes(id, req.body);
    return res.status(200).json({
      success: true,
      message: `Se actualizaron ${result.actualizados} participantes exitosamente`,
      data: result
    });
  } catch (error) {
    console.error('Error al actualizar múltiples participantes:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al actualizar los participantes'
    });
  }
};

/**
 * Obtener declaraciones juradas de un curso
 */
exports.getDeclaracionesJuradasCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const declaracionesJuradas = await cursoService.getDeclaracionesJuradasByCurso(id);
    return res.status(200).json({
      success: true,
      data: declaracionesJuradas
    });
  } catch (error) {
    console.error('Error al obtener declaraciones juradas del curso:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al obtener las declaraciones juradas del curso'
    });
  }
};

/**
 * Obtener información sincronizada de cursos con datos relacionados
 */
exports.getCursosSincronizados = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const userRol = req.usuario.rol;
    const cursosSincronizados = await cursoService.getCursosSincronizadosConDetalles(userId, userRol);
    return res.status(200).json({
      success: true,
      data: cursosSincronizados
    });
  } catch (error) {
    console.error('Error al obtener cursos sincronizados:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al obtener los cursos sincronizados'
    });
  }
};

/**
 * Cambiar el estado SENCE de un curso
 */
exports.cambiarEstadoSence = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_sence } = req.body;
    const result = await cursoService.changeCursoSenceEstado(id, estado_sence);
    return res.status(200).json({
      success: true,
      message: 'Estado SENCE del curso actualizado exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error al cambiar estado SENCE del curso:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al cambiar el estado SENCE del curso'
    });
  }
};

// Sincronización manual con SENCE para un curso
exports.sincronizarSenceManual = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await cursoService.manualSenceSync(id);
    return res.status(resultado.success ? 200 : 400).json({
      success: resultado.success,
      message: resultado.message || (resultado.success ? 'Sincronización ejecutada' : 'Error en sincronización'),
      data: resultado.data
    });
  } catch (error) {
    console.error('Error al sincronizar con SENCE manualmente:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al sincronizar con SENCE'
    });
  }
};

/**
 * Actualizar certificados de todos los participantes activos de un curso
 */
exports.actualizarCertificadosParticipantes = async (req, res) => {
  try {
    const { id } = req.params;
    const { certificado } = req.body;
    if (typeof certificado !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El valor de certificado debe ser booleano.'
      });
    }
    const result = await cursoService.updateCertificadosParticipantes(id, certificado);
    return res.status(200).json({
      success: true,
      message: `Se actualizaron ${result.actualizados} participantes exitosamente`,
      data: result
    });
  } catch (error) {
    console.error('Error al actualizar certificados masivos:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al actualizar certificados masivos'
    });
  }
}; 