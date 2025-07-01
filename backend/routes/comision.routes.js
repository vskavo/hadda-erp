const express = require('express');
const router = express.Router();
// Cambiar importación del controlador
const comisionController = require('../controllers/comision.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

router.use(autenticar);

// Ruta para calcular comisión - disponible para todos los roles autenticados
// Debe estar antes de aplicar la autorización de administrador
router.get('/calculo', comisionController.calcularComision);

// Ruta para verificar comisiones por rol - disponible para todos los roles autenticados
router.get('/verificar', comisionController.verificarComisionesRol);

// Aplicar restricción de rol administrador solo para el resto de rutas
router.use(autorizar(['administrador']));

// Cambiar referencias a funciones del controlador
router.get('/', comisionController.findAllComisiones);
router.post('/', comisionController.createComision);
router.put('/:id', comisionController.updateComision);
router.delete('/:id', comisionController.deleteComision);

module.exports = router; 