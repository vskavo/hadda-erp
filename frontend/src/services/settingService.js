import api from './api';

// Servicio para gestión de configuraciones
const settingService = {
  // Obtener todas las configuraciones (solo admin)
  getSettings: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuraciones:', error);
      throw error;
    }
  },

  // Obtener una configuración por clave
  getSettingByKey: async (key) => {
    try {
      const response = await api.get(`/settings/${key}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener configuración ${key}:`, error);
      throw error;
    }
  },

  // Obtener valor de IVA
  getIVA: async () => {
    try {
      const response = await api.get('/settings/iva/valor');
      
      // Verificar si la respuesta es válida
      if (response && response.data && response.data.value !== undefined) {
        return response.data;
      } else {
        console.warn('Respuesta de IVA incompleta o inválida, usando valor por defecto');
        return { value: 19, description: 'Valor por defecto (19%)' };
      }
    } catch (error) {
      console.error('Error al obtener valor de IVA:', error);
      // En caso de error, devolver un valor por defecto
      return { value: 19, description: 'Valor por defecto (19%)' };
    }
  },

  // Obtener el valor de Retención de Honorarios
  getRetencionHonorarios: async () => {
    try {
      const response = await api.get('/settings/retencion-honorarios/valor');
      return response.data; // Esperamos { value: number, description: string }
    } catch (error) {
      console.error('Error al obtener el valor de Retención Honorarios:', error);
      throw error;
    }
  },

  // Crear una configuración nueva (solo admin)
  createSetting: async (settingData) => {
    try {
      const response = await api.post('/settings', settingData);
      return response.data;
    } catch (error) {
      console.error('Error al crear configuración:', error);
      throw error;
    }
  },

  // Actualizar una configuración existente (solo admin)
  updateSetting: async (key, settingData) => {
    try {
      const response = await api.put(`/settings/${key}`, settingData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  },

  // Eliminar una configuración (solo admin)
  deleteSetting: async (key) => {
    try {
      const response = await api.delete(`/settings/${key}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      throw error;
    }
  }
};

export default settingService; 