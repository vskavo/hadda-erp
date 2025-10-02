const express = require('express');
const router = express.Router();
const siiEgresoController = require('../controllers/sii_egreso.controller');

// Middleware de autenticación
const { autenticar } = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(autenticar);

// Rutas para egresos SII
router.get('/', siiEgresoController.getSiiEgresos);
router.get('/estadisticas', siiEgresoController.getEstadisticasSiiEgresos);
router.get('/:id', siiEgresoController.getSiiEgreso);
router.post('/', siiEgresoController.createSiiEgreso);
router.put('/:id', siiEgresoController.updateSiiEgreso);
router.put('/:id/proyecto', siiEgresoController.actualizarProyectoEgreso);
router.delete('/:id', siiEgresoController.deleteSiiEgreso);

// Ruta para sincronización con SII
router.post('/sincronizar', siiEgresoController.sincronizarEgresosSii);

module.exports = router;
