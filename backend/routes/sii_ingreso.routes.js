const express = require('express');
const router = express.Router();
const siiIngresoController = require('../controllers/sii_ingreso.controller');

// Middleware de autenticación
const { autenticar } = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(autenticar);

// Rutas para ingresos SII
router.get('/', siiIngresoController.getSiiIngresos);
router.get('/estadisticas', siiIngresoController.getEstadisticasSiiIngresos);
router.get('/:id', siiIngresoController.getSiiIngreso);
router.post('/', siiIngresoController.createSiiIngreso);
router.put('/:id', siiIngresoController.updateSiiIngreso);
router.put('/:id/proyecto', siiIngresoController.actualizarProyectoIngreso);
router.delete('/:id', siiIngresoController.deleteSiiIngreso);

// Ruta para sincronización con SII
router.post('/sincronizar', siiIngresoController.sincronizarIngresosSii);

module.exports = router;
