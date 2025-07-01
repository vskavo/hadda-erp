const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdf.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolMiddleware = require('../middlewares/rol.middleware');

// Middleware para verificar token en rutas protegidas
const auth = authMiddleware.autenticar;

// Middleware para verificar roles
const esAdmin = rolMiddleware.esAdministrador;

/**
 * @route POST /api/pdf/generar
 * @desc Genera un PDF genérico
 * @access Privado (requiere autenticación)
 */
router.post(
  '/generar',
  auth,
  pdfController.validarGeneracionPDF,
  pdfController.generarPDF
);

/**
 * @route POST /api/pdf/factura
 * @desc Genera un PDF de factura
 * @access Privado (requiere autenticación)
 */
router.post(
  '/factura',
  auth,
  pdfController.validarGeneracionFacturaPDF,
  pdfController.generarFacturaPDF
);

/**
 * @route POST /api/pdf/certificado
 * @desc Genera un PDF de certificado
 * @access Privado (requiere autenticación)
 */
router.post(
  '/certificado',
  auth,
  pdfController.validarGeneracionCertificadoPDF,
  pdfController.generarCertificadoPDF
);

/**
 * @route POST /api/pdf/declaracion-jurada
 * @desc Genera un PDF de declaración jurada
 * @access Privado (requiere autenticación)
 */
router.post(
  '/declaracion-jurada',
  auth,
  pdfController.validarGeneracionDeclaracionJuradaPDF,
  pdfController.generarDeclaracionJuradaPDF
);

/**
 * @route POST /api/pdf/informe
 * @desc Genera un PDF de informe
 * @access Privado (requiere autenticación)
 */
router.post(
  '/informe',
  auth,
  pdfController.validarGeneracionInformePDF,
  pdfController.generarInformePDF
);

/**
 * @route GET /api/pdf/verificar-conexion
 * @desc Verifica la conexión con la Azure Function
 * @access Privado (requiere autenticación y rol de administrador)
 */
router.get(
  '/verificar-conexion',
  auth,
  esAdmin,
  pdfController.verificarConexion
);

module.exports = router; 