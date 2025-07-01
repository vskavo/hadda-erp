/**
 * Utilidades para manipulación y validación de RUT chileno
 */

/**
 * Formatea un RUT en el formato estándar chileno (XX.XXX.XXX-X)
 * @param {string} rut - RUT sin formato o con cualquier formato
 * @returns {string|null} - RUT formateado o null si el input es inválido
 */
const formatRut = (rut) => {
  if (!rut) return null;
  
  // Eliminar puntos y guiones
  let valor = rut.replace(/\./g, '').replace(/-/g, '').trim();
  
  // Validar que solo contiene números y posiblemente una 'k' al final
  if (!/^[0-9]+[0-9kK]?$/.test(valor)) return null;

  // Obtener dígito verificador
  let dv = valor.slice(-1).toUpperCase();
  // Obtener cuerpo del RUT
  let rutNumero = valor.slice(0, -1);
  
  // Formatear con puntos y guion
  return rutNumero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
};

/**
 * Elimina el formato del RUT dejándolo como número seguido del dígito verificador
 * @param {string} rut - RUT con o sin formato
 * @returns {string|null} - RUT sin formato o null si el input es inválido 
 */
const cleanRut = (rut) => {
  if (!rut) return null;
  
  // Eliminar puntos y guiones y convertir a mayúscula al final por si hay una 'k'
  let valor = rut.replace(/\./g, '').replace(/-/g, '').trim();
  let dv = valor.slice(-1).toUpperCase();
  let rutNumero = valor.slice(0, -1);
  
  return rutNumero + dv;
};

/**
 * Calcula el dígito verificador de un RUT
 * @param {string|number} rut - Cuerpo del RUT sin dígito verificador
 * @returns {string} - Dígito verificador calculado (0-9 o K)
 */
const calcularDv = (rut) => {
  const rutRevertido = rut.toString().split('').reverse();
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = 0; i < rutRevertido.length; i++) {
    suma += parseInt(rutRevertido[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = 11 - resto;
  
  if (dvCalculado === 11) return '0';
  if (dvCalculado === 10) return 'K';
  return dvCalculado.toString();
};

/**
 * Valida si un RUT chileno es válido
 * @param {string} rut - RUT con o sin formato
 * @returns {boolean} - true si el RUT es válido, false en caso contrario
 */
const validarRut = (rut) => {
  if (!rut) return false;
  
  // Limpiar el RUT de puntos y guiones
  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').trim();
  
  // Validar longitud mínima y que solo contenga números y posiblemente una 'k'
  if (rutLimpio.length < 2 || !/^[0-9]+[0-9kK]?$/.test(rutLimpio)) return false;
  
  // Separar cuerpo y dígito verificador
  const dv = rutLimpio.slice(-1).toUpperCase();
  const rutNumero = rutLimpio.slice(0, -1);
  
  // Calcular dígito verificador esperado
  const dvEsperado = calcularDv(rutNumero);
  
  // Comparar dígito verificador calculado con el proporcionado
  return dv === dvEsperado;
};

/**
 * Middleware para validar RUT en parámetros de solicitud
 * @param {string} paramName - Nombre del parámetro que contiene el RUT
 * @param {boolean} isRequired - Si es true, el RUT es obligatorio
 * @returns {Function} - Middleware Express
 */
const validateRutMiddleware = (paramName, isRequired = true) => {
  return (req, res, next) => {
    const rut = req.body[paramName] || req.params[paramName] || req.query[paramName];
    
    // Si no es requerido y no está presente, continuar
    if (!isRequired && !rut) {
      return next();
    }
    
    // Si es requerido pero no está presente
    if (isRequired && !rut) {
      return res.status(400).json({
        success: false,
        message: `El parámetro ${paramName} (RUT) es requerido`
      });
    }
    
    // Validar el RUT
    if (!validarRut(rut)) {
      return res.status(400).json({
        success: false,
        message: `El RUT proporcionado ${rut} no es válido`
      });
    }
    
    // Si pasa la validación, continuar
    next();
  };
};

module.exports = {
  formatRut,
  cleanRut,
  calcularDv,
  validarRut,
  validateRutMiddleware
}; 