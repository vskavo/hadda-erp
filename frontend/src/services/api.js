import axios from 'axios';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: '/api', // Usamos la ruta relativa para que funcione con el proxy
  timeout: 60000, // 60 segundos de timeout para todas las solicitudes (aumentado para operaciones pesadas)
  headers: {
    'Content-Type': 'application/json',
  },
  // No transformar las respuestas automáticamente (para evitar problemas)
  transformResponse: [(data) => {
    try {
      return data ? JSON.parse(data) : data;
    } catch (e) {
      console.error('Error al parsear respuesta:', e);
      return data;
    }
  }]
});

// Interceptor de solicitudes para añadir el token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Error en interceptor de solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejar errores comunes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Errores de timeout
    if (error.code === 'ECONNABORTED') {
      console.error('La solicitud ha excedido el tiempo de espera (60 segundos)');
      // Mostrar alerta si es necesario
      alert('La solicitud está tomando más tiempo del esperado. Por favor, espere a que termine el proceso.');
    }
    
    // Errores de red
    if (error.message === 'Network Error') {
      console.error('Error de red - Servidor no disponible');
      // Mostrar alerta si es necesario
      alert('No se puede conectar con el servidor. Verifique su conexión a Internet.');
    }
    
    // Manejar errores de autenticación
    if (error.response && error.response.status === 401) {
      // Redirigir a la página de login o renovar token
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Manejar errores de servidor (500, etc.)
    if (error.response && error.response.status >= 500) {
      console.error('Error del servidor:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api; 