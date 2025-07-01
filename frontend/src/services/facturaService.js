import api from './api';

// Servicio para gestión de facturas
const facturaService = {
  // Obtener listado de facturas con paginación y filtros
  getFacturas: async (params = {}) => {
    try {
      const response = await api.get('/facturas', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      throw error;
    }
  },

  // Obtener una factura por ID
  getFacturaById: async (id) => {
    try {
      const response = await api.get(`/facturas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener factura:', error);
      throw error;
    }
  },

  // Crear una factura
  createFactura: async (facturaData) => {
    try {
      const response = await api.post('/facturas', facturaData);
      return response.data;
    } catch (error) {
      console.error('Error al crear factura:', error);
      throw error;
    }
  },

  // Actualizar una factura
  updateFactura: async (id, facturaData) => {
    try {
      const response = await api.put(`/facturas/${id}`, facturaData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      throw error;
    }
  },

  // Eliminar una factura
  deleteFactura: async (id) => {
    try {
      const response = await api.delete(`/facturas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      throw error;
    }
  },

  // Cambiar estado de una factura
  cambiarEstadoFactura: async (id, nuevoEstado) => {
    try {
      const response = await api.put(`/facturas/${id}/estado`, { estado: nuevoEstado });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado de factura:', error);
      throw error;
    }
  },

  // Obtener estadísticas de facturas
  getEstadisticas: async () => {
    try {
      const response = await api.get('/facturas/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de facturas:', error);
      throw error;
    }
  }
};

export default facturaService; 