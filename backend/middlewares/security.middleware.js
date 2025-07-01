const helmet = require('helmet');

// Configuración de seguridad usando Helmet
const securityMiddleware = helmet({
  // Configuraciones específicas de Helmet
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https://secure.gravatar.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
    },
  },
  // Implementar HTTP Strict Transport Security
  hsts: {
    maxAge: 15552000, // 180 días
    includeSubDomains: true,
    preload: true,
  },
  // Prevenir que el navegador infiera el MIME Type
  noSniff: true,
  // Establece X-XSS-Protection para habilitar el filtro XSS en navegadores antiguos
  xssFilter: true,
  // Prevenir que el sitio sea embebido (evita clickjacking)
  frameguard: {
    action: 'deny',
  },
  // Deshabilitar cache para contenido sensible
  noCache: true,
});

module.exports = securityMiddleware; 