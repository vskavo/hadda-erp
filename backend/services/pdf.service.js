const axios = require('axios');

/**
 * Servicio para la generación de PDFs utilizando Azure Functions
 */

/**
 * Genera un PDF enviando los datos a una Azure Function
 * @param {Object} data - Datos para generar el PDF
 * @param {string} tipo - Tipo de documento a generar (factura, certificado, etc.)
 * @returns {Promise<Object>} - Resultado de la generación del PDF
 */
const generarPDF = async (data, tipo) => {
  try {
    // Validar los datos requeridos
    if (!data) {
      throw new Error('Los datos son obligatorios para generar el PDF');
    }
    
    if (!tipo) {
      throw new Error('El tipo de documento es obligatorio para generar el PDF');
    }

    // Construir la URL de la Azure Function según el tipo de documento
    const baseUrl = process.env.AZURE_PDF_FUNCTION_URL;
    if (!baseUrl) {
      throw new Error('La URL de la Azure Function no está configurada');
    }

    const url = `${baseUrl}/${tipo}`;

    // Realizar la solicitud a la Azure Function
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'x-functions-key': process.env.AZURE_PDF_FUNCTION_KEY
      },
      responseType: 'arraybuffer' // Para recibir el PDF como un array de bytes
    });

    // Verificar si la respuesta es correcta
    if (response.status !== 200) {
      throw new Error(`Error al generar el PDF: ${response.statusText}`);
    }

    // Convertir el PDF a base64 para devolverlo
    const pdfBase64 = Buffer.from(response.data).toString('base64');

    return {
      success: true,
      pdfBase64,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      filename: `${tipo}_${Date.now()}.pdf`
    };
  } catch (error) {
    console.error('Error en el servicio de generación de PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Genera un PDF de factura
 * @param {Object} datosFactura - Datos de la factura
 * @returns {Promise<Object>} - Resultado de la generación del PDF
 */
const generarFacturaPDF = async (datosFactura) => {
  return await generarPDF(datosFactura, 'factura');
};

/**
 * Genera un PDF de certificado
 * @param {Object} datosCertificado - Datos del certificado
 * @returns {Promise<Object>} - Resultado de la generación del PDF
 */
const generarCertificadoPDF = async (datosCertificado) => {
  return await generarPDF(datosCertificado, 'certificado');
};

/**
 * Genera un PDF de declaración jurada
 * @param {Object} datosDeclaracion - Datos de la declaración jurada
 * @returns {Promise<Object>} - Resultado de la generación del PDF
 */
const generarDeclaracionJuradaPDF = async (datosDeclaracion) => {
  return await generarPDF(datosDeclaracion, 'declaracion-jurada');
};

/**
 * Genera un PDF de informe
 * @param {Object} datosInforme - Datos del informe
 * @returns {Promise<Object>} - Resultado de la generación del PDF
 */
const generarInformePDF = async (datosInforme) => {
  return await generarPDF(datosInforme, 'informe');
};

/**
 * Verifica la conexión con la Azure Function
 * @returns {Promise<Object>} - Resultado de la verificación
 */
const verificarConexion = async () => {
  try {
    const baseUrl = process.env.AZURE_PDF_FUNCTION_URL;
    if (!baseUrl) {
      throw new Error('La URL de la Azure Function no está configurada');
    }

    // Realizar una solicitud de prueba a la Azure Function
    const response = await axios.get(`${baseUrl}/health`, {
      headers: {
        'x-functions-key': process.env.AZURE_PDF_FUNCTION_KEY
      }
    });

    if (response.status === 200) {
      return {
        success: true,
        message: 'Conexión con Azure Function establecida correctamente'
      };
    } else {
      throw new Error(`Error al verificar la conexión: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error al verificar la conexión con Azure Function:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generarPDF,
  generarFacturaPDF,
  generarCertificadoPDF,
  generarDeclaracionJuradaPDF,
  generarInformePDF,
  verificarConexion
}; 