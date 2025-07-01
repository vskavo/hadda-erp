const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/venta.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolMiddleware = require('../middlewares/rol.middleware');

// Middleware para verificar token en rutas protegidas
const auth = authMiddleware.autenticar;

// Middleware para verificar permisos
const tienePermiso = rolMiddleware.tienePermiso;

module.exports = function(app) {
  // Middleware para CORS
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept, x-access-token"
    );
    next();
  });

  // Rutas para ventas
  router.get('/', auth, tienePermiso('VENTAS_READ'), ventaController.findAll);
  router.get('/estadisticas', auth, tienePermiso('VENTAS_READ'), ventaController.estadisticas);
  router.get('/:id', auth, tienePermiso('VENTAS_READ'), ventaController.findOne);
  router.post('/', auth, tienePermiso('VENTAS_CREATE'), ventaController.create);
  router.put('/:id', auth, tienePermiso('VENTAS_UPDATE'), ventaController.update);
  router.delete('/:id', auth, tienePermiso('VENTAS_DELETE'), ventaController.delete);
  router.put('/:id/estado', auth, tienePermiso('VENTAS_UPDATE'), ventaController.cambiarEstado);

  // Ruta para obtener ventas por cliente
  router.get('/cliente/:clienteId', auth, tienePermiso('VENTAS_READ'), ventaController.findByCliente);

  app.use('/api/ventas', router);
}; 