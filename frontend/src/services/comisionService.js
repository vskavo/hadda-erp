import api from './api';

// Cambiar URL base
const API_URL = '/comisiones'; 

// Cambiar nombre del servicio
const comisionService = {
  // Cambiar nombre de función y ajustar mensajes
  getComisiones: async () => {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error al obtener rangos de comisión:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al obtener rangos de comisión');
    }
  },

  // Cambiar nombre de función y ajustar mensajes
  createComision: async (comisionData) => {
    // comisionData ahora debe ser: { margen_desde, margen_hasta, rol_id, comision }
    try {
      const response = await api.post(API_URL, comisionData);
      return response.data;
    } catch (error) {
      console.error('Error al crear rango de comisión:', error.response?.data || error.message);
      throw error.response?.data || new Error('Error al crear rango de comisión');
    }
  },

  // Cambiar nombre de función y ajustar mensajes
  updateComision: async (id, comisionData) => {
    // comisionData ahora debe ser: { margen_desde, margen_hasta, rol_id, comision }
    try {
      const response = await api.put(`${API_URL}/${id}`, comisionData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar rango de comisión ${id}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Error al actualizar rango de comisión');
    }
  },

  // Cambiar nombre de función y ajustar mensajes
  deleteComision: async (id) => {
    try {
      const response = await api.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar rango de comisión ${id}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Error al eliminar rango de comisión');
    }
  },

  // Nueva función para obtener la comisión según el margen y rol
  getComisionByMargenAndRol: async (margen, rolId) => {
    console.log(`Llamando a API para obtener comisión. Margen: ${margen}, Rol ID: ${rolId}`);
    try {
      // Asegurarse de que los valores sean números
      const margenNum = parseFloat(margen);
      const rolIdNum = parseInt(rolId);
      
      // Verificar que sean valores válidos
      if (isNaN(margenNum) || isNaN(rolIdNum)) {
        console.error(`Valores inválidos: margen=${margen}, rol_id=${rolId}`);
        return { comisionPorcentaje: 0 };
      }
      
      const response = await api.get(`${API_URL}/calculo`, { 
        params: { 
          margen: margenNum, 
          rol_id: rolIdNum 
        } 
      });
      
      console.log('Respuesta de API para comisión:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al calcular comisión:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      // Devolver un objeto por defecto para evitar errores en el código que llama a esta función
      return { comisionPorcentaje: 0, error: true };
    }
  },

  // Nueva función para verificar comisiones existentes para un rol
  verificarComisionesPorRol: async (rolId) => {
    console.log(`Verificando comisiones para rol ID: ${rolId}`);
    try {
      const rolIdNum = parseInt(rolId);
      
      if (isNaN(rolIdNum)) {
        console.error(`ID de rol inválido: ${rolId}`);
        return { comisiones: [] };
      }
      
      const response = await api.get(`${API_URL}/verificar`, {
        params: { rol_id: rolIdNum }
      });
      
      console.log('Respuesta de verificación de comisiones:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al verificar comisiones:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      return { comisiones: [], error: true };
    }
  }
};

// Cambiar exportación
export default comisionService; 