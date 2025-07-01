const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { tienePermiso, esAdministrador } = require('../middlewares/rol.middleware');

// Rutas públicas (no hay ninguna)

// Rutas protegidas - requieren autenticación
router.use(autenticar);

// Obtener dashboard de clientes
router.get('/dashboard', 
  tienePermiso('clientes:read'),
  clienteController.getDashboard
);

// Generar informes de clientes
router.get('/informes', 
  tienePermiso('clientes:read'),
  clienteController.generarInforme
);

// NUEVA RUTA PARA HOLDINGS SUMMARY (MOVIDA ARRIBA)
router.get('/holdings-summary', 
  tienePermiso('clientes:read'),
  clienteController.getHoldingsSummary
);

// NUEVA RUTA PARA DETALLE DE VENTAS POR HOLDING
router.get('/holdings/:nombreHolding/detalles-ventas-proyectos', 
  tienePermiso('clientes:read'),
  clienteController.getHoldingSalesDetails
);

// Rutas CRUD básicas - Usar permisos específicos
router.get('/', 
  tienePermiso('clientes:read'),
  clienteController.findAll
);

// ESTA RUTA DEBE IR DESPUÉS DE LAS MÁS ESPECÍFICAS COMO /holdings-summary
router.get('/:id', 
  tienePermiso('clientes:read'),
  clienteController.findOne
);

router.post('/', 
  tienePermiso('clientes:create'),
  clienteController.create
);

router.put('/:id', 
  tienePermiso('clientes:update'),
  clienteController.update
);

router.delete('/:id', 
  tienePermiso('clientes:delete'),
  clienteController.delete
);

// Eliminar permanentemente (solo admin)
router.delete('/:id/permanente', 
  esAdministrador,
  clienteController.hardDelete
);

// Cambio de estado (activar/desactivar) - Requiere permiso de edición
router.patch('/:id/status', 
  tienePermiso('clientes:update'),
  clienteController.updateStatus
);

// Nuevas rutas para contactos, actividades y ventas
router.get('/:id/contactos', 
  tienePermiso('clientes:contactos:manage'),
  clienteController.getContactos
);

router.get('/:id/actividades', 
  tienePermiso('clientes:actividades:manage'),
  clienteController.getActividades
);

router.get('/:id/ventas', 
  tienePermiso('ventas:read'),
  clienteController.getVentas
);

module.exports = router; 