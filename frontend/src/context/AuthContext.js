import React, { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  register: () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Verificar si el token ha expirado
          const decodedToken = jwtDecode(token);
          console.log('DEPURACIÓN - Token decodificado en initAuth:', decodedToken);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token expirado
            console.log('Token expirado, redirigiendo a login');
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          } else {
            // Token válido, configurar axios con el token
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            try {
              // Obtener información del usuario
              console.log('Intentando obtener información del usuario desde /api/users/me');
              const response = await axios.get('/api/users/me');
              console.log('DEPURACIÓN - Respuesta de /api/users/me:', response.data);
              
              if (response.data && response.data.usuario) {
                const userData = response.data.usuario;
                console.log('DEPURACIÓN - Datos de usuario obtenidos:', userData);
                
                // Normalizar el rol si es necesario
                if (userData.rol !== undefined) {
                  console.log('DEPURACIÓN - Tipo de rol recibido:', typeof userData.rol);
                  console.log('DEPURACIÓN - Valor de rol recibido:', userData.rol);
                }
                
                setUser(userData);
              } else {
                throw new Error('Formato de respuesta inesperado');
              }
            } catch (userError) {
              console.error('Error al obtener información del usuario:', userError);
              // Si falla, intentamos usar la información del token
              console.log('DEPURACIÓN - Usando información del token como respaldo');
              
              // Normalizar el rol del token si es necesario
              let rolValue = decodedToken.rol;
              if (typeof rolValue === 'number') {
                console.log('DEPURACIÓN - Convirtiendo rol numérico del token:', rolValue);
                const rolesMap = {
                  1: 'administrador',
                  2: 'gerencia',
                  3: 'ventas',
                  4: 'contabilidad',
                  5: 'operaciones'
                };
                rolValue = rolesMap[rolValue] || 'usuario';
              }
              
              setUser({
                id: decodedToken.id,
                email: decodedToken.email,
                rol: rolValue,
                nombre: decodedToken.nombre || 'Usuario'
              });
            }
          }
        } catch (error) {
          console.error('Error al inicializar la autenticación:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials) => {
    try {
      console.log('Intentando iniciar sesión con:', credentials.email);
      
      // Establece un timeout para la solicitud
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      const response = await axios.post('/api/auth/login', credentials, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Limpia el timeout
      
      console.log('DEPURACIÓN - Respuesta completa del servidor:', JSON.stringify(response.data));
      
      // Verificar la estructura de la respuesta
      let userData, newToken;
      
      if (response.data.usuario) {
        userData = response.data.usuario;
        newToken = response.data.token;
        console.log('DEPURACIÓN - Usuario encontrado en response.data.usuario:', JSON.stringify(userData));
      } else if (response.data.user) {
        userData = response.data.user;
        newToken = response.data.token;
        console.log('DEPURACIÓN - Usuario encontrado en response.data.user:', JSON.stringify(userData));
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        return { 
          success: false, 
          error: 'Formato de respuesta inesperado del servidor' 
        };
      }
      
      // Depuración adicional para ver el rol
      console.log('DEPURACIÓN - Tipo de rol:', typeof userData.rol);
      console.log('DEPURACIÓN - Valor de rol:', userData.rol);
      
      // Estandarizar el objeto de usuario para que siempre use la propiedad 'rol'
      let finalUserData = { ...userData };
      if (finalUserData.role !== undefined && finalUserData.rol === undefined) {
        console.log(`DEPURACIÓN - Mapeando propiedad 'role' a 'rol' en objeto de usuario desde login`);
        finalUserData.rol = finalUserData.role;
        delete finalUserData.role; 
      } else if (finalUserData.rol === undefined) {
        console.warn(`DEPURACIÓN - No se encontró rol/role en login, asignando 'usuario'`);
        finalUserData.rol = 'usuario'; 
      }

      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setToken(newToken);
      setUser(finalUserData); // Usar el objeto estandarizado
      
      // Depuración del JWT decodificado
      try {
        const decoded = jwtDecode(newToken);
        console.log('DEPURACIÓN - Token decodificado:', JSON.stringify(decoded));
      } catch (error) {
        console.error('Error al decodificar token:', error);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      
      // Manejo específico de errores de timeout
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'La solicitud ha tardado demasiado tiempo. Por favor, inténtelo de nuevo.'
        };
      }
      
      console.error('Detalles del error:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No hay respuesta',
        request: error.request ? 'Petición enviada pero sin respuesta' : 'No se realizó petición'
      });
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Error al iniciar sesión' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      console.error('Error de registro:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al registrar' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser((prevUser) => ({ ...prevUser, ...userData }));
  };

  const contextValue = useMemo(
    () => ({
      isAuthenticated: !!token,
      user,
      token,
      loading,
      login,
      logout,
      register,
      updateUser,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};