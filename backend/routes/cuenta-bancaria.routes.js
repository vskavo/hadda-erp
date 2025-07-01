const express = require('express');
const router = express.Router();
const cuentaBancariaController = require('../controllers/cuenta-bancaria.controller');
const { autenticar, autorizar } = require('../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(autenticar);

// Rutas básicas CRUD con autorización
router.get(
  '/',
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']),
  cuentaBancariaController.findAll
);

router.get(
  '/:id',
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']),
  cuentaBancariaController.findOne
);

router.post(
  '/',
  autorizar(['administrador', 'gerencia']),
  cuentaBancariaController.create
);

router.put(
  '/:id',
  autorizar(['administrador', 'gerencia']),
  cuentaBancariaController.update
);

// Rutas para gestionar movimientos y saldos
router.get(
  '/:id/movimientos',
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']),
  cuentaBancariaController.getMovimientos
);

router.get(
  '/:id/resumen',
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']),
  cuentaBancariaController.getResumen
);

router.put(
  '/:id/saldo',
  autorizar(['administrador', 'gerencia', 'contabilidad']),
  cuentaBancariaController.actualizarSaldo
);

// Ruta para desactivar cuenta
router.put(
  '/:id/desactivar',
  autorizar(['administrador', 'gerencia']),
  cuentaBancariaController.desactivar
);

module.exports = router; 