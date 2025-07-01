/**
 * Controlador de Proyectos
 * Este archivo es un wrapper que redirige a los módulos refactorizados
 */

// Importar todos los módulos refactorizados
const proyectoController = require('./proyecto/index');

// Exportar todos los controladores como un único objeto
module.exports = proyectoController;
