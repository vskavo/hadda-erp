const express = require('express');
const router = express.Router();
const conciliacionBancariaController = require('../controllers/conciliacion-bancaria.controller');
const { autenticar, autorizar } = require('../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(autenticar);

// Ruta para obtener estadísticas - restringida a roles específicos
router.get(
  '/estadisticas',
  autorizar(['administrador', 'gerencia', 'contabilidad']),
  conciliacionBancariaController.getEstadisticas
);

// Rutas básicas CRUD con autorización
router.get(
  '/',
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']),
  conciliacionBancariaController.findAll
);

router.get(
  '/:id',
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']),
  conciliacionBancariaController.findOne
);

// Iniciar una nueva conciliación
router.post(
  '/',
  autorizar(['administrador', 'gerencia', 'contabilidad']),
  conciliacionBancariaController.iniciar
);

// Actualizar conciliación
router.put(
  '/:id',
  autorizar(['administrador', 'gerencia', 'contabilidad']),
  conciliacionBancariaController.update
);

// Añadir movimiento a la conciliación
router.post(
  '/:id/movimientos',
  autorizar(['administrador', 'gerencia', 'contabilidad']),
  conciliacionBancariaController.addMovimiento
);

// Conciliar un movimiento específico
router.put(
  '/:id/movimientos/:movimientoId/conciliar',
  autorizar(['administrador', 'gerencia', 'contabilidad']),
  conciliacionBancariaController.conciliarMovimiento
);

// Finalizar conciliación
router.put(
  '/:id/finalizar',
  autorizar(['administrador', 'gerencia', 'contabilidad']),
  conciliacionBancariaController.finalizar
);

// Anular conciliación
router.put(
  '/:id/anular',
  autorizar(['administrador', 'gerencia']),
  conciliacionBancariaController.anular
);

module.exports = router; 