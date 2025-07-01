const express = require('express');
const router = express.Router();
const ingresoController = require('../controllers/ingreso.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

// Rutas públicas (no hay ninguna)

// Rutas protegidas - requieren autenticación
router.use(autenticar);

// Obtener estadísticas de ingresos - solo roles específicos
router.get('/estadisticas', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  ingresoController.getEstadisticas
);

// Rutas CRUD básicas
router.get('/', 
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']), 
  ingresoController.findAll
);

router.get('/:id', 
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']), 
  ingresoController.findOne
);

router.post('/', 
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']), 
  ingresoController.create
);

router.put('/:id', 
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']), 
  ingresoController.update
);

// Rutas especializadas de gestión de ingresos
router.put('/:id/confirmar', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  ingresoController.confirmar
);

router.put('/:id/anular', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  ingresoController.anular
);

router.put('/:id/conciliar', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  ingresoController.conciliar
);

module.exports = router; 