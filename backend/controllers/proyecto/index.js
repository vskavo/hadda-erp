/**
 * Índice de controladores de Proyecto
 * Este archivo combina todos los controladores relacionados con proyectos
 * para mantener la estructura original pero con código más mantenible
 */

module.exports = {
  // Operaciones CRUD básicas
  ...require('./proyecto.base'),
  
  // Gestión de costos de proyecto
  ...require('./proyecto.costos'),
  
  // Gestión de cursos asociados a proyectos
  ...require('./proyecto.cursos'),
  
  // Gestión de avances de proyecto
  ...require('./proyecto.avance'),
  
  // Gestión de hitos de proyecto
  ...require('./proyecto.hitos'),
  
  // Informes y reportes
  ...require('./proyecto.reportes'),
  
  // Análisis de rentabilidad
  ...require('./proyecto.rentabilidad'),
  
  // Aprobación y conversión a venta
  ...require('./proyecto.aprobacion'),
  
  // Estadísticas
  ...require('./proyecto.estadisticas'),
  
  // Detalles completos
  ...require('./proyecto.detalles')
}; 