const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

// Rutas protegidas - requieren autenticación
router.use(autenticar);

// Obtener todas las configuraciones - solo admin
router.get('/', 
  autorizar(['administrador']), 
  settingController.findAll
);

// Endpoint específico para obtener el valor de IVA
router.get('/iva/valor', settingController.getIVA);

// Endpoint específico para obtener el valor de Retención de Honorarios
router.get('/retencion-honorarios/valor', settingController.getRetencionHonorarios);

// Obtener una configuración por clave - cualquier usuario autenticado
router.get('/:key', settingController.findByKey);

// Crear una configuración - solo admin
router.post('/', 
  autorizar(['administrador']), 
  settingController.create
);

// Actualizar una configuración - solo admin
router.put('/:key', 
  autorizar(['administrador']), 
  settingController.update
);

// Eliminar una configuración - solo admin
router.delete('/:key', 
  autorizar(['administrador']), 
  settingController.delete
);

module.exports = router; 