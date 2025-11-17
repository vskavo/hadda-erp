const express = require('express');
const router = express.Router();
const declaracionJuradaController = require('../controllers/declaracion-jurada.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolMiddleware = require('../middlewares/rol.middleware');

// Middleware para verificar token en rutas protegidas
const auth = authMiddleware.autenticar;

// Middleware para verificar permisos
const tienePermiso = rolMiddleware.tienePermiso;

// Obtener todas las declaraciones juradas (con filtros y paginación)
router.get('/', auth, tienePermiso('CURSOS_DECLARACIONES'), declaracionJuradaController.getDeclaracionesJuradas);

// Obtener una declaración jurada específica por ID
router.get('/:id', auth, tienePermiso('CURSOS_DECLARACIONES'), declaracionJuradaController.getDeclaracionJuradaById);

// Obtener declaraciones juradas por id_sence
router.get('/id-sence/:idSence', auth, tienePermiso('CURSOS_DECLARACIONES'), declaracionJuradaController.getDeclaracionesJuradasByIdSence);

// Crear una nueva declaración jurada
router.post('/', auth, tienePermiso('CURSOS_DECLARACIONES'), declaracionJuradaController.createDeclaracionJurada);

// Actualizar una declaración jurada existente
router.put('/:id', auth, tienePermiso('CURSOS_DECLARACIONES'), declaracionJuradaController.updateDeclaracionJurada);

// Cambiar el estado de una declaración jurada
router.patch('/:id/estado', auth, tienePermiso('CURSOS_DECLARACIONES'), declaracionJuradaController.cambiarEstadoDeclaracionJurada);

// Eliminar una declaración jurada
router.delete('/:id', auth, tienePermiso('CURSOS_DECLARACIONES'), declaracionJuradaController.deleteDeclaracionJurada);

// Preparar sincronización con extensión de Chrome (obtener datos necesarios)
router.get('/preparar-sincronizacion/:cursoId', auth, tienePermiso('CURSOS_DECLARACIONES'), declaracionJuradaController.prepararSincronizacionConExtension);

// Sincronizar declaraciones juradas de un curso
router.post('/sincronizar/:cursoId', auth, tienePermiso('CURSOS_DECLARACIONES'), declaracionJuradaController.sincronizarDeclaracionesJuradas);

// Consultar estado de sincronización de declaraciones juradas de un curso
router.get('/sync-status/:cursoId', auth, tienePermiso('CURSOS_DECLARACIONES'), declaracionJuradaController.getSyncStatus);

module.exports = router; 