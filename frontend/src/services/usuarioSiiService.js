import api from './api';

const API_URL = '/usuario-sii';

const usuarioSiiService = {
  getUsuariosSii: async () => {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios Servicio de Impuestos Internos:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al obtener usuarios Servicio de Impuestos Internos');
    }
  },

  createUsuarioSii: async (data) => {
    try {
      const response = await api.post(API_URL, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario Servicio de Impuestos Internos:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al crear usuario Servicio de Impuestos Internos');
    }
  },

  deleteUsuarioSii: async (rut) => {
    try {
      const response = await api.delete(`${API_URL}/${rut}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar usuario Servicio de Impuestos Internos:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al eliminar usuario Servicio de Impuestos Internos');
    }
  },

  updateUsuarioSii: async (rut, data) => {
    try {
      const response = await api.put(`${API_URL}/${rut}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario Servicio de Impuestos Internos:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al actualizar usuario Servicio de Impuestos Internos');
    }
  }
};

export default usuarioSiiService;
