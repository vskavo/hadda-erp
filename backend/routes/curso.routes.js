const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/curso.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolMiddleware = require('../middlewares/rol.middleware');

// Middleware para verificar token en rutas protegidas
const auth = authMiddleware.autenticar;

// Middleware para verificar permisos
const tienePermiso = rolMiddleware.tienePermiso;

// Obtener todos los cursos (con filtros y paginación)
router.get('/', auth, tienePermiso('cursos:read'), cursoController.getCursos);

// Obtener estadísticas de cursos
router.get('/estadisticas', auth, tienePermiso('cursos:read'), cursoController.getEstadisticasCursos);

// Obtener cursos sincronizados con proyectos, clientes y responsables
router.get('/sincronizados', auth, tienePermiso('cursos:read'), cursoController.getCursosSincronizados);

// Buscar cursos por código SENCE
router.get('/buscar/codigo/:codigo', auth, tienePermiso('cursos:read'), cursoController.buscarPorCodigoSence);

// Obtener resumen de participantes de un curso
router.get('/:id/participantes/resumen', auth, tienePermiso('cursos:participantes:manage'), cursoController.getResumenParticipantes);

// Actualizar estado de múltiples participantes
router.patch('/:id/participantes/estado-multiple', auth, tienePermiso('cursos:participantes:manage'), cursoController.actualizarEstadoMultiple);

// Obtener declaraciones juradas de un curso
router.get('/:id/declaraciones-juradas', auth, tienePermiso('cursos:read'), cursoController.getDeclaracionesJuradasCurso);

// Obtener un curso específico por ID
router.get('/:id', auth, tienePermiso('cursos:read'), cursoController.getCursoById);

// Crear un nuevo curso
router.post('/', auth, tienePermiso('cursos:create'), cursoController.createCurso);

// Actualizar un curso existente
router.put('/:id', auth, tienePermiso('cursos:update'), cursoController.updateCurso);

// Cambiar el estado de un curso
router.patch('/:id/estado', auth, tienePermiso('cursos:update'), cursoController.cambiarEstadoCurso);

// Cambiar el estado SENCE de un curso
router.patch('/:id/estado-sence', auth, tienePermiso('cursos:update'), cursoController.cambiarEstadoSence);

// Sincronización manual con SENCE para un curso
router.post('/:id/sincronizar-sence', auth, tienePermiso('cursos:update'), cursoController.sincronizarSenceManual);

// Actualizar certificados de todos los participantes activos de un curso
router.patch('/:id/participantes/certificados-masivo', auth, tienePermiso('cursos:participantes:manage'), cursoController.actualizarCertificadosParticipantes);

// Eliminar un curso
router.delete('/:id', auth, tienePermiso('cursos:delete'), cursoController.deleteCurso);

module.exports = router; 