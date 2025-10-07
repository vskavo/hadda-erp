const express = require('express');
const router = express.Router();
const cursoSenceController = require('../controllers/cursoSence.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/rateLimit.middleware');

/**
 * @route   GET /api/cursos-sence
 * @desc    Obtener todos los cursos SENCE
 * @access  Privado
 */
router.get('/', autenticar, apiLimiter, cursoSenceController.getAllCursosSence);

/**
 * @route   GET /api/cursos-sence/search
 * @desc    Buscar cursos SENCE por nombre o código
 * @access  Privado
 */
router.get('/search', autenticar, apiLimiter, cursoSenceController.searchCursosSence);

/**
 * @route   GET /api/cursos-sence/modalidades
 * @desc    Obtener todas las modalidades de cursos SENCE
 * @access  Privado
 */
router.get('/modalidades', autenticar, apiLimiter, cursoSenceController.getModalidades);

/**
 * @route   GET /api/cursos-sence/modos
 * @desc    Obtener todos los modos de cursos SENCE
 * @access  Privado
 */
router.get('/modos', autenticar, apiLimiter, cursoSenceController.getModos);

/**
 * @route   GET /api/cursos-sence/:id
 * @desc    Obtener un curso SENCE por su ID
 * @access  Privado
 */
router.get('/:id', autenticar, apiLimiter, cursoSenceController.getCursoSenceById);

/**
 * @route   POST /api/cursos-sence
 * @desc    Crear un nuevo curso SENCE
 * @access  Privado
 */
router.post('/', autenticar, apiLimiter, cursoSenceController.createCursoSence);

/**
 * @route   PUT /api/cursos-sence/:id
 * @desc    Actualizar un curso SENCE
 * @access  Privado
 */
router.put('/:id', autenticar, apiLimiter, cursoSenceController.updateCursoSence);

/**
 * @route   DELETE /api/cursos-sence/:id
 * @desc    Eliminar un curso SENCE
 * @access  Privado
 */
router.delete('/:id', autenticar, apiLimiter, cursoSenceController.deleteCursoSence);

/**
 * @route   POST /api/cursos-sence/bulk
 * @desc    Crear múltiples cursos SENCE desde CSV
 * @access  Privado
 */
router.post('/bulk', autenticar, apiLimiter, cursoSenceController.bulkCreateCursosSence);

/**
 * @route   GET /api/cursos-sence/template/download
 * @desc    Descargar plantilla CSV para cursos SENCE
 * @access  Privado
 */
router.get('/template/download', autenticar, apiLimiter, cursoSenceController.downloadTemplate);

module.exports = router; 