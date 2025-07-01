import api from './api';

// Servicio para gestión de clientes
const clienteService = {
  // Obtener listado de clientes con paginación y filtros
  getClientes: async (params = {}) => {
    try {
      // Si no se especifica un límite, establecemos uno alto para obtener todos los clientes
      if (!params.limit) {
        params.limit = 1000;
      }
      
      // Asegurarse de que la página esté establecida
      if (!params.page) {
        params.page = 1;
      }
      
      console.log('Solicitando clientes con parámetros:', params);
      const response = await api.get('/clientes', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  },

  // Obtener un cliente por ID
  getClienteById: async (id) => {
    try {
      const response = await api.get(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      throw error;
    }
  },

  // Crear un cliente
  createCliente: async (clienteData) => {
    try {
      const response = await api.post('/clientes', clienteData);
      return response.data;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  },

  // Actualizar un cliente
  updateCliente: async (id, clienteData) => {
    try {
      const response = await api.put(`/clientes/${id}`, clienteData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  },

  // Eliminar un cliente
  deleteCliente: async (id) => {
    try {
      const response = await api.delete(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  },

  // Actualizar el estado de un cliente
  updateStatus: async (id, statusData) => {
    try {
      const response = await api.patch(`/clientes/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar estado del cliente:', error);
      throw error;
    }
  },

  // Obtener contactos de un cliente
  getContactos: async (clienteId) => {
    try {
      const response = await api.get(`/clientes/${clienteId}/contactos`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener contactos:', error);
      throw error;
    }
  },

  // Obtener el resumen de holdings
  getHoldingsSummary: async () => {
    try {
      // La ruta del backend es /api/clientes/holdings-summary
      // Ajusta la URL si tu configuración de API es diferente
      const response = await api.get('/clientes/holdings-summary'); 
      return response.data;
    } catch (error) {
      console.error("Error al obtener el resumen de holdings:", error.response?.data || error.message);
      throw error.response?.data || error; // Lanza el error para que el componente lo maneje
    }
  },

  // Obtener el detalle de ventas por empresa y proyecto para un holding
  getHoldingSalesDetails: async (nombreHolding) => {
    try {
      const response = await api.get(`/clientes/holdings/${encodeURIComponent(nombreHolding)}/detalles-ventas-proyectos`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener el detalle de ventas del holding:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
};

export default clienteService; 