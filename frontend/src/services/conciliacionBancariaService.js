import api from './api';

// Servicio para gestión de cuentas bancarias
const cuentaBancariaService = {
  // Obtener listado de cuentas bancarias
  getCuentasBancarias: async () => {
    try {
      const response = await api.get('/cuentas-bancarias');
      return response.data;
    } catch (error) {
      console.error('Error al obtener cuentas bancarias:', error);
      throw error;
    }
  },

  // Obtener una cuenta bancaria por ID
  getCuentaBancariaById: async (id) => {
    try {
      const response = await api.get(`/cuentas-bancarias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener cuenta bancaria:', error);
      throw error;
    }
  },

  // Crear una cuenta bancaria
  createCuentaBancaria: async (cuentaData) => {
    try {
      const response = await api.post('/cuentas-bancarias', cuentaData);
      return response.data;
    } catch (error) {
      console.error('Error al crear cuenta bancaria:', error);
      throw error;
    }
  },

  // Actualizar una cuenta bancaria
  updateCuentaBancaria: async (id, cuentaData) => {
    try {
      const response = await api.put(`/cuentas-bancarias/${id}`, cuentaData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar cuenta bancaria:', error);
      throw error;
    }
  },

  // Eliminar una cuenta bancaria
  deleteCuentaBancaria: async (id) => {
    try {
      const response = await api.delete(`/cuentas-bancarias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar cuenta bancaria:', error);
      throw error;
    }
  }
};

// Servicio para gestión de conciliaciones bancarias
const conciliacionBancariaService = {
  // Obtener listado de conciliaciones con paginación y filtros
  getConciliaciones: async (params = {}) => {
    try {
      const response = await api.get('/conciliacion-bancaria', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener conciliaciones bancarias:', error);
      throw error;
    }
  },

  // Obtener una conciliación por ID
  getConciliacionById: async (id) => {
    try {
      const response = await api.get(`/conciliacion-bancaria/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener conciliación bancaria:', error);
      throw error;
    }
  },

  // Crear una conciliación
  createConciliacion: async (conciliacionData) => {
    try {
      const response = await api.post('/conciliacion-bancaria', conciliacionData);
      return response.data;
    } catch (error) {
      console.error('Error al crear conciliación bancaria:', error);
      throw error;
    }
  },

  // Actualizar una conciliación
  updateConciliacion: async (id, conciliacionData) => {
    try {
      const response = await api.put(`/conciliacion-bancaria/${id}`, conciliacionData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar conciliación bancaria:', error);
      throw error;
    }
  },

  // Eliminar una conciliación
  deleteConciliacion: async (id) => {
    try {
      const response = await api.delete(`/conciliacion-bancaria/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar conciliación bancaria:', error);
      throw error;
    }
  }
};

export { cuentaBancariaService, conciliacionBancariaService }; 