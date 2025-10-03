const rateLimit = require('express-rate-limit');

// Función auxiliar para extraer solo la IP (sin puerto)
const getClientIp = (req) => {
  // Extraer IP de diferentes fuentes
  let ip = req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  
  // Si la IP tiene formato IPv6, extraerla correctamente
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  // Remover el puerto si existe (formato IP:puerto)
  if (ip.includes(':')) {
    const parts = ip.split(':');
    // Si es IPv4 con puerto, tomar solo la parte antes del último ':'
    if (parts.length === 2) {
      ip = parts[0];
    }
    // Si es IPv6, dejarlo como está (tiene múltiples ':')
    // pero si tiene un puerto al final (ejemplo: [ipv6]:puerto), manejarlo
  }
  
  return ip;
};

// Configuración básica de rate limiting para todas las rutas
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Limitar cada IP a 100 solicitudes por ventana
  standardHeaders: true, // Devuelve los headers de rate limit estándar
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*` 
  keyGenerator: getClientIp, // Usar función personalizada para obtener la IP
  message: {
    status: 429,
    message: 'Demasiadas solicitudes, por favor intente de nuevo más tarde.'
  }
});

// Configuración más estricta para rutas sensibles (login, registro, etc.)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Limitar cada IP a 10 intentos de autenticación por hora
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp, // Usar función personalizada para obtener la IP
  message: {
    status: 429,
    message: 'Demasiados intentos de autenticación, por favor intente más tarde.'
  }
});

// Limiter específico para API con mayor restricción
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 1000, // 1000 solicitudes por hora
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp, // Usar función personalizada para obtener la IP
  message: {
    status: 429,
    message: 'Límite de API excedido, por favor intente más tarde.'
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  apiLimiter
}; 