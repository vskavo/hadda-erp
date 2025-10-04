const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');
const reporteService = require('../services/reporte.service');
const { autenticar } = require('../middlewares/auth.middleware');
const { tienePermiso } = require('../middlewares/rol.middleware');
const { body, param, query } = require('express-validator');
const { validate } = require('../middlewares/validation.middleware');

/**
 * Rutas para gestión de reportes personalizados
 */

// Aplicar autenticación a todas las rutas
router.use(autenticar);

/**
 * @route GET /api/reportes/predefinidos
 * @desc Obtener listado de reportes predefinidos
 * @access Private
 * @permission reportes:read
 */
router.get('/predefinidos',
  tienePermiso('reportes:read'),
  [
    query('categoria').optional().isString().trim(),
    query('tipo_reporte').optional().isString().trim()
  ],
  validate,
  reporteController.getReportesPredefinidos
);

/**
 * @route GET /api/reportes/:id
 * @desc Obtener un reporte específico por ID
 * @access Private
 * @permission reportes:read
 */
router.get('/:id',
  tienePermiso('reportes:read'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID de reporte debe ser un número entero positivo')
  ],
  validate,
  reporteController.getReporteById
);

/**
 * @route GET /api/reportes/:id/estado
 * @desc Obtener estado de un reporte
 * @access Private
 * @permission reportes:read
 */
router.get('/:id/estado',
  tienePermiso('reportes:read'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID de reporte debe ser un número entero positivo')
  ],
  validate,
  reporteController.getEstadoReporte
);

/**
 * @route GET /api/reportes/:id/datos
 * @desc Obtener datos de un reporte completado
 * @access Private
 * @permission reportes:read
 */
router.get('/:id/datos',
  tienePermiso('reportes:read'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID de reporte debe ser un número entero positivo')
  ],
  validate,
  reporteController.getDatosReporte
);

/**
 * @route POST /api/reportes/generar
 * @desc Generar un reporte personalizado
 * @access Private
 * @permission reportes:create
 */
router.post('/generar',
  tienePermiso('reportes:create'),
  [
    body('entidad')
      .isIn(['proyectos', 'clientes', 'facturas', 'ventas', 'cursos', 'finanzas'])
      .withMessage('Entidad no válida'),
    body('campos')
      .isArray({ min: 1 })
      .withMessage('Debe seleccionar al menos un campo'),
    body('campos.*')
      .isString()
      .notEmpty()
      .withMessage('Cada campo debe ser una cadena no vacía'),
    body('nombre')
      .optional()
      .isString()
      .isLength({ max: 255 })
      .withMessage('Nombre debe ser una cadena de máximo 255 caracteres'),
    body('descripcion')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Descripción debe ser una cadena de máximo 1000 caracteres'),
    body('filtros')
      .optional()
      .isObject()
      .withMessage('Filtros debe ser un objeto')
  ],
  validate,
  reporteController.generarReportePersonalizado
);

/**
 * @route GET /api/reportes/:id/excel
 * @desc Exportar reporte a Excel
 * @access Private
 * @permission reportes:export
 */
