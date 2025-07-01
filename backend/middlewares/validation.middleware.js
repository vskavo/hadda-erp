const { validationResult } = require('express-validator');

/**
 * Middleware para validar las entradas de datos
 * Comprueba los resultados de validation chains de express-validator
 * Si hay errores, devuelve una respuesta de error 400 con detalles
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Error de validación', 
      errors: errors.array().map(error => ({
        field: error.path,
        value: error.value,
        message: error.msg,
        location: error.location
      }))
    });
  }
  next();
};

/**
 * Middleware que filtra los valores proporcionados en el cuerpo de la solicitud,
 * permitiendo solo los campos especificados.
 * @param {Array} allowedFields - Array con los nombres de los campos permitidos
 */
const filterFields = (allowedFields) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    const filteredBody = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });

    req.body = filteredBody;
    next();
  };
};

/**
 * Sanitiza valores de entrada eliminando caracteres potencialmente peligrosos
 * @param {Array} fields - Campos a sanitizar
 */
const sanitizeInputs = (fields) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }
    
    fields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        // Eliminar tags HTML y caracteres potencialmente peligrosos
        req.body[field] = req.body[field]
          .replace(/<[^>]*>/g, '')
          .replace(/[^\w\s.,;:!?áéíóúÁÉÍÓÚñÑüÜ@-]/g, '');
      }
    });
    
    next();
  };
};

module.exports = {
  validate,
  filterFields,
  sanitizeInputs
}; 