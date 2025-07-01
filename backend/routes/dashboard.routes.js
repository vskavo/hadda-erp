const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/rol.middleware');

// Importar controladores
const dashboardController = require('../controllers/dashboard.controller');

// Middleware de autenticación para todas las rutas de dashboard
router.use(autenticar);

// Rutas para el dashboard
router.get('/estadisticas', 
  tienePermiso('dashboard:read'),
  dashboardController.getEstadisticas
);

router.get('/actividades', 
  tienePermiso('dashboard:read'),
  dashboardController.getActividades
);

router.get('/proximos-cursos', 
  tienePermiso('dashboard:read'),
  dashboardController.getProximosCursos
);

router.get('/financiero', 
  tienePermiso('finanzas:dashboard:read'),
  dashboardController.getResumenFinanciero
);

router.get('/completo', 
  tienePermiso('dashboard:read'),
  dashboardController.getDashboardCompleto
);

module.exports = router; 