router.get('/:id/excel',
  tienePermiso('reportes:export'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID de reporte debe ser un número entero positivo')
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { Reporte } = require('../models');

      // Verificar que el reporte existe y está completado
      const reporte = await Reporte.findByPk(id);
      if (!reporte) {
        return res.status(404).json({ message: 'Reporte no encontrado' });
      }

      if (reporte.estado !== 'completado') {
        return res.status(400).json({
          message: 'El reporte aún no está completado',
          estado: reporte.estado
        });
      }

      // Generar archivo Excel
      const resultado = await reporteService.generarYGuardarReporte(reporte, 'excel');

      // Incrementar contador de descargas
      await reporteService.incrementarContadorDescargas(id);

      // Enviar archivo
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reporte.nombre}.xlsx"`);
      res.send(resultado.archivo);

    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      res.status(500).json({
        message: 'Error al exportar reporte a Excel',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/reportes/:id/pdf
 * @desc Exportar reporte a PDF
 * @access Private
 * @permission reportes:export
 */
router.get('/:id/pdf',
  tienePermiso('reportes:export'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID de reporte debe ser un número entero positivo')
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { Reporte } = require('../models');

      // Verificar que el reporte existe y está completado
      const reporte = await Reporte.findByPk(id);
      if (!reporte) {
        return res.status(404).json({ message: 'Reporte no encontrado' });
      }

      if (reporte.estado !== 'completado') {
        return res.status(400).json({
          message: 'El reporte aún no está completado',
          estado: reporte.estado
        });
      }

      // Generar archivo PDF
      const resultado = await reporteService.generarYGuardarReporte(reporte, 'pdf');

      // Incrementar contador de descargas
      await reporteService.incrementarContadorDescargas(id);

      // Enviar archivo
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reporte.nombre}.pdf"`);
      res.send(resultado.archivo);

    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      res.status(500).json({
        message: 'Error al exportar reporte a PDF',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/reportes/campos/:entidad
 * @desc Obtener campos disponibles para generar reportes personalizados
 * @access Private
 * @permission reportes:read
 */
router.get('/campos/:entidad',
  tienePermiso('reportes:read'),
  [
    param('entidad')
      .isIn(['proyectos', 'clientes', 'facturas', 'ventas', 'cursos', 'finanzas'])
      .withMessage('Entidad no válida')
  ],
  validate,
  reporteController.getCamposDisponibles
);

/**
 * @route POST /api/reportes/predefinidos
 * @desc Guardar un reporte personalizado como predefinido
 * @access Private
 * @permission reportes:create
 */
router.post('/predefinidos',
  tienePermiso('reportes:create'),
  [
    body('nombre')
      .isString()
      .isLength({ min: 1, max: 255 })
      .withMessage('Nombre es obligatorio y debe tener máximo 255 caracteres'),
    body('descripcion')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Descripción debe tener máximo 1000 caracteres'),
    body('categoria')
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage('Categoría debe tener máximo 100 caracteres'),
    body('entidad')
      .isIn(['proyectos', 'clientes', 'facturas', 'ventas', 'cursos', 'finanzas'])
      .withMessage('Entidad no válida'),
    body('campos')
      .isArray({ min: 1 })
      .withMessage('Debe seleccionar al menos un campo'),
    body('campos.*')
      .isString()
      .notEmpty()
      .withMessage('Cada campo debe ser una cadena no vacía'),
    body('filtros')
      .optional()
      .isObject()
      .withMessage('Filtros debe ser un objeto'),
    body('rolesPermitidos')
      .optional()
      .isArray()
      .withMessage('Roles permitidos debe ser un array')
  ],
  validate,
  reporteController.guardarReportePredefinido
);

/**
 * @route DELETE /api/reportes/predefinidos/:id
 * @desc Eliminar un reporte predefinido
 * @access Private
 * @permission reportes:delete
 */
router.delete('/predefinidos/:id',
  tienePermiso('reportes:delete'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID de template debe ser un número entero positivo')
  ],
  validate,
  reporteController.eliminarReportePredefinido
);

/**
 * @route GET /api/reportes/estadisticas
 * @desc Obtener estadísticas de reportes generados
 * @access Private
 * @permission reportes:read
 */
router.get('/estadisticas',
  tienePermiso('reportes:read'),
  reporteController.getEstadisticasReportes
);

/**
 * @route GET /api/reportes/:id/descargar/:formato
 * @desc Descargar archivo de reporte generado
 * @access Private
 * @permission reportes:export
 */
router.get('/:id/descargar/:formato',
  tienePermiso('reportes:export'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID de reporte debe ser un número entero positivo'),
    param('formato').isIn(['excel', 'pdf', 'csv']).withMessage('Formato no válido')
  ],
  validate,
  async (req, res) => {
    try {
      const { id, formato } = req.params;
      const { Reporte } = require('../models');

      const reporte = await Reporte.findByPk(id);
      if (!reporte) {
        return res.status(404).json({ message: 'Reporte no encontrado' });
      }

      if (!reporte.ruta_archivo) {
        return res.status(404).json({ message: 'Archivo no encontrado' });
      }

      // Verificar que el archivo existe
      const fs = require('fs').promises;
      try {
        await fs.access(reporte.ruta_archivo);
      } catch {
        return res.status(404).json({ message: 'Archivo no disponible' });
      }

      // Incrementar contador de descargas
      await reporteService.incrementarContadorDescargas(id);

      // Determinar content-type según formato
      let contentType;
      let extension;
      switch (formato) {
        case 'excel':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = 'xlsx';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          extension = 'pdf';
          break;
        case 'csv':
          contentType = 'text/csv';
          extension = 'csv';
          break;
      }

      // Enviar archivo
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${reporte.nombre}.${extension}"`);

      const fileStream = require('fs').createReadStream(reporte.ruta_archivo);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error al descargar archivo:', error);
      res.status(500).json({
        message: 'Error al descargar archivo',
        error: error.message
      });
    }
  }
);

module.exports = router;