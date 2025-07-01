const axios = require('axios');

/**
 * Servicio para interactuar con la API de SENCE a través de Azure Functions
 */
class SenceService {
  constructor() {
    this.apiUrl = process.env.AZURE_FUNCTION_URL || 'https://api-sence-function.azurewebsites.net/api/declaraciones-juradas';
    this.defaultUsername = process.env.SENCE_DEFAULT_USERNAME;
    this.defaultPassword = process.env.SENCE_DEFAULT_PASSWORD;
    this.defaultEmail = process.env.SENCE_DEFAULT_EMAIL;
    this.defaultOtec = process.env.SENCE_DEFAULT_OTEC;
  }

  /**
   * Obtener declaraciones juradas desde SENCE
   * @param {Object} params - Parámetros para la consulta
   * @param {string} params.username - RUT de persona autorizada en SENCE sin puntos ni guiones
   * @param {string} params.password - Clave única para iniciar sesión
   * @param {string} params.email - Correo electrónico para recibir CSV
   * @param {string} params.otec - RUT del OTEC sin dígito verificador
   * @param {string} params.djtype - Tipo de declaración jurada
   * @param {Array<string>} params.input_data - Array de IDs SENCE
   * @returns {Promise<Object>} - Respuesta de la API
   */
  async obtenerDeclaracionesJuradas(params) {
    try {
      const requestData = {
        login_data: {
          username: params.username || this.defaultUsername,
          password: params.password || this.defaultPassword
        },
        email: params.email || this.defaultEmail,
        otec: params.otec || this.defaultOtec,
        djtype: params.djtype || 'Emitir Declaración Jurada – E-learning',
        input_data: params.input_data || []
      };

      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error al obtener declaraciones juradas de SENCE:', error);
      throw new Error(`Error al comunicarse con la API de SENCE: ${error.message}`);
    }
  }

  /**
   * Obtener declaraciones juradas por código de curso
   * @param {Object} params - Parámetros para la consulta
   * @param {string} params.username - RUT de persona autorizada en SENCE
   * @param {string} params.password - Clave única para iniciar sesión
   * @param {string} params.email - Correo electrónico para recibir CSV
   * @param {string} params.otec - RUT del OTEC sin dígito verificador
   * @param {string} params.djtype - Tipo de declaración jurada
   * @param {string} params.codigo_curso - Código SENCE del curso
   * @returns {Promise<Object>} - Respuesta de la API filtrada por código de curso
   */
  async obtenerDeclaracionesPorCurso(params) {
    try {
      // Si no se proporciona un código de curso, lanzar error
      if (!params.codigo_curso) {
        throw new Error('Debe proporcionar un código de curso SENCE');
      }

      // Obtener todas las declaraciones juradas
      const response = await this.obtenerDeclaracionesJuradas({
        username: params.username,
        password: params.password,
        email: params.email,
        otec: params.otec,
        djtype: params.djtype,
        input_data: [params.codigo_curso] // Filtrar directamente en la solicitud
      });

      // Verificar si hay datos en la respuesta
      if (!response || !response[0] || !response[0].data) {
        return { status: 'success', data: [] };
      }

      // Filtrar los resultados por código de curso
      const declaracionesFiltradas = response[0].data.filter(
        declaracion => declaracion.codigo_curso === params.codigo_curso
      );

      return {
        status: response[0].status,
        data: declaracionesFiltradas
      };
    } catch (error) {
      console.error('Error al obtener declaraciones juradas por curso:', error);
      throw new Error(`Error al obtener declaraciones juradas por curso: ${error.message}`);
    }
  }
}

module.exports = new SenceService(); 