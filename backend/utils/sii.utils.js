const xml2js = require('xml2js');

/**
 * Utilidades para el procesamiento de Documentos Tributarios Electrónicos del SII
 */
class SiiUtils {

  /**
   * Parsear XML de respuesta del servicio de scraping SII
   * @param {string} xmlData - Datos XML en formato string
   * @returns {Promise<Object>} Objeto JavaScript con datos parseados
   */
  static async parseXmlSii(xmlData) {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        explicitCharkey: true,
        trim: true,
        normalize: true,
        normalizeTags: false
      });

      const result = await parser.parseStringPromise(xmlData);
      return result;
    } catch (error) {
      console.error('Error parseando XML del SII:', error);
      throw new Error(`Error al parsear XML del SII: ${error.message}`);
    }
  }

  /**
   * Extraer documentos de un SetDTE
   * @param {Object} setDTE - Objeto SetDTE parseado
   * @returns {Array} Array de documentos DTE
   */
  static extractDocumentosFromSetDTE(setDTE) {
    const documentos = [];

    if (!setDTE || !setDTE.DTE) {
      return documentos;
    }

    // Manejar tanto arrays como objetos únicos
    const dteArray = Array.isArray(setDTE.DTE) ? setDTE.DTE : [setDTE.DTE];

    for (const dte of dteArray) {
      if (dte.Documento && dte.Documento.Encabezado) {
        documentos.push(dte.Documento);
      }
    }

    return documentos;
  }

  /**
   * Validar estructura básica de un documento DTE
   * @param {Object} documento - Documento DTE a validar
   * @returns {boolean} true si es válido, false si no
   */
  static validarDocumentoDTE(documento) {
    try {
      if (!documento) return false;
      if (!documento.Encabezado) return false;
      if (!documento.Encabezado.IdDoc) return false;
      if (!documento.Encabezado.IdDoc.TipoDTE) return false;
      if (!documento.Encabezado.IdDoc.Folio) return false;
      if (!documento.Encabezado.IdDoc.FchEmis) return false;

      return true;
    } catch (error) {
      console.error('Error validando documento DTE:', error);
      return false;
    }
  }

  /**
   * Formatear fecha del SII (YYYY-MM-DD) a objeto Date de JavaScript
   * @param {string} fechaSii - Fecha en formato YYYY-MM-DD
   * @returns {Date|null} Objeto Date o null si es inválida
   */
  static parseFechaSii(fechaSii) {
    if (!fechaSii) return null;

    try {
      const fecha = new Date(fechaSii);
      if (isNaN(fecha.getTime())) {
        console.warn(`Fecha inválida del SII: ${fechaSii}`);
        return null;
      }
      return fecha;
    } catch (error) {
      console.warn(`Error parseando fecha del SII: ${fechaSii}`, error);
      return null;
    }
  }

  /**
   * Parsear monto del SII a número flotante
   * @param {string|number} montoSii - Monto a parsear
   * @returns {number} Monto parseado o 0 si es inválido
   */
  static parseMontoSii(montoSii) {
    if (!montoSii) return 0;

    try {
      const monto = parseFloat(montoSii);
      return isNaN(monto) ? 0 : monto;
    } catch (error) {
      console.warn(`Error parseando monto del SII: ${montoSii}`, error);
      return 0;
    }
  }

  /**
   * Parsear folio del SII a número entero
   * @param {string|number} folioSii - Folio a parsear
   * @returns {number|null} Folio parseado o null si es inválido
   */
  static parseFolioSii(folioSii) {
    if (!folioSii) return null;

    try {
      const folio = parseInt(folioSii);
      return isNaN(folio) ? null : folio;
    } catch (error) {
      console.warn(`Error parseando folio del SII: ${folioSii}`, error);
      return null;
    }
  }

  /**
   * Generar nombre de archivo fuente para un documento DTE
   * @param {string} tipoDTE - Tipo de DTE
   * @param {number} folio - Número de folio
   * @param {string} tipo - 'INGRESO' o 'EGRESO'
   * @returns {string} Nombre del archivo fuente
   */
  static generarNombreArchivoFuente(tipoDTE, folio, tipo = '') {
    const sufijo = tipo ? `_${tipo}` : '';
    return `DTE_${tipoDTE}_${folio}${sufijo}.xml`;
  }

  /**
   * Determinar el estado del documento basado en la información disponible
   * @param {Object} documento - Documento DTE
   * @returns {string} Estado del documento
   */
  static determinarEstadoDocumento(documento) {
    // Por defecto asumimos ACEPTADO si no hay información de rechazo
    // En implementaciones futuras se puede mejorar con más lógica
    return 'ACEPTADO';
  }

  /**
   * Limpiar y sanitizar datos del SII
   * @param {Object} datos - Datos a limpiar
   * @returns {Object} Datos limpios
   */
  static limpiarDatosSii(datos) {
    const datosLimpios = {};

    for (const [key, value] of Object.entries(datos)) {
      if (typeof value === 'string') {
        // Limpiar espacios en blanco al inicio y final
        datosLimpios[key] = value.trim();
      } else {
        datosLimpios[key] = value;
      }
    }

    return datosLimpios;
  }

  /**
   * Obtener información de resumen de documentos procesados
   * @param {Array} resultados - Array de resultados de procesamiento
   * @returns {Object} Resumen con estadísticas
   */
  static generarResumenProcesamiento(resultados) {
    const resumen = {
      totalDocumentos: resultados.length,
      exitosos: 0,
      errores: 0,
      nuevos: 0,
      actualizados: 0,
      erroresDetallados: []
    };

    for (const resultado of resultados) {
      if (resultado.error) {
        resumen.errores++;
        resumen.erroresDetallados.push(resultado);
      } else {
        resumen.exitosos++;
        if (resultado.accion === 'creado') {
          resumen.nuevos++;
        } else if (resultado.accion === 'actualizado') {
          resumen.actualizados++;
        }
      }
    }

    return resumen;
  }

  /**
   * Validar credenciales del SII
   * @param {Object} credentials - Credenciales a validar
   * @returns {Object} Resultado de validación
   */
  static validarCredencialesSii(credentials) {
    const { rut, clave } = credentials;
    const errores = [];

    if (!rut) {
      errores.push('El RUT es requerido');
    } else if (!/^\d{8,9}$/.test(rut.replace(/[.-]/g, ''))) {
      errores.push('El RUT tiene un formato inválido');
    }

    if (!clave) {
      errores.push('La clave es requerida');
    } else if (clave.length < 6) {
      errores.push('La clave debe tener al menos 6 caracteres');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }
}

module.exports = SiiUtils;
