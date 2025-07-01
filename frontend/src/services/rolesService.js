import axios from 'axios';

const API_URL = '/api/roles'; // Asumiendo que las rutas están bajo /api

// Configuración de Axios
const axiosInstance = axios.create({
    baseURL: '/', 
});

// --- Añadir Interceptor para incluir el Token --- 
axiosInstance.interceptors.request.use(
    (config) => {
        // Intentar obtener el token de localStorage (ajusta la clave si es diferente)
        const token = localStorage.getItem('token'); 
        if (token) {
            // Añadir el header de autorización
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Manejar errores de la configuración de la petición
        return Promise.reject(error);
    }
);
// --- Fin Interceptor ---

// Obtener todos los roles con sus permisos
export const getRoles = async () => {
    try {
        const response = await axiosInstance.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching roles:", error.response?.data || error.message);
        // Lanzar el objeto de error de la respuesta si existe, sino uno nuevo
        throw error.response?.data || new Error('Error al obtener roles'); 
    }
};

// Obtener todos los permisos disponibles
export const getPermisos = async () => {
    try {
        // La ruta '/permisos' está anidada bajo '/api/roles' según rol.routes.js
        const response = await axiosInstance.get(`${API_URL}/permisos`);
        return response.data;
    } catch (error) {
        console.error("Error fetching permissions:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error al obtener permisos');
    }
};

// Obtener un rol por ID
export const getRolById = async (id) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching role ${id}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Error al obtener el rol');
    }
};

// Crear un nuevo rol
export const createRol = async (rolData) => {
    // rolData debe incluir { nombre, descripcion, permisos: [id1, id2...] }
    try {
        const response = await axiosInstance.post(API_URL, rolData);
        return response.data;
    } catch (error) {
        console.error("Error creating role:", error.response?.data || error.message);
        throw error.response?.data || new Error('Error al crear el rol');
    }
};

// Actualizar un rol
export const updateRol = async (id, rolData) => {
    // rolData debe incluir { nombre, descripcion, permisos: [id1, id2...] }
    try {
        const response = await axiosInstance.put(`${API_URL}/${id}`, rolData);
        return response.data;
    } catch (error) {
        console.error(`Error updating role ${id}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Error al actualizar el rol');
    }
};

// Eliminar un rol
export const deleteRol = async (id) => {
    try {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting role ${id}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Error al eliminar el rol');
    }
};

const rolesService = {
    getRoles,
    getPermisos,
    getRolById,
    createRol,
    updateRol,
    deleteRol,
};

export default rolesService; 