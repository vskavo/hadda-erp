const { check, validationResult } = require('express-validator');
const pdfService = require('../services/pdf.service');

/**
 * Genera un PDF genérico
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con el PDF en base64 o un error
 */
const generarPDF = async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { data, tipo } = req.body;

    // Generar el PDF
    const resultado = await pdfService.generarPDF(data, tipo);

    if (!resultado.success) {
      return res.status(500).json({
        message: 'Error al generar el PDF',
        error: resultado.error,
      });
    }

    return res.status(200).json({
      message: 'PDF generado correctamente',
      pdf: resultado.pdfBase64,
      contentType: resultado.contentType,
      filename: resultado.filename,
    });
  } catch (error) {
    console.error('Error en controlador de generación de PDF:', error);
    return res.status(500).json({
      message: 'Error interno al procesar la solicitud de generación de PDF',
      error: error.message,
    });
  }
};

/**
 * Genera un PDF de factura
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con el PDF en base64 o un error
 */
const generarFacturaPDF = async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const datosFactura = req.body;

    // Generar el PDF de factura
    const resultado = await pdfService.generarFacturaPDF(datosFactura);

    if (!resultado.success) {
      return res.status(500).json({
        message: 'Error al generar el PDF de factura',
        error: resultado.error,
      });
    }

    return res.status(200).json({
      message: 'PDF de factura generado correctamente',
      pdf: resultado.pdfBase64,
      contentType: resultado.contentType,
      filename: resultado.filename,
    });
  } catch (error) {
    console.error('Error en controlador de generación de PDF de factura:', error);
    return res.status(500).json({
      message: 'Error interno al procesar la solicitud de generación de PDF de factura',
      error: error.message,
    });
  }
};

/**
 * Genera un PDF de certificado
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con el PDF en base64 o un error
 */
const generarCertificadoPDF = async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const datosCertificado = req.body;

    // Generar el PDF de certificado
    const resultado = await pdfService.generarCertificadoPDF(datosCertificado);

    if (!resultado.success) {
      return res.status(500).json({
        message: 'Error al generar el PDF de certificado',
        error: resultado.error,
      });
    }

    return res.status(200).json({
      message: 'PDF de certificado generado correctamente',
      pdf: resultado.pdfBase64,
      contentType: resultado.contentType,
      filename: resultado.filename,
    });
  } catch (error) {
    console.error('Error en controlador de generación de PDF de certificado:', error);
    return res.status(500).json({
      message: 'Error interno al procesar la solicitud de generación de PDF de certificado',
      error: error.message,
    });
  }
};

/**
 * Genera un PDF de declaración jurada
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con el PDF en base64 o un error
 */
const generarDeclaracionJuradaPDF = async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const datosDeclaracion = req.body;

    // Generar el PDF de declaración jurada
    const resultado = await pdfService.generarDeclaracionJuradaPDF(datosDeclaracion);

    if (!resultado.success) {
      return res.status(500).json({
        message: 'Error al generar el PDF de declaración jurada',
        error: resultado.error,
      });
    }

    return res.status(200).json({
      message: 'PDF de declaración jurada generado correctamente',
      pdf: resultado.pdfBase64,
      contentType: resultado.contentType,
      filename: resultado.filename,
    });
  } catch (error) {
    console.error('Error en controlador de generación de PDF de declaración jurada:', error);
    return res.status(500).json({
      message: 'Error interno al procesar la solicitud de generación de PDF de declaración jurada',
      error: error.message,
    });
  }
};

/**
 * Genera un PDF de informe
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con el PDF en base64 o un error
 */
const generarInformePDF = async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const datosInforme = req.body;

    // Generar el PDF de informe
    const resultado = await pdfService.generarInformePDF(datosInforme);

    if (!resultado.success) {
      return res.status(500).json({
        message: 'Error al generar el PDF de informe',
        error: resultado.error,
      });
    }

    return res.status(200).json({
      message: 'PDF de informe generado correctamente',
      pdf: resultado.pdfBase64,
      contentType: resultado.contentType,
      filename: resultado.filename,
    });
  } catch (error) {
    console.error('Error en controlador de generación de PDF de informe:', error);
    return res.status(500).json({
      message: 'Error interno al procesar la solicitud de generación de PDF de informe',
      error: error.message,
    });
  }
};

/**
 * Verifica la conexión con la Azure Function
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON con el resultado de la verificación
 */
const verificarConexion = async (req, res) => {
  try {
    const resultado = await pdfService.verificarConexion();

    if (!resultado.success) {
      return res.status(500).json({
        message: 'Error al verificar la conexión con Azure Function',
        error: resultado.error,
      });
    }

    return res.status(200).json({
      message: 'Conexión con Azure Function establecida correctamente',
    });
  } catch (error) {
    console.error('Error al verificar la conexión con Azure Function:', error);
    return res.status(500).json({
      message: 'Error interno al verificar la conexión con Azure Function',
      error: error.message,
    });
  }
};

// Validaciones para la ruta de generación de PDF genérico
const validarGeneracionPDF = [
  check('data').isObject().withMessage('Los datos deben ser un objeto'),
  check('tipo').isString().withMessage('El tipo de documento debe ser una cadena'),
];

// Validaciones para la ruta de generación de PDF de factura
const validarGeneracionFacturaPDF = [
  check('numero').isString().withMessage('El número de factura debe ser una cadena'),
  check('fecha').isString().withMessage('La fecha debe ser una cadena'),
  check('cliente').isString().withMessage('El cliente debe ser una cadena'),
  check('total').isNumeric().withMessage('El total debe ser un número'),
];

// Validaciones para la ruta de generación de PDF de certificado
const validarGeneracionCertificadoPDF = [
  check('participante').isString().withMessage('El participante debe ser una cadena'),
  check('curso').isString().withMessage('El curso debe ser una cadena'),
  check('fecha').isString().withMessage('La fecha debe ser una cadena'),
];

// Validaciones para la ruta de generación de PDF de declaración jurada
const validarGeneracionDeclaracionJuradaPDF = [
  check('otec').isString().withMessage('La OTEC debe ser una cadena'),
  check('curso').isString().withMessage('El curso debe ser una cadena'),
  check('fecha').isString().withMessage('La fecha debe ser una cadena'),
];

// Validaciones para la ruta de generación de PDF de informe
const validarGeneracionInformePDF = [
  check('titulo').isString().withMessage('El título debe ser una cadena'),
  check('fecha').isString().withMessage('La fecha debe ser una cadena'),
];

module.exports = {
  generarPDF,
  generarFacturaPDF,
  generarCertificadoPDF,
  generarDeclaracionJuradaPDF,
  generarInformePDF,
  verificarConexion,
  validarGeneracionPDF,
  validarGeneracionFacturaPDF,
  validarGeneracionCertificadoPDF,
  validarGeneracionDeclaracionJuradaPDF,
  validarGeneracionInformePDF,
}; 