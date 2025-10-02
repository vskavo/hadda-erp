// Servicio para interactuar con la API de SII (Servicio de Impuestos Internos)
import api from './api';

// Servicio para ingresos SII
export const siiIngresosService = {
  // Obtener todos los ingresos SII con filtros
  async getSiiIngresos(params = {}) {
    try {
      const response = await api.get('/sii/ingresos', { params });
      return {
        ingresos: response.data.ingresos || response.data.rows || [],
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1
      };
    } catch (error) {
      console.error('Error al obtener ingresos SII:', error);
      throw error;
    }
  },

  // Obtener un ingreso SII por ID
  async getSiiIngreso(id) {
    try {
      const response = await api.get(`/sii/ingresos/${id}`);
      return {
        ingreso: response.data.ingreso || response.data
      };
    } catch (error) {
      console.error(`Error al obtener ingreso SII ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo ingreso SII
  async createSiiIngreso(data) {
    try {
      const response = await api.post('/sii/ingresos', data);
      return {
        ingreso: response.data.ingreso || response.data,
        message: response.data.message || 'Ingreso SII creado exitosamente'
      };
    } catch (error) {
      console.error('Error al crear ingreso SII:', error);
      throw error;
    }
  },

  // Actualizar un ingreso SII
  async updateSiiIngreso(id, data) {
    try {
      const response = await api.put(`/sii/ingresos/${id}`, data);
      return {
        ingreso: response.data.ingreso || response.data,
        message: response.data.message || 'Ingreso SII actualizado exitosamente'
      };
    } catch (error) {
      console.error(`Error al actualizar ingreso SII ${id}:`, error);
      throw error;
    }
  },

  // Actualizar proyecto de un ingreso SII
  async actualizarProyecto(id, proyectoData) {
    try {
      const response = await api.put(`/sii/ingresos/${id}/proyecto`, proyectoData);
      return {
        ingreso: response.data.ingreso || response.data,
        message: response.data.message || 'Proyecto actualizado exitosamente'
      };
    } catch (error) {
      console.error(`Error al actualizar proyecto del ingreso SII ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un ingreso SII
  async deleteSiiIngreso(id) {
    try {
      const response = await api.delete(`/sii/ingresos/${id}`);
      return {
        message: response.data.message || 'Ingreso SII eliminado exitosamente'
      };
    } catch (error) {
      console.error(`Error al eliminar ingreso SII ${id}:`, error);
      throw error;
    }
  },

  // Sincronizar ingresos desde SII
  async sincronizarIngresosSii(params = {}) {
    try {
      const response = await api.post('/sii/ingresos/sincronizar', params);
      return {
        message: response.data.message || 'Sincronización completada',
        nuevosRegistros: response.data.nuevosRegistros || 0,
        actualizados: response.data.actualizados || 0
      };
    } catch (error) {
      console.error('Error al sincronizar ingresos SII:', error);
      throw error;
    }
  }
};

// Servicio para egresos SII
export const siiEgresosService = {
  // Obtener todos los egresos SII con filtros
  async getSiiEgresos(params = {}) {
    try {
      const response = await api.get('/sii/egresos', { params });
      return {
        egresos: response.data.egresos || response.data.rows || [],
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1
      };
    } catch (error) {
      console.error('Error al obtener egresos SII:', error);
      throw error;
    }
  },

  // Obtener un egreso SII por ID
  async getSiiEgreso(id) {
    try {
      const response = await api.get(`/sii/egresos/${id}`);
      return {
        egreso: response.data.egreso || response.data
      };
    } catch (error) {
      console.error(`Error al obtener egreso SII ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo egreso SII
  async createSiiEgreso(data) {
    try {
      const response = await api.post('/sii/egresos', data);
      return {
        egreso: response.data.egreso || response.data,
        message: response.data.message || 'Egreso SII creado exitosamente'
      };
    } catch (error) {
      console.error('Error al crear egreso SII:', error);
      throw error;
    }
  },

  // Actualizar un egreso SII
  async updateSiiEgreso(id, data) {
    try {
      const response = await api.put(`/sii/egresos/${id}`, data);
      return {
        egreso: response.data.egreso || response.data,
        message: response.data.message || 'Egreso SII actualizado exitosamente'
      };
    } catch (error) {
      console.error(`Error al actualizar egreso SII ${id}:`, error);
      throw error;
    }
  },

  // Actualizar proyecto de un egreso SII
  async actualizarProyecto(id, proyectoData) {
    try {
      const response = await api.put(`/sii/egresos/${id}/proyecto`, proyectoData);
      return {
        egreso: response.data.egreso || response.data,
        message: response.data.message || 'Proyecto actualizado exitosamente'
      };
    } catch (error) {
      console.error(`Error al actualizar proyecto del egreso SII ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un egreso SII
  async deleteSiiEgreso(id) {
    try {
      const response = await api.delete(`/sii/egresos/${id}`);
      return {
        message: response.data.message || 'Egreso SII eliminado exitosamente'
      };
    } catch (error) {
      console.error(`Error al eliminar egreso SII ${id}:`, error);
      throw error;
    }
  },

  // Sincronizar egresos desde SII
  async sincronizarEgresosSii(params = {}) {
    try {
      const response = await api.post('/sii/egresos/sincronizar', params);
      return {
        message: response.data.message || 'Sincronización completada',
        nuevosRegistros: response.data.nuevosRegistros || 0,
        actualizados: response.data.actualizados || 0
      };
    } catch (error) {
      console.error('Error al sincronizar egresos SII:', error);
      throw error;
    }
  }
};

// Servicio general para SII
export const siiService = {
  // Obtener estadísticas generales de SII
  async getEstadisticasSii(fechaInicio, fechaFin) {
    try {
      const params = {};
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;

      const response = await api.get('/sii/estadisticas', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas SII:', error);
      throw error;
    }
  },

  // Sincronizar todos los documentos SII
  async sincronizarTodoSii(params = {}) {
    try {
      const response = await api.post('/sii/sincronizar-todo', params);
      return {
        message: response.data.message || 'Sincronización completa',
        resumen: response.data.resumen || {}
      };
    } catch (error) {
      console.error('Error al sincronizar todo SII:', error);
      throw error;
    }
  },

  // Obtener estado de sincronización
  async getEstadoSincronizacion() {
    try {
      const response = await api.get('/sii/estado-sincronizacion');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estado de sincronización:', error);
      throw error;
    }
  }
};

export default {
  siiIngresosService,
  siiEgresosService,
  siiService
};
