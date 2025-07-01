const express = require('express');
const router = express.Router();
const sesionController = require('../controllers/sesion.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolMiddleware = require('../middlewares/rol.middleware');

// Middleware para verificar token en rutas protegidas
const auth = authMiddleware.autenticar;

// Middleware para verificar permisos
const tienePermiso = rolMiddleware.tienePermiso;

// Rutas para gestión de sesiones
router.get('/curso/:cursoId', auth, tienePermiso('CURSOS_SESIONES'), sesionController.getSesionesByCurso);
router.get('/:id', auth, tienePermiso('CURSOS_SESIONES'), sesionController.getSesionById);
router.post('/', auth, tienePermiso('CURSOS_SESIONES'), sesionController.createSesion);
router.put('/:id', auth, tienePermiso('CURSOS_SESIONES'), sesionController.updateSesion);
router.delete('/:id', auth, tienePermiso('CURSOS_SESIONES'), sesionController.deleteSesion);
router.put('/:id/estado', auth, tienePermiso('CURSOS_SESIONES'), sesionController.cambiarEstadoSesion);
router.post('/generar', auth, tienePermiso('CURSOS_SESIONES'), sesionController.generarSesiones);

module.exports = router; 