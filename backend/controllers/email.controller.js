const { check, validationResult } = require('express-validator');
const emailService = require('../services/email.service');

/**
 * Envía un correo electrónico
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON
 */
const enviarCorreo = async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, subject, text, html, cc, bcc, attachments } = req.body;

    // Enviar correo
    const resultado = await emailService.enviarCorreo({
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      attachments,
    });

    if (!resultado.success) {
      return res.status(500).json({
        message: 'Error al enviar el correo electrónico',
        error: resultado.error,
      });
    }

    return res.status(200).json({
      message: 'Correo enviado correctamente',
      messageId: resultado.messageId,
    });
  } catch (error) {
    console.error('Error en controlador de correo:', error);
    return res.status(500).json({
      message: 'Error interno al procesar la solicitud de correo',
      error: error.message,
    });
  }
};

/**
 * Envía un correo electrónico con plantilla
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON
 */
const enviarCorreoConPlantilla = async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, subject, templateName, data, cc, bcc, attachments } = req.body;

    // Enviar correo con plantilla
    const resultado = await emailService.enviarCorreoConPlantilla({
      to,
      subject,
      templateName,
      data,
      cc,
      bcc,
      attachments,
    });

    if (!resultado.success) {
      return res.status(500).json({
        message: 'Error al enviar el correo electrónico con plantilla',
        error: resultado.error,
      });
    }

    return res.status(200).json({
      message: 'Correo con plantilla enviado correctamente',
      messageId: resultado.messageId,
    });
  } catch (error) {
    console.error('Error en controlador de correo con plantilla:', error);
    return res.status(500).json({
      message: 'Error interno al procesar la solicitud de correo con plantilla',
      error: error.message,
    });
  }
};

/**
 * Verifica la configuración de correo electrónico
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 * @returns {Object} - Respuesta JSON
 */
const verificarConfiguracion = async (req, res) => {
  try {
    const resultado = await emailService.verificarConfiguracion();

    if (!resultado.success) {
      return res.status(500).json({
        message: 'Error en la configuración de correo electrónico',
        error: resultado.error,
      });
    }

    return res.status(200).json({
      message: 'Configuración de correo electrónico válida',
    });
  } catch (error) {
    console.error('Error al verificar configuración de correo:', error);
    return res.status(500).json({
      message: 'Error interno al verificar la configuración de correo',
      error: error.message,
    });
  }
};

// Validaciones para la ruta de envío de correo
const validarEnvioCorreo = [
  check('to').isEmail().withMessage('El destinatario debe ser un correo válido'),
  check('subject').notEmpty().withMessage('El asunto es obligatorio'),
  check('text').optional(),
  check('html').optional(),
  check('cc').optional().isString().withMessage('CC debe ser una cadena de correos'),
  check('bcc').optional().isString().withMessage('BCC debe ser una cadena de correos'),
];

// Validaciones para la ruta de envío de correo con plantilla
const validarEnvioCorreoConPlantilla = [
  check('to').isEmail().withMessage('El destinatario debe ser un correo válido'),
  check('subject').notEmpty().withMessage('El asunto es obligatorio'),
  check('templateName').notEmpty().withMessage('El nombre de la plantilla es obligatorio'),
  check('data').isObject().withMessage('Los datos deben ser un objeto'),
  check('cc').optional().isString().withMessage('CC debe ser una cadena de correos'),
  check('bcc').optional().isString().withMessage('BCC debe ser una cadena de correos'),
];

module.exports = {
  enviarCorreo,
  enviarCorreoConPlantilla,
  verificarConfiguracion,
  validarEnvioCorreo,
  validarEnvioCorreoConPlantilla,
}; 