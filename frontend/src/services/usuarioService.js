import api from './api';

// Servicio para gestión de usuarios
const usuarioService = {
  // Obtener listado de usuarios con paginación y filtros
  getUsuarios: async (params = {}) => {
    try {
      const response = await api.get('/usuarios', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },

  // Obtener un usuario por ID
  getUsuarioById: async (id) => {
    try {
      const response = await api.get(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error;
    }
  },

  // Crear un usuario
  createUsuario: async (usuarioData) => {
    try {
      const response = await api.post('/usuarios', usuarioData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  // Actualizar un usuario
  updateUsuario: async (id, usuarioData) => {
    try {
      const response = await api.put(`/usuarios/${id}`, usuarioData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  },

  // Eliminar un usuario
  deleteUsuario: async (id) => {
    try {
      const response = await api.delete(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  },

  // Obtener el perfil del usuario actual
  getPerfil: async () => {
    try {
      const response = await api.get('/usuarios/perfil');
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil de usuario:', error);
      throw error;
    }
  },

  // Actualizar el perfil del usuario actual
  updatePerfil: async (perfilData) => {
    try {
      const response = await api.put('/usuarios/perfil', perfilData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar perfil de usuario:', error);
      throw error;
    }
  },

  // Cambiar la contraseña del usuario actual
  cambiarPassword: async (passwordData) => {
    try {
      const response = await api.put('/usuarios/cambiar-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  }
};

export default usuarioService; 