import api from './api';

const API_URL = '/usuarios-sence';

const usuariosSenceService = {
  getUsuariosSence: async () => {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios Sence:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al obtener usuarios Sence');
    }
  },

  createUsuarioSence: async (data) => {
    try {
      const response = await api.post(API_URL, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario Sence:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al crear usuario Sence');
    }
  },

  deleteUsuarioSence: async (rut) => {
    try {
      const response = await api.delete(`${API_URL}/${rut}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar usuario Sence:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al eliminar usuario Sence');
    }
  },

  updateUsuarioSence: async (rut, data) => {
    try {
      const response = await api.put(`${API_URL}/${rut}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario Sence:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al actualizar usuario Sence');
    }
  }
};

export default usuariosSenceService; 