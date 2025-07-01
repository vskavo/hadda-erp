const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/auth.middleware');

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'Ruta de autenticación funcionando' });
});

// Rutas de autenticación simplificadas para solucionar el problema
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/perfil', autenticar, authController.getPerfil);
router.put('/perfil', autenticar, authController.updatePerfil);
router.post('/logout', autenticar, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token/validate', authController.validateResetToken);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router; 