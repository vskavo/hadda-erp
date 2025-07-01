import api from './api';

/**
 * Servicio para gestionar operaciones relacionadas con cursos
 */
const cursoService = {
  /**
   * Obtener todos los cursos con paginación y filtros opcionales
   * @param {Object} params - Parámetros de filtrado y paginación
   * @returns {Promise} - Promesa con los datos de los cursos
   */
  getCursos: async (params = {}) => {
    try {
      const response = await api.get('/cursos', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener cursos:', error);
      throw error;
    }
  },

  /**
   * Obtener un curso específico por su ID
   * @param {Number} id - ID del curso
   * @returns {Promise} - Promesa con los datos del curso
   */
  getCursoById: async (id) => {
    try {
      const response = await api.get(`/cursos/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener curso por ID:', error);
      throw error;
    }
  },

  /**
   * Obtener cursos sincronizados con información de proyectos, clientes y responsables
   * @returns {Promise} - Promesa con los datos sincronizados de cursos
   */
  getCursosSincronizados: async () => {
    try {
      const response = await api.get('/cursos/sincronizados');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener cursos sincronizados:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo curso
   * @param {Object} cursoData - Datos del nuevo curso
   * @returns {Promise} - Promesa con el resultado de la operación
   */
  createCurso: async (cursoData) => {
    try {
      const response = await api.post('/cursos', cursoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear curso:', error);
      throw error;
    }
  },

  /**
   * Actualizar un curso existente
   * @param {Number} id - ID del curso a actualizar
   * @param {Object} cursoData - Nuevos datos del curso
   * @returns {Promise} - Promesa con el resultado de la operación
   */
  updateCurso: async (id, cursoData) => {
    try {
      const response = await api.put(`/cursos/${id}`, cursoData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar curso:', error);
      throw error;
    }
  },

  /**
   * Eliminar un curso
   * @param {Number} id - ID del curso a eliminar
   * @returns {Promise} - Promesa con el resultado de la operación
   */
  deleteCurso: async (id) => {
    try {
      // Convertir el ID a número para asegurar el tipo correcto
      const numericId = Number(id);
      console.log('Service - Eliminando curso con ID:', numericId);
      const response = await api.delete(`/cursos/${numericId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar curso:', error);
      throw error;
    }
  },

  /**
   * Cambiar el estado de un curso
   * @param {Number} id - ID del curso
   * @param {String} estado - Nuevo estado del curso
   * @returns {Promise} - Promesa con el resultado de la operación
   */
  cambiarEstadoCurso: async (id, estado) => {
    try {
      const response = await api.patch(`/cursos/${id}/estado`, { estado });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado del curso:', error);
      throw error;
    }
  },

  // Sincronizar declaraciones juradas de un curso
  syncDeclaracionesJuradas: async (cursoId) => {
    return api.post(`/declaraciones-juradas/sincronizar/${cursoId}`);
  },

  // Consultar estado de sincronización de declaraciones juradas de un curso
  getSyncStatus: async (cursoId) => {
    return api.get(`/declaraciones-juradas/sync-status/${cursoId}`);
  }
};

export default cursoService; 