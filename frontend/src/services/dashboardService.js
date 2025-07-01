import api from './api';

// Servicio para obtener datos del dashboard
const dashboardService = {
  // Obtener estadísticas generales
  getEstadisticas: async () => {
    try {
      const response = await api.get('/dashboard/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas del dashboard:', error);
      throw error;
    }
  },
  
  // Obtener actividades recientes
  getActividadesRecientes: async (limit = 5) => {
    try {
      const response = await api.get('/dashboard/actividades', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error al obtener actividades recientes:', error);
      throw error;
    }
  },
  
  // Obtener próximos cursos
  getProximosCursos: async (limit = 3) => {
    try {
      const response = await api.get('/dashboard/proximos-cursos', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error al obtener próximos cursos:', error);
      throw error;
    }
  },
  
  // Obtener resumen financiero
  getResumenFinanciero: async (periodo = 'mensual') => {
    try {
      const response = await api.get('/dashboard/financiero', { params: { periodo } });
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen financiero:', error);
      throw error;
    }
  },
  
  // Obtener todos los datos del dashboard en una sola llamada
  getDashboardCompleto: async () => {
    try {
      const response = await api.get('/dashboard/completo');
      return response.data;
    } catch (error) {
      console.error('Error al obtener datos completos del dashboard:', error);
      throw error;
    }
  }
};

export default dashboardService; 