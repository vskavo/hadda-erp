const express = require('express');
const router = express.Router();
const proyectoController = require('../controllers/proyecto.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { tienePermiso, esAdministrador } = require('../middlewares/rol.middleware');

// Rutas públicas (no hay ninguna)

// Rutas protegidas - requieren autenticación
router.use(autenticar);

// Obtener estadísticas de proyectos - Asignar permiso si existe
router.get('/estadisticas', 
  tienePermiso('proyectos:read'),
  proyectoController.getEstadisticas
);

// Rutas de rentabilidad
router.get('/rentabilidad/dashboard', 
  tienePermiso('proyectos:rentabilidad:read'),
  proyectoController.dashboardRentabilidad
);

router.get('/rentabilidad/:id', 
  tienePermiso('proyectos:rentabilidad:read'),
  proyectoController.calcularRentabilidad
);

router.post('/rentabilidad/comparar', 
  tienePermiso('proyectos:rentabilidad:read'),
  proyectoController.compararRentabilidad
);

// Rutas de seguimiento de avance
router.post('/:id/avance', 
  tienePermiso('proyectos:update'),
  proyectoController.actualizarAvance
);

router.get('/:id/avance/historial', 
  tienePermiso('proyectos:seguimiento:read'),
  proyectoController.historialAvance
);

router.get('/:id/avance/informe', 
  tienePermiso('proyectos:seguimiento:read'),
  proyectoController.generarInformeAvance
);

// Rutas para gestión de hitos
router.get('/:id/hitos', 
  tienePermiso('proyectos:read'),
  proyectoController.listarHitos
);

router.post('/:id/hitos', 
  tienePermiso('proyectos:update'),
  proyectoController.crearHito
);

router.put('/:id/hitos/:hitoId', 
  tienePermiso('proyectos:update'),
  proyectoController.actualizarHito
);

router.delete('/:id/hitos/:hitoId', 
  tienePermiso('proyectos:update'),
  proyectoController.eliminarHito
);

// Rutas para reportes de proyectos
router.get('/reportes/general', 
  tienePermiso('reportes:generate'),
  proyectoController.reporteGeneral
);

router.get('/reportes/desempeno', 
  tienePermiso('reportes:generate'),
  proyectoController.reporteDesempeno
);

router.get('/reportes/rentabilidad-clientes', 
  tienePermiso('reportes:generate'),
  proyectoController.reporteRentabilidadClientes
);

router.get('/:id/reporte-detallado', 
  tienePermiso('reportes:generate'),
  proyectoController.reporteDetalladoProyecto
);

// Rutas CRUD básicas
router.get('/', 
  tienePermiso('proyectos:read'),
  proyectoController.findAll
);

router.get('/:id', 
  tienePermiso('proyectos:read'),
  proyectoController.findOne
);

// Ruta para obtener detalles completos de un proyecto
router.get('/:id/completo', 
  tienePermiso('proyectos:read'),
  proyectoController.getDetallesCompletos
);

// Ruta para obtener cursos de un proyecto
router.get('/:id/cursos',
  tienePermiso('proyectos:read'),
  proyectoController.getCursos
);

router.post('/', 
  tienePermiso('proyectos:create'),
  proyectoController.create
);

router.put('/:id', 
  tienePermiso('proyectos:update'),
  proyectoController.update
);

// --- INICIO: Añadir ruta para aprobar/desaprobar ---
router.put('/:id/aprobar',
  tienePermiso('proyectos:approve'),
  proyectoController.aprobarProyecto
);
// --- FIN: Añadir ruta para aprobar/desaprobar ---

// Convertir proyecto a venta
router.post('/:id/convertir-a-venta',
  tienePermiso('ventas:create'),
  proyectoController.convertirAVenta
);

router.delete('/:id', 
  tienePermiso('proyectos:delete'),
  proyectoController.delete
);

// Rutas para gestión de costos
router.post('/:id/costos', 
  tienePermiso('proyectos:rentabilidad:read'),
  proyectoController.addCosto
);

// Ruta para actualizar un costo
router.put('/:id/costos/:costoId', 
  tienePermiso('proyectos:rentabilidad:read'),
  proyectoController.updateCosto
);

router.delete('/:id/costos/:costoId', 
  tienePermiso('proyectos:rentabilidad:read'),
  proyectoController.deleteCosto
);

// Eliminar permanentemente (solo admin)
router.delete('/:id/permanente', 
  esAdministrador,
  proyectoController.hardDelete
);

// Endpoint para saber si un proyecto tiene venta
router.get('/:id/tiene-venta',
  tienePermiso('proyectos:read'),
  proyectoController.tieneVenta
);

module.exports = router; 