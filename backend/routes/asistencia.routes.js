const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistencia.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolMiddleware = require('../middlewares/rol.middleware');

// Middleware para verificar token en rutas protegidas
const auth = authMiddleware.autenticar;

// Middleware para verificar permisos
const tienePermiso = rolMiddleware.tienePermiso;

// Rutas para gestión de asistencias
router.get('/curso/:cursoId', auth, tienePermiso('CURSOS_ASISTENCIAS'), asistenciaController.getAsistenciasByCursoFecha);
router.get('/participante/:participanteId', auth, tienePermiso('CURSOS_ASISTENCIAS'), asistenciaController.getAsistenciasByParticipante);
router.post('/registrar', auth, tienePermiso('CURSOS_ASISTENCIAS'), asistenciaController.registrarAsistencia);
router.post('/curso/:cursoId/masivas', auth, tienePermiso('CURSOS_ASISTENCIAS'), asistenciaController.registrarAsistenciasMasivas);
router.delete('/:id', auth, tienePermiso('CURSOS_ASISTENCIAS'), asistenciaController.deleteAsistencia);
router.get('/reporte/curso/:cursoId', auth, tienePermiso('CURSOS_ASISTENCIAS'), asistenciaController.getReporteAsistenciaCurso);

module.exports = router; 