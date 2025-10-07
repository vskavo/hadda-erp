import api from './api';

/**
 * Servicio para gestionar cursos SENCE
 */
const cursoSenceService = {
  /**
   * Obtener todos los cursos SENCE
   * @returns {Promise<Object>} Promise con la respuesta del servidor
   */
  getCursosSence: async () => {
    try {
      const response = await api.get('/cursos-sence');
      return response.data;
    } catch (error) {
      console.error('Error al obtener cursos SENCE:', error);
      throw error;
    }
  },

  /**
   * Obtener un curso SENCE por ID
   * @param {number|string} id - ID del curso SENCE
   * @returns {Promise<Object>} Promise con la respuesta del servidor
   */
  getCursoSenceById: async (id) => {
    try {
      const response = await api.get(`/cursos-sence/${id}`);
      return response.data.curso;
    } catch (error) {
      console.error(`Error al obtener curso SENCE con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Buscar cursos SENCE por nombre o código
   * @param {string} query - Término de búsqueda
   * @returns {Promise<Object>} Promise con la respuesta del servidor
   */
  searchCursosSence: async (query) => {
    try {
      const response = await api.get(`/cursos-sence/search`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error al buscar cursos SENCE:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las modalidades de cursos SENCE
   * @returns {Promise<Object>} Promise con la respuesta del servidor
   */
  getModalidades: async () => {
    try {
      const response = await api.get('/cursos-sence/modalidades');
      return response.data;
    } catch (error) {
      console.error('Error al obtener modalidades de cursos SENCE:', error);
      throw error;
    }
  },

  /**
   * Obtener todos los modos de cursos SENCE
   * @returns {Promise<Object>} Promise con la respuesta del servidor
   */
  getModos: async () => {
    try {
      const response = await api.get('/cursos-sence/modos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener modos de cursos SENCE:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo curso SENCE
   * @param {Object} cursoData - Datos del curso a crear
   * @returns {Promise<Object>} Promise con la respuesta del servidor
   */
  createCursoSence: async (cursoData) => {
    try {
      const response = await api.post('/cursos-sence', cursoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear curso SENCE:', error);
      throw error;
    }
  },

  /**
   * Actualizar un curso SENCE
   * @param {number|string} id - ID del curso a actualizar
   * @param {Object} cursoData - Datos del curso a actualizar
   * @returns {Promise<Object>} Promise con la respuesta del servidor
   */
  updateCursoSence: async (id, cursoData) => {
    try {
      const response = await api.put(`/cursos-sence/${id}`, cursoData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar curso SENCE con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un curso SENCE
   * @param {number|string} id - ID del curso a eliminar
   * @returns {Promise<Object>} Promise con la respuesta del servidor
   */
  deleteCursoSence: async (id) => {
    try {
      const response = await api.delete(`/cursos-sence/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar curso SENCE con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear múltiples cursos SENCE desde CSV
   * @param {Array} cursos - Array de cursos a crear
   * @returns {Promise<Object>} Promise con la respuesta del servidor
   */
  bulkCreateCursosSence: async (cursos) => {
    try {
      const response = await api.post('/cursos-sence/bulk', { cursos });
      return response.data;
    } catch (error) {
      console.error('Error en carga masiva de cursos SENCE:', error);
      throw error;
    }
  },

  /**
   * Descargar plantilla CSV para cursos SENCE
   * @returns {Promise<Blob>} Promise con el archivo CSV
   */
  downloadTemplate: async () => {
    try {
      const response = await api.get('/cursos-sence/template/download', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error al descargar plantilla CSV:', error);
      throw error;
    }
  }
};

export default cursoSenceService; 