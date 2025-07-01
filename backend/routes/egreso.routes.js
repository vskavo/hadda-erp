const express = require('express');
const router = express.Router();
const egresoController = require('../controllers/egreso.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

// Rutas públicas (no hay ninguna)

// Rutas protegidas - requieren autenticación
router.use(autenticar);

// Obtener estadísticas de egresos - solo roles específicos
router.get('/estadisticas', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  egresoController.getEstadisticas
);

// Rutas CRUD básicas
router.get('/', 
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']), 
  egresoController.findAll
);

router.get('/:id', 
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']), 
  egresoController.findOne
);

router.post('/', 
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']), 
  egresoController.create
);

router.put('/:id', 
  autorizar(['administrador', 'gerencia', 'contabilidad', 'finanzas']), 
  egresoController.update
);

// Rutas especializadas de gestión de egresos
router.put('/:id/pagar', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  egresoController.pagar
);

router.put('/:id/anular', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  egresoController.anular
);

router.put('/:id/conciliar', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  egresoController.conciliar
);

module.exports = router; 