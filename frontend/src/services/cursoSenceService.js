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
  }
};

export default cursoSenceService; 