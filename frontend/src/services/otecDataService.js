import api from './api';

const API_URL = '/otec-data';

const otecDataService = {
  getOtecData: async () => {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error al obtener datos OTEC:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al obtener datos OTEC');
    }
  },

  createOtecData: async (data) => {
    try {
      const response = await api.post(API_URL, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear dato OTEC:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al crear dato OTEC');
    }
  },

  deleteOtecData: async (rut) => {
    try {
      const response = await api.delete(`${API_URL}/${rut}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar dato OTEC:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al eliminar dato OTEC');
    }
  }
};

export default otecDataService; 