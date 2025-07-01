import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Añadir depuración
  console.log('ProtectedRoute - Estado de autenticación:', {
    isAuthenticated,
    loading,
    userInfo: user ? {
      id: user.id,
      email: user.email,
      rol: user.rol,
      rolType: typeof user.rol
    } : 'No hay usuario'
  });

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - Redirigiendo a login por falta de autenticación');
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute; 