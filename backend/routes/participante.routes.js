const express = require('express');
const router = express.Router();
const participanteController = require('../controllers/participante.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolMiddleware = require('../middlewares/rol.middleware');

// Middleware para verificar token en rutas protegidas
const auth = authMiddleware.autenticar;

// Middleware para verificar permisos
const tienePermiso = rolMiddleware.tienePermiso;

// Obtener todos los participantes de un curso
router.get('/curso/:cursoId', auth, tienePermiso('CURSOS_PARTICIPANTES'), participanteController.getParticipantesByCurso);

// Buscar participantes por RUT
router.get('/buscar/rut/:rut', auth, tienePermiso('CURSOS_PARTICIPANTES'), participanteController.buscarPorRut);

// Obtener un participante específico por ID
router.get('/:id', auth, tienePermiso('CURSOS_PARTICIPANTES'), participanteController.getParticipanteById);

// Crear un nuevo participante
router.post('/', auth, tienePermiso('CURSOS_PARTICIPANTES'), participanteController.createParticipante);

// Importar participantes desde un archivo CSV
router.post('/importar/curso/:cursoId', auth, tienePermiso('CURSOS_PARTICIPANTES'), participanteController.importarParticipantes);

// Actualizar un participante existente
router.put('/:id', auth, tienePermiso('CURSOS_PARTICIPANTES'), participanteController.updateParticipante);

// Cambiar el estado de un participante
router.patch('/:id/estado', auth, tienePermiso('CURSOS_PARTICIPANTES'), participanteController.cambiarEstadoParticipante);

// Eliminar un participante
router.delete('/:id', auth, tienePermiso('CURSOS_PARTICIPANTES'), participanteController.deleteParticipante);

module.exports = router; 