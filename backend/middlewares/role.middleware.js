/**
 * Middleware para verificar roles de usuario
 * @param {Array} roles - Array de roles permitidos
 * @returns {Function} Middleware
 */
module.exports = (roles = []) => {
  // Convertir a array si es un solo rol
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.usuario || !req.usuario.rol) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    // Verificar si el rol del usuario está en la lista de roles permitidos
    if (roles.length && !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        message: 'Acceso denegado. No tiene permisos suficientes para esta acción.' 
      });
    }

    // Si el usuario tiene el rol adecuado, continuar
    next();
  };
}; 