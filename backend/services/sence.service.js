const axios = require('axios');

/**
 * Servicio para interactuar con la API de SENCE a través de Azure Functions
 */
class SenceService {
  constructor() {
    // Usar la variable de entorno correcta del sistema
    this.apiUrl = process.env.DECLARACIONES_JURADAS_SYNC_URL || process.env.AZURE_FUNCTION_URL || 'https://api-sence-function.azurewebsites.net/api/declaraciones-juradas';
    this.defaultUsername = process.env.SENCE_DEFAULT_USERNAME;
    this.defaultPassword = process.env.SENCE_DEFAULT_PASSWORD;
    this.defaultEmail = process.env.SENCE_DEFAULT_EMAIL;
    this.defaultOtec = process.env.SENCE_DEFAULT_OTEC;
    
    // Log para debugging
    if (this.apiUrl) {
      console.log('[SenceService] URL de Azure Function configurada:', this.apiUrl);
    } else {
      console.warn('[SenceService] ⚠️ NO hay URL de Azure Function configurada');
    }
  }

  /**
   * Obtener declaraciones juradas desde SENCE
   * @param {Object} params - Parámetros para la consulta
   * @param {string} params.username - RUT del OTEC completo con dígito verificador
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

  /**
   * Obtener declaraciones juradas usando cookies de sesión (sin credenciales)
   * Este método se usa cuando la extensión de Chrome captura las cookies de autenticación
   * @param {Object} params - Parámetros para la consulta
   * @param {Array} params.cookies - Array de cookies capturadas por la extensión
   * @param {string} params.otec - RUT del OTEC sin dígito verificador
   * @param {string} params.djtype - Tipo de declaración jurada (número o texto)
   * @param {Array<string>} params.input_data - Array de IDs SENCE
   * @param {string} params.email - Correo electrónico (opcional)
   * @param {string} params.user_id - ID de usuario (opcional)
   * @returns {Promise<Object>} - Respuesta de la API con las declaraciones juradas
   */
  async obtenerDeclaracionesConCookies(params) {
    try {
      console.log('[SenceService] Llamando a Azure Function con cookies...');
      console.log('[SenceService] URL destino:', this.apiUrl);
      
      // Validar que hay URL configurada
      if (!this.apiUrl) {
        throw new Error('No hay URL de Azure Function configurada. Verifica DECLARACIONES_JURADAS_SYNC_URL en .env');
      }
      
      const requestData = {
        cookies: params.cookies,
        otec: params.otec || this.defaultOtec,
        djtype: params.djtype || 'Emitir Declaración Jurada – E-learning',
        input_data: params.input_data || [],
        email: params.email || this.defaultEmail,
        user_id: params.user_id
        // NO incluir login_data cuando usamos cookies
      };

      console.log(`[SenceService] Enviando ${params.cookies.length} cookies a Azure Function`);
      console.log(`[SenceService] OTEC: ${requestData.otec}, DJ Type: ${requestData.djtype}, Cursos: ${requestData.input_data.length}`);
      console.log('[SenceService] Payload completo:', JSON.stringify({
        ...requestData,
        cookies: `[${requestData.cookies.length} cookies]` // No logear cookies completas
      }));

      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutos de timeout
      });

      console.log('[SenceService] Respuesta de Azure Function recibida:', response.data?.status);
      console.log('[SenceService] Respuesta completa:', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('[SenceService] Error al obtener declaraciones juradas con cookies:', error);
      
      // Mejorar el mensaje de error
      if (error.response) {
        throw new Error(`Error de Azure Function (${error.response.status}): ${error.response.data?.message || error.message}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout: El scraping tomó demasiado tiempo. Inténtelo nuevamente.');
      } else {
        throw new Error(`Error al comunicarse con Azure Function: ${error.message}`);
      }
    }
  }
}

module.exports = new SenceService(); 