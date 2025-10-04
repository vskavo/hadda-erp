import api from './api';

// Servicio para gestión de reportes
const reporteService = {
  // Obtener listado de reportes predefinidos
  getReportesPredefinidos: async () => {
    try {
      const response = await api.get('/reportes/predefinidos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener reportes predefinidos:', error);
      throw error;
    }
  },

  // Obtener un reporte específico por ID
  getReporteById: async (id, params = {}) => {
    try {
      const response = await api.get(`/reportes/${id}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte:', error);
      throw error;
    }
  },

  // Generar un reporte personalizado
  generarReportePersonalizado: async (reporteConfig) => {
    try {
      const response = await api.post('/reportes/generar', reporteConfig);
      return response.data;
    } catch (error) {
      console.error('Error al generar reporte personalizado:', error);
      throw error;
    }
  },

  // Exportar un reporte a Excel
  exportarExcel: async (reporteId, filtros = {}) => {
    try {
      const response = await api.get(`/reportes/${reporteId}/excel`, {
        params: filtros,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      throw error;
    }
  },

  // Exportar un reporte a PDF
  exportarPDF: async (reporteId, filtros = {}) => {
    try {
      const response = await api.get(`/reportes/${reporteId}/pdf`, {
        params: filtros,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      throw error;
    }
  },

  // Obtener los campos disponibles para generar reportes personalizados
  getCamposDisponibles: async (entidad) => {
    try {
      const response = await api.get(`/reportes/campos/${entidad}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener campos disponibles:', error);
      throw error;
    }
  },

  // Guardar un reporte personalizado como predefinido
  guardarReportePredefinido: async (reporteConfig) => {
    try {
      const response = await api.post('/reportes/predefinidos', reporteConfig);
      return response.data;
    } catch (error) {
      console.error('Error al guardar reporte predefinido:', error);
      throw error;
    }
  },

  // Eliminar un reporte predefinido
  eliminarReportePredefinido: async (id) => {
    try {
      const response = await api.delete(`/reportes/predefinidos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar reporte predefinido:', error);
      throw error;
    }
  },
  
  // Obtener estado de un reporte
  getEstadoReporte: async (id) => {
    try {
      const response = await api.get(`/reportes/${id}/estado`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estado del reporte:', error);
      throw error;
    }
  },

  // Obtener datos de un reporte completado
  getDatosReporte: async (id) => {
    try {
      const response = await api.get(`/reportes/${id}/datos`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener datos del reporte:', error);
      throw error;
    }
  },

  // Obtener estadísticas de reportes generados
  getEstadisticasReportes: async () => {
    try {
      const response = await api.get('/reportes/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de reportes:', error);
      throw error;
    }
  }
};

export default reporteService; 