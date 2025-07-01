const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rol.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolMiddleware = require('../middlewares/rol.middleware');

// Middleware para verificar token en rutas protegidas
const auth = authMiddleware.autenticar;

// Middleware para verificar roles en rutas protegidas
const esAdmin = rolMiddleware.esAdministrador;

// ===== Rutas para Permisos (Definir ANTES que /:id) =====
// Obtener todos los permisos (solo administradores)
router.get('/permisos', auth, esAdmin, rolController.findAllPermisos);

// Obtener un permiso por ID (solo administradores)
router.get('/permisos/:id', auth, esAdmin, rolController.findPermisoById);

// Crear un nuevo permiso (solo administradores)
router.post('/permisos', auth, esAdmin, rolController.createPermiso);

// Actualizar un permiso (solo administradores)
router.put('/permisos/:id', auth, esAdmin, rolController.updatePermiso);

// Eliminar un permiso (solo administradores)
router.delete('/permisos/:id', auth, esAdmin, rolController.deletePermiso);

// Ruta para verificar permisos (solo administradores)
router.post('/verificar-permiso', auth, rolController.checkPermiso);

// ===== Rutas para Roles =====
// Obtener todos los roles (solo administradores)
router.get('/', auth, esAdmin, rolController.findAllRoles);

// Crear un nuevo rol (solo administradores)
router.post('/', auth, esAdmin, rolController.createRol);

// Obtener un rol por ID (solo administradores) - Definir DESPUÉS de /permisos
router.get('/:id', auth, esAdmin, rolController.findRolById);

// Actualizar un rol (solo administradores)
router.put('/:id', auth, esAdmin, rolController.updateRol);

// Eliminar un rol (solo administradores)
router.delete('/:id', auth, esAdmin, rolController.deleteRol);

module.exports = router; 