/**
 * Archivo de compatibilidad para importaciones que usan el formato corto.
 * Permite hacer require('../middlewares/auth') en lugar de require('../middlewares/auth.middleware')
 * Útil para mantener compatibilidad con código existente
 */
module.exports = require('./auth.middleware'); 