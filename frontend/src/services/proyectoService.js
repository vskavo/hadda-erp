import api from './api';

// Servicio para gestión de proyectos
const proyectoService = {
  // Obtener listado de proyectos con paginación y filtros
  getProyectos: async (params = {}) => {
    try {
      const response = await api.get('/proyectos', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      throw error;
    }
  },

  // Obtener un proyecto por ID
  getProyectoById: async (id) => {
    try {
      const response = await api.get(`/proyectos/${id}`);
      console.log('Respuesta del API para proyecto:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener proyecto:', error);
      throw error;
    }
  },

  // Crear un proyecto
  createProyecto: async (proyectoData) => {
    try {
      const response = await api.post('/proyectos', proyectoData);
      return response.data;
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      throw error;
    }
  },

  // Actualizar un proyecto
  updateProyecto: async (id, proyectoData) => {
    try {
      const response = await api.put(`/proyectos/${id}`, proyectoData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      throw error;
    }
  },

  // Eliminar un proyecto
  deleteProyecto: async (id) => {
    try {
      const response = await api.delete(`/proyectos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      throw error;
    }
  },

  // Cambiar estado de un proyecto
  cambiarEstadoProyecto: async (id, nuevoEstado) => {
    try {
      const response = await api.put(`/proyectos/${id}/estado`, { estado: nuevoEstado });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado del proyecto:', error);
      throw error;
    }
  },

  // Obtener análisis de rentabilidad de un proyecto
  getRentabilidad: async (id) => {
    try {
      const response = await api.get(`/proyectos/${id}/rentabilidad`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener rentabilidad del proyecto:', error);
      throw error;
    }
  },

  // Obtener seguimiento de avance de un proyecto
  getSeguimiento: async (id) => {
    try {
      const response = await api.get(`/proyectos/${id}/seguimiento`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener seguimiento del proyecto:', error);
      throw error;
    }
  },

  // Actualizar avance de un proyecto
  updateAvance: async (id, avanceData) => {
    try {
      const response = await api.put(`/proyectos/${id}/avance`, avanceData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar avance del proyecto:', error);
      throw error;
    }
  },

  // Añadir un hito al proyecto
  addHito: async (id, hitoData) => {
    try {
      const response = await api.post(`/proyectos/${id}/hitos`, hitoData);
      return response.data;
    } catch (error) {
      console.error('Error al añadir hito al proyecto:', error);
      throw error;
    }
  },

  // Obtener estadísticas de proyectos
  getEstadisticas: async () => {
    try {
      const response = await api.get('/proyectos/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de proyectos:', error);
      throw error;
    }
  },

  // Añadir un costo al proyecto
  addCostoProyecto: async (id, costoData) => {
    try {
      const response = await api.post(`/proyectos/${id}/costos`, costoData);
      return response.data;
    } catch (error) {
      console.error('Error al añadir costo al proyecto:', error);
      throw error;
    }
  },

  // Actualizar un costo del proyecto
  updateCostoProyecto: async (proyectoId, costoId, costoData) => {
    try {
      const response = await api.put(`/proyectos/${proyectoId}/costos/${costoId}`, costoData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar costo del proyecto:', error);
      throw error;
    }
  },

  // Eliminar un costo del proyecto
  deleteCostoProyecto: async (proyectoId, costoId) => {
    try {
      const response = await api.delete(`/proyectos/${proyectoId}/costos/${costoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar costo del proyecto:', error);
      throw error;
    }
  },

  // Convertir proyecto a venta
  convertirAVenta: async (id) => {
    try {
      const response = await api.post(`/proyectos/${id}/convertir-a-venta`);
      return response.data;
    } catch (error) {
      console.error('Error al convertir proyecto a venta:', error);
      throw error;
    }
  },

  // Obtener cursos de un proyecto
  getCursosProyecto: async (id) => {
    try {
      const response = await api.get(`/proyectos/${id}/cursos`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener cursos del proyecto:', error);
      throw error;
    }
  },

  // --- INICIO: Añadir función para aprobar/desaprobar proyecto ---
  aprobarProyecto: async (id, data) => {
    // data debe ser un objeto como { aprobado: true } o { aprobado: false }
    try {
      const response = await api.put(`/proyectos/${id}/aprobar`, data);
      return response.data;
    } catch (error) {
      console.error('Error al aprobar/desaprobar proyecto:', error);
      throw error;
    }
  },

  // Saber si un proyecto tiene venta asociada
  getTieneVenta: async (id) => {
    try {
      const response = await api.get(`/proyectos/${id}/tiene-venta`);
      return response.data;
    } catch (error) {
      console.error('Error al consultar si el proyecto tiene venta:', error);
      throw error;
    }
  }
  // --- FIN: Añadir función para aprobar/desaprobar proyecto ---
};

export default proyectoService; 