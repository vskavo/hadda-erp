const CryptoJS = require('crypto-js');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'clave-secreta-por-defecto-cambiar-en-produccion';

/**
 * Encripta datos sensibles usando AES
 * @param {string} text - Texto a encriptar
 * @returns {string} - Texto encriptado
 */
const encrypt = (text) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

/**
 * Desencripta datos previamente encriptados
 * @param {string} encryptedText - Texto encriptado
 * @returns {string} - Texto original desencriptado
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Middleware para encriptar campos sensibles en request
 * @param {Array} fields - Campos a encriptar
 */
const encryptFields = (fields) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }
    
    fields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = encrypt(req.body[field].toString());
      }
    });
    
    next();
  };
};

/**
 * Middleware para desencriptar campos sensibles en response
 * @param {Array} fields - Campos a desencriptar
 */
const decryptFields = (fields) => {
  return (req, res, next) => {
    // Guardamos el método original res.json
    const originalJson = res.json;
    
    // Sobreescribimos el método res.json
    res.json = function(obj) {
      if (obj && typeof obj === 'object') {
        // Si es un array
        if (Array.isArray(obj)) {
          obj = obj.map(item => {
            if (item && typeof item === 'object') {
              fields.forEach(field => {
                if (item[field]) {
                  item[field] = decrypt(item[field]);
                }
              });
            }
            return item;
          });
        } 
        // Si es un objeto individual
        else {
          fields.forEach(field => {
            if (obj[field]) {
              obj[field] = decrypt(obj[field]);
            }
          });
        }
      }
      
      // Llamamos al método original con los datos desencriptados
      return originalJson.call(this, obj);
    };
    
    next();
  };
};

/**
 * Hash de contraseñas para almacenamiento seguro
 * @param {string} password - Contraseña en texto plano
 * @returns {string} - Hash de la contraseña
 */
const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};

module.exports = {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  hashPassword
}; 