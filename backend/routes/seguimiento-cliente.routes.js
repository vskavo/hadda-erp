const express = require('express');
const router = express.Router();
const seguimientoClienteController = require('../controllers/seguimiento-cliente.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/rol.middleware');

// Ruta de prueba para depuración
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Ruta de seguimientos funcionando correctamente' });
});

// Rutas protegidas - requieren autenticación
router.use(autenticar);

// Obtener todos los seguimientos con filtros - Requiere permiso de lectura general de clientes o actividades
router.get('/', 
  tienePermiso('clientes:actividades:manage'),
  seguimientoClienteController.findAll
);

// Obtener seguimientos por cliente - Requiere permiso para gestionar actividades de cliente
router.get('/cliente/:clienteId', 
  tienePermiso('clientes:actividades:manage'),
  seguimientoClienteController.findByCliente
);

// Obtener seguimientos por contacto - Requiere permiso para gestionar contactos
router.get('/contacto/:contactoId', 
  tienePermiso('clientes:contactos:manage'),
  seguimientoClienteController.findByContacto
);

// Obtener un seguimiento específico - Requiere permiso de lectura de actividades
router.get('/:id', 
  tienePermiso('clientes:actividades:manage'),
  seguimientoClienteController.findOne
);

// Crear un nuevo seguimiento - Requiere permiso para gestionar actividades
router.post('/', 
  tienePermiso('clientes:actividades:manage'),
  seguimientoClienteController.create
);

// Actualizar un seguimiento existente - Requiere permiso para gestionar actividades
router.put('/:id', 
  tienePermiso('clientes:actividades:manage'),
  seguimientoClienteController.update
);

// Eliminar un seguimiento - Requiere permiso para gestionar actividades
router.delete('/:id', 
  tienePermiso('clientes:actividades:manage'),
  seguimientoClienteController.delete
);

module.exports = router; 