const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolMiddleware = require('../middlewares/rol.middleware');

// Middleware para verificar token en rutas protegidas
const auth = authMiddleware.autenticar;

// Middleware para verificar roles
const esAdmin = rolMiddleware.esAdministrador;

/**
 * @route POST /api/email/enviar
 * @desc Envía un correo electrónico
 * @access Privado (requiere autenticación)
 */
router.post(
  '/enviar',
  auth,
  emailController.validarEnvioCorreo,
  emailController.enviarCorreo
);

/**
 * @route POST /api/email/enviar-plantilla
 * @desc Envía un correo electrónico con plantilla
 * @access Privado (requiere autenticación)
 */
router.post(
  '/enviar-plantilla',
  auth,
  emailController.validarEnvioCorreoConPlantilla,
  emailController.enviarCorreoConPlantilla
);

/**
 * @route GET /api/email/verificar-configuracion
 * @desc Verifica la configuración de correo electrónico
 * @access Privado (requiere autenticación y rol de administrador)
 */
router.get(
  '/verificar-configuracion',
  auth,
  esAdmin,
  emailController.verificarConfiguracion
);

module.exports = router; 