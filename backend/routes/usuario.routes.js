const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolMiddleware = require('../middlewares/rol.middleware');

// Middleware para verificar token en rutas protegidas
const auth = authMiddleware.autenticar;

// Middleware para verificar roles en rutas protegidas
const esAdmin = rolMiddleware.esAdministrador;
const esFinanciero = rolMiddleware.esFinanciero;
const esSupervisor = rolMiddleware.esSupervisor;
const tienePermiso = rolMiddleware.tienePermiso;

// Ruta para obtener perfil del usuario actual (requiere autenticación)
router.get('/perfil', auth, usuarioController.getPerfilUsuarioActual);

// NUEVA RUTA: Obtener permisos del usuario actual
router.get('/perfil/permisos', auth, usuarioController.getMisPermisos);

// Ruta para actualizar perfil del usuario actual (requiere autenticación)
router.put('/perfil', auth, usuarioController.updatePerfilUsuarioActual);

// Rutas compatibles con el frontend (en inglés)
router.get('/profile', auth, usuarioController.getPerfilUsuarioActual);
router.put('/profile', auth, usuarioController.updatePerfilUsuarioActual);
router.put('/change-password', auth, usuarioController.changePasswordForCurrentUser);

// Rutas para administración de usuarios
router.get('/', auth, tienePermiso('usuarios:read:list'), usuarioController.findAll);
router.get('/:id', auth, esAdmin, usuarioController.findOne);
router.post('/', auth, esAdmin, usuarioController.create);
router.put('/:id', auth, esAdmin, usuarioController.update);
router.delete('/:id', auth, esAdmin, usuarioController.delete);
router.delete('/:id/hard', auth, esAdmin, usuarioController.hardDelete);

// Rutas para cambios de rol (requiere rol de administrador)
router.put('/:id/rol', auth, esAdmin, usuarioController.changeRole);

// Ruta para cambio de contraseña (el usuario solo puede cambiar su propia contraseña,
// el administrador puede cambiar cualquier contraseña)
router.put('/:id/password', auth, usuarioController.changePassword);

module.exports = router; 