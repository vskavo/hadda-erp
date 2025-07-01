import api from './api';

// Servicio para gestión de ingresos
const ingresoService = {
  // Obtener listado de ingresos con paginación y filtros
  getIngresos: async (params = {}) => {
    try {
      const response = await api.get('/ingresos', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener ingresos:', error);
      throw error;
    }
  },

  // Obtener un ingreso por ID
  getIngresoById: async (id) => {
    try {
      const response = await api.get(`/ingresos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener ingreso:', error);
      throw error;
    }
  },

  // Crear un ingreso
  createIngreso: async (ingresoData) => {
    try {
      const response = await api.post('/ingresos', ingresoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear ingreso:', error);
      throw error;
    }
  },

  // Actualizar un ingreso
  updateIngreso: async (id, ingresoData) => {
    try {
      const response = await api.put(`/ingresos/${id}`, ingresoData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar ingreso:', error);
      throw error;
    }
  },

  // Eliminar un ingreso
  deleteIngreso: async (id) => {
    try {
      const response = await api.delete(`/ingresos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar ingreso:', error);
      throw error;
    }
  }
};

// Servicio para gestión de egresos
const egresoService = {
  // Obtener listado de egresos con paginación y filtros
  getEgresos: async (params = {}) => {
    try {
      const response = await api.get('/egresos', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener egresos:', error);
      throw error;
    }
  },

  // Obtener un egreso por ID
  getEgresoById: async (id) => {
    try {
      const response = await api.get(`/egresos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener egreso:', error);
      throw error;
    }
  },

  // Crear un egreso
  createEgreso: async (egresoData) => {
    try {
      const response = await api.post('/egresos', egresoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear egreso:', error);
      throw error;
    }
  },

  // Actualizar un egreso
  updateEgreso: async (id, egresoData) => {
    try {
      const response = await api.put(`/egresos/${id}`, egresoData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar egreso:', error);
      throw error;
    }
  },

  // Eliminar un egreso
  deleteEgreso: async (id) => {
    try {
      const response = await api.delete(`/egresos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar egreso:', error);
      throw error;
    }
  }
};

export { ingresoService, egresoService }; 