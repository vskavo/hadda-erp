const rateLimit = require('express-rate-limit');

// Configuración básica de rate limiting para todas las rutas
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Limitar cada IP a 100 solicitudes por ventana
  standardHeaders: true, // Devuelve los headers de rate limit estándar
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*` 
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