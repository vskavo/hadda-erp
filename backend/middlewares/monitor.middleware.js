const { logInfo, logError } = require('../utils/logger');

/**
 * Middleware para monitorear el rendimiento y métricas de la API
 */
const monitorMiddleware = (req, res, next) => {
  // Capturar tiempo de inicio
  const start = Date.now();
  
  // Información básica de la solicitud
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referrer: req.get('Referrer'),
    userId: req.user ? req.user.id : 'no autenticado'
  };
  
  // Registrar inicio de solicitud
  logInfo(`Solicitud recibida: ${req.method} ${req.originalUrl}`, requestInfo);
  
  // Cuando la respuesta finalice
  res.on('finish', () => {
    // Calcular tiempo de respuesta
    const duration = Date.now() - start;
    
    // Información de la respuesta
    const responseInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      contentLength: res.get('Content-Length'),
      duration: `${duration}ms`
    };
    
    // Registrar finalización de solicitud
    if (res.statusCode >= 400) {
      // Error en la respuesta
      logError(`Respuesta ERROR: ${req.method} ${req.originalUrl} - ${res.statusCode}`, {
        error: responseInfo
      });
    } else {
      // Respuesta exitosa
      logInfo(`Respuesta OK: ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, responseInfo);
    }
  });
  
  next();
};

/**
 * Middleware para seguimiento de errores
 */
const errorMonitorMiddleware = (err, req, res, next) => {
  // Registrar el error
  logError('Error en la solicitud', err);
  
  // Continuar con el siguiente middleware de error
  next(err);
};

module.exports = {
  monitorMiddleware,
  errorMonitorMiddleware
}; 