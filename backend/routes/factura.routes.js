const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/factura.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

// Rutas públicas (no hay ninguna)

// Rutas protegidas - requieren autenticación
router.use(autenticar);

// Obtener estadísticas de facturas - solo roles específicos
router.get('/estadisticas', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  facturaController.getEstadisticas
);

// Rutas CRUD básicas
router.get('/', 
  autorizar(['administrador', 'gerencia', 'contabilidad', 'ventas']), 
  facturaController.findAll
);

router.get('/:id', 
  autorizar(['administrador', 'gerencia', 'contabilidad', 'ventas']), 
  facturaController.findOne
);

router.post('/', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  facturaController.create
);

router.put('/:id', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  facturaController.update
);

router.delete('/:id', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  facturaController.delete
);

// Rutas especializadas de gestión de facturas
router.put('/:id/estado', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  facturaController.cambiarEstado
);

// Ruta para emisión electrónica de facturas (SII)
router.post('/:id/emitir-electronica', 
  autorizar(['administrador', 'gerencia', 'contabilidad']), 
  facturaController.emitirFacturaElectronica
);

module.exports = router; 