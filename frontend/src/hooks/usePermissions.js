import { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // O tu instancia configurada de axios
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPermissions = useCallback(async () => {
    // No intentar cargar si no hay usuario, token o la autenticación aún está cargando
    // O si ya estamos cargando permisos para evitar llamadas duplicadas
    if (!user || !token || authLoading || loading) {
      // Limpiar permisos si no hay usuario o si estamos recargando
      if(!user && !authLoading) setPermissions([]); 
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Asegúrate de que la URL es correcta según cómo montaste tus rutas
      // La ruta base es /api/usuarios y la ruta específica es /perfil/permisos
      const response = await axios.get('/api/usuarios/perfil/permisos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Asegurarse de que siempre sea un array
      setPermissions(Array.isArray(response.data.permisos) ? response.data.permisos : []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err.response?.data?.message || 'Error al cargar permisos');
      setPermissions([]); // Limpiar permisos en caso de error
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, authLoading]); // Quitar 'loading' de dependencias para evitar loop si falla rápido

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]); 

  const hasPermission = useCallback((requiredPermission) => {
    // Si no se requiere permiso específico, permitir (para items públicos o solo logueados)
    if (!requiredPermission) return true; 
    
    // Si auth o permisos aún están cargando, no podemos saber, retornar false
    if (authLoading || loading) return false; 
    
    // Si hubo un error cargando permisos, denegar
    if (error) return false; 
    
    // El administrador siempre tiene todos los permisos (ajustar nombre si es necesario)
    if (user?.rol === 'administrador') return true; 
    
    // Verificar si el permiso está en la lista del usuario
    return permissions.includes(requiredPermission);

  }, [permissions, user, authLoading, loading, error]); 

  return { 
    permissions, 
    // El estado de carga general es true si la autenticación o los permisos están cargando
    loading: authLoading || loading, 
    error, 
    hasPermission 
  };
};