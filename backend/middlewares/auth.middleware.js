const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { logError } = require('../utils/logger');

/**
 * Middleware para verificar la autenticación del usuario
 * Versión optimizada que no consulta la base de datos para mejorar rendimiento
 */
exports.autenticar = async (req, res, next) => {
  try {
    // Obtener el token del header de autorización o cookies
    const authHeader = req.headers.authorization;
    let token;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Si no viene en el header, intentar leerlo de las cookies
      token = req.cookies?.token;
    }
    
    // Si no hay token, el usuario no está autenticado
    if (!token) {
      return res.status(401).json({ message: 'No autenticado. Se requiere token.' });
    }
    
    // Verificar token (sin consultar DB para optimizar rendimiento)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Sesión expirada. Inicie sesión nuevamente.' });
      }
      return res.status(401).json({ message: 'Token inválido.' });
    }
    
    // Si el token es válido, guardar los datos del usuario en el request
    // Sin consultar la base de datos para mayor rendimiento
    const rolDelToken = decoded.rol; // Obtener el rol directamente del token (debería ser el nombre)
    
    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      rol: rolDelToken // Usar el rol tal como viene del token
    };
    
    // Para compatibilidad con código existente que usa req.userId y req.userRole
    req.userId = decoded.id;
    req.userRole = rolDelToken; // Usar el rol tal como viene del token
    
    // Pasar al siguiente middleware
    next();
  } catch (error) {
    logError('Error en middleware de autenticación:', error);
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({ message: 'Error de autenticación.' });
  }
};

/**
 * Middleware para verificar autorización según roles
 */
exports.autorizar = (rolesPermitidos) => {
  return (req, res, next) => {
    try {
      // Si no hay usuario autenticado
      if (!req.usuario && !req.userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }
      
      // Obtener rol del usuario directamente (ya debería ser el nombre)
      const rolUsuario = req.usuario?.rol || req.userRole; 
      
      // Si no se pudo obtener el rol, denegar acceso
      if (!rolUsuario) {
        return res.status(403).json({ message: 'Rol de usuario no identificado.'});
      }
      
      // Asegurarse de que rolesPermitidos sea un array
      const rolesPermitidosArray = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
      
      // Permitir siempre al administrador (o el nombre exacto del rol admin si es diferente)
      const esAdmin = rolUsuario === 'administrador'; // Ajustar si el nombre del rol admin es diferente
      
      // Verificar si el rol del usuario está en la lista o si es admin
      if (esAdmin || rolesPermitidosArray.includes(rolUsuario)) {
        return next();
      }
      
      // Si no tiene permiso
      return res.status(403).json({ 
        message: 'No autorizado. Acceso denegado.',
        rolActual: rolUsuario,
        rolesPermitidos: rolesPermitidosArray
      });
    } catch (error) {
      logError('Error en middleware de autorización:', error);
      console.error('Error en middleware de autorización:', error);
      res.status(500).json({ message: 'Error de autorización' });
    }
  };
}; 