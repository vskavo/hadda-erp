const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Envía un correo electrónico usando SendGrid
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.text - Contenido en texto plano (opcional)
 * @param {string} options.html - Contenido en HTML (opcional)
 * @param {string} options.cc - Copia carbón (opcional)
 * @param {string} options.bcc - Copia oculta (opcional)
 * @param {Array} options.attachments - Archivos adjuntos (opcional)
 * @returns {Promise} - Promesa con el resultado del envío
 */
const enviarCorreo = async (options) => {
  try {
    const { to, subject, text, html, cc, bcc, attachments } = options;

    if (!to) throw new Error('El destinatario es obligatorio');
    if (!subject) throw new Error('El asunto es obligatorio');
    if (!text && !html) throw new Error('Debe proporcionar contenido de texto o HTML');

    const msg = {
      to,
      from: process.env.EMAIL_FROM, // Debe ser un remitente verificado en SendGrid
      subject,
      ...(text && { text }),
      ...(html && { html }),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(attachments && { attachments }),
    };

    await sgMail.send(msg);
    return {
      success: true,
      message: 'Correo enviado correctamente',
    };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Envía un correo con plantilla usando Handlebars y SendGrid
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.templateName - Nombre de la plantilla
 * @param {Object} options.data - Datos para la plantilla
 * @param {string} options.cc - Copia carbón (opcional)
 * @param {string} options.bcc - Copia oculta (opcional)
 * @param {Array} options.attachments - Archivos adjuntos (opcional)
 * @returns {Promise} - Promesa con el resultado del envío
 */
const enviarCorreoConPlantilla = async (options) => {
  try {
    const { to, subject, templateName, data, cc, bcc, attachments } = options;
    const html = await renderizarPlantilla(templateName, data);
    return await enviarCorreo({
      to,
      subject,
      html,
      cc,
      bcc,
      attachments,
    });
  } catch (error) {
    console.error('Error al enviar correo con plantilla:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Renderiza una plantilla HTML con Handlebars
 * @param {string} templateName - Nombre de la plantilla
 * @param {Object} data - Datos para la plantilla
 * @returns {Promise<string>} - HTML generado
 */
const renderizarPlantilla = async (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '..', 'utils', 'email-templates', `${templateName}.html`);
    const template = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(template);
    if (!data.año) {
      data.año = new Date().getFullYear();
    }
    return compiledTemplate(data);
  } catch (error) {
    console.error('Error al renderizar plantilla:', error);
    throw new Error(`Error al renderizar la plantilla: ${error.message}`);
  }
};

/**
 * Obtiene la lista de plantillas disponibles
 * @returns {Promise<string[]>} - Lista de nombres de plantillas
 */
const obtenerPlantillasDisponibles = async () => {
  try {
    const templatesDir = path.join(__dirname, '..', 'utils', 'email-templates');
    const files = await fs.readdir(templatesDir);
    return files
      .filter(file => file.endsWith('.html'))
      .map(file => file.replace('.html', ''));
  } catch (error) {
    console.error('Error al obtener plantillas disponibles:', error);
    return [];
  }
};

module.exports = {
  enviarCorreo,
  enviarCorreoConPlantilla,
  obtenerPlantillasDisponibles,
}; 