const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contacto.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

// Rutas protegidas - requieren autenticación
router.use(autenticar);

// Obtener todos los contactos de un cliente
router.get('/cliente/:clienteId', 
  autorizar(['administrador', 'gerencia', 'ventas', 'contabilidad', 'operaciones']), 
  contactoController.findAllByCliente
);

// Obtener un contacto específico
router.get('/:id', 
  autorizar(['administrador', 'gerencia', 'ventas', 'contabilidad', 'operaciones']), 
  contactoController.findOne
);

// Crear un nuevo contacto
router.post('/', 
  autorizar(['administrador', 'gerencia', 'ventas']), 
  contactoController.create
);

// Actualizar un contacto existente
router.put('/:id', 
  autorizar(['administrador', 'gerencia', 'ventas']), 
  contactoController.update
);

// Eliminar un contacto
router.delete('/:id', 
  autorizar(['administrador', 'gerencia', 'ventas']), 
  contactoController.delete
);

module.exports = router; 