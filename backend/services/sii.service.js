const { SiiIngreso, SiiEgreso, Proyecto, sequelize } = require('../models');
const { Op } = require('sequelize');
const xml2js = require('xml2js');

/**
 * Servicio para manejo de Documentos Tributarios Electrónicos (DTE) del SII
 */
class SiiService {

  /**
   * Extrae el valor de un elemento XML parseado por xml2js
   * @param {any} xmlValue - Valor del XML (puede ser string, objeto o null)
   * @returns {string|null} Valor extraído como string o null
   */
  static extractXmlValue(xmlValue) {
    if (!xmlValue) return null;
    if (typeof xmlValue === 'string') return xmlValue.trim();
    if (typeof xmlValue === 'object' && xmlValue._) return xmlValue._.trim();
    return null;
  }

  /**
   * Extrae y parsea un número de un elemento XML
   * @param {any} xmlValue - Valor del XML
   * @returns {number|null} Número parseado o null
   */
  static extractXmlNumber(xmlValue) {
    const value = SiiService.extractXmlValue(xmlValue);
    if (!value) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Extrae y parsea un entero de un elemento XML
   * @param {any} xmlValue - Valor del XML
   * @returns {number|null} Entero parseado o null
   */
  static extractXmlInt(xmlValue) {
    const value = SiiService.extractXmlValue(xmlValue);
    if (!value) return null;
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Sincronizar ingresos desde SII
   * @param {Object} credentials - Credenciales del SII
   * @param {string} credentials.rut - RUT sin puntos ni guión
   * @param {string} credentials.clave - Clave del SII
   * @param {number} credentials.proyecto_id - ID del proyecto (opcional)
   * @returns {Object} Resultado de la sincronización
   */
  async sincronizarIngresosSii(credentials) {
    const transaction = await sequelize.transaction();

    try {
      const { rut, clave, proyecto_id } = credentials;

      if (!rut || !clave) {
        throw new Error('Parámetros requeridos: rut y clave');
      }

      console.log('Iniciando sincronización SII para ingresos con credenciales proporcionadas');

    // 1. Llamar al servicio de scraping SII para ingresos
    const fetch = (await import('node-fetch')).default;
    const scrapingResponse = await fetch('https://scraper-sii-773544359782.southamerica-west1.run.app/scrape-sii', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rut: rut,
        clave: clave
      })
    });

      if (!scrapingResponse.ok) {
        throw new Error(`Error en el servicio de scraping: ${scrapingResponse.status} ${scrapingResponse.statusText}`);
      }

      const xmlData = await scrapingResponse.text();
      console.log('XML de ingresos recibido del servicio de scraping');
      console.log('Primeros 500 caracteres del XML:', xmlData.substring(0, 500));

      // Validar que la respuesta sea XML
      if (!xmlData.trim().startsWith('<?xml') && !xmlData.trim().startsWith('<')) {
        throw new Error(`La respuesta del servicio no es XML válido. Respuesta: ${xmlData.substring(0, 200)}...`);
      }

      // 2. Parsear el XML con opciones más permisivas
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        explicitCharkey: true,
        normalize: true,
        normalizeTags: false,
        trim: true
      });

      let parsedXml;
      try {
        parsedXml = await parser.parseStringPromise(xmlData);
        console.log('XML de ingresos parseado exitosamente');
      } catch (parseError) {
        console.error('Error al parsear XML de ingresos:', parseError.message);
        console.error('Contenido problemático del XML:', xmlData.substring(0, 1000));
        throw new Error(`Error al parsear XML: ${parseError.message}. Verifica que el servicio de scraping esté devolviendo XML válido.`);
      }

      // 3. Extraer documentos del XML
      const documentos = [];

      if (parsedXml.SetDTE && parsedXml.SetDTE.DTE) {
        const dteArray = Array.isArray(parsedXml.SetDTE.DTE) ? parsedXml.SetDTE.DTE : [parsedXml.SetDTE.DTE];

        for (const dte of dteArray) {
          if (dte.Documento && dte.Documento.Encabezado) {
            documentos.push(dte.Documento);
          }
        }
      }

      console.log(`Encontrados ${documentos.length} documentos de ingresos en el XML`);

      // 4. Procesar y guardar cada documento
      let nuevosRegistros = 0;
      let actualizados = 0;
      const errores = [];

      for (const documento of documentos) {
        try {
          const encabezado = documento.Encabezado;
          const idDoc = encabezado.IdDoc;
          const emisor = encabezado.Emisor;
          const receptor = encabezado.Receptor;
          const totales = encabezado.Totales;

          // Extraer valores del XML usando las funciones helper
          const tipoDte = SiiService.extractXmlValue(idDoc.TipoDTE);
          const folio = SiiService.extractXmlInt(idDoc.Folio);

          // Validar que tenemos los campos requeridos
          if (!tipoDte || !folio) {
            console.warn(`Documento omitido: tipo_dte=${tipoDte}, folio=${folio}`);
            continue;
          }

          // EXCLUIR monto_total_signed ya que es GENERATED ALWAYS en PostgreSQL
          const datosIngreso = {
            proyecto_id: proyecto_id || null,
            tipo_dte: tipoDte,
            folio: folio,
            fecha_emision: idDoc.FchEmis ? new Date(SiiService.extractXmlValue(idDoc.FchEmis)) : null,
            fecha_venc: null,
            cliente_rut: SiiService.extractXmlValue(receptor.RUTRecep),
            cliente_nombre: SiiService.extractXmlValue(receptor.RznSocRecep),
            emisor_rut: SiiService.extractXmlValue(emisor.RUTEmisor),
            emisor_nombre: SiiService.extractXmlValue(emisor.RznSoc),
            monto_neto: SiiService.extractXmlNumber(totales.MntNeto) || 0,
            monto_exento: SiiService.extractXmlNumber(totales.MntExe) || 0,
            iva: SiiService.extractXmlNumber(totales.IVA) || 0,
            tasa_iva: SiiService.extractXmlNumber(totales.TasaIVA) || 19.00,
            monto_total: SiiService.extractXmlNumber(totales.MntTotal) || 0,
            estado_sii: 'ACEPTADO',
            url_xml: null,
            url_pdf: null,
            ref_tipo_dte: null,
            ref_folio: null,
            ref_fecha: null,
            ref_cod: null,
            ref_razon: null,
            digest_xml: null,
            source_filename: tipoDte && folio ? `DTE_${tipoDte}_${folio}.xml` : `DTE_UNKNOWN.xml`
            // monto_total_signed se calcula automáticamente por PostgreSQL (GENERATED ALWAYS)
          };

          // Verificar si ya existe un registro con el mismo tipo_dte y folio
          try {
            const registroExistente = await SiiIngreso.findOne({
              where: { tipo_dte: datosIngreso.tipo_dte, folio: datosIngreso.folio },
              transaction
            });

            if (registroExistente) {
              await registroExistente.update(datosIngreso, { transaction });
              actualizados++;
            } else {
              await SiiIngreso.create(datosIngreso, { transaction });
              nuevosRegistros++;
            }
          } catch (dbError) {
            console.error(`Error en BD para documento ${datosIngreso.tipo_dte}-${datosIngreso.folio}:`, dbError.message);
            errores.push({
              documento: `${tipoDte}-${folio}`,
              error: `Error de base de datos: ${dbError.message}`
            });
            // Continuamos con el siguiente documento sin abortar la transacción
          }

        } catch (docError) {
          console.error('Error procesando documento de ingreso:', docError);
          errores.push({
            documento: `${tipoDte || 'N/A'}-${folio || 'N/A'}`,
            error: docError.message
          });
        }
      }

      await transaction.commit();

      console.log(`Sincronización de ingresos completada: ${nuevosRegistros} nuevos, ${actualizados} actualizados, ${errores.length} errores`);

      return {
        message: 'Sincronización SII de ingresos completada exitosamente',
        nuevosRegistros,
        actualizados,
        errores,
        totalDocumentos: documentos.length
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Error en SiiService.sincronizarIngresosSii:', error);
      throw error;
    }
  }

  /**
   * Sincronizar egresos desde SII
   * @param {Object} credentials - Credenciales del SII
   * @param {string} credentials.rut - RUT sin puntos ni guión
   * @param {string} credentials.clave - Clave del SII
   * @param {number} credentials.proyecto_id - ID del proyecto (opcional)
   * @returns {Object} Resultado de la sincronización
   */
  async sincronizarEgresosSii(credentials) {
    const transaction = await sequelize.transaction();

    try {
      const { rut, clave, proyecto_id } = credentials;

      if (!rut || !clave) {
        throw new Error('Parámetros requeridos: rut y clave');
      }

      console.log('Iniciando sincronización SII para egresos con credenciales proporcionadas');

    // 1. Llamar al servicio de scraping SII para egresos
    const fetch = (await import('node-fetch')).default;
    const scrapingResponse = await fetch('https://scraper-sii-773544359782.southamerica-west1.run.app/scrape-sii-option1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rut: rut,
        clave: clave
      })
    });

      if (!scrapingResponse.ok) {
        throw new Error(`Error en el servicio de scraping: ${scrapingResponse.status} ${scrapingResponse.statusText}`);
      }

      const xmlData = await scrapingResponse.text();
      console.log('XML de egresos recibido del servicio de scraping');
      console.log('Primeros 500 caracteres del XML:', xmlData.substring(0, 500));

      // Validar que la respuesta sea XML
      if (!xmlData.trim().startsWith('<?xml') && !xmlData.trim().startsWith('<')) {
        throw new Error(`La respuesta del servicio no es XML válido. Respuesta: ${xmlData.substring(0, 200)}...`);
      }

      // 2. Parsear el XML con opciones más permisivas
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        explicitCharkey: true,
        normalize: true,
        normalizeTags: false,
        trim: true
      });

      let parsedXml;
      try {
        parsedXml = await parser.parseStringPromise(xmlData);
        console.log('XML de egresos parseado exitosamente');
      } catch (parseError) {
        console.error('Error al parsear XML de egresos:', parseError.message);
        console.error('Contenido problemático del XML:', xmlData.substring(0, 1000));
        throw new Error(`Error al parsear XML: ${parseError.message}. Verifica que el servicio de scraping esté devolviendo XML válido.`);
      }

      // 3. Extraer documentos del XML
      const documentos = [];

      if (parsedXml.SetDTE && parsedXml.SetDTE.DTE) {
        const dteArray = Array.isArray(parsedXml.SetDTE.DTE) ? parsedXml.SetDTE.DTE : [parsedXml.SetDTE.DTE];

        for (const dte of dteArray) {
          if (dte.Documento && dte.Documento.Encabezado) {
            documentos.push(dte.Documento);
          }
        }
      }

      console.log(`Encontrados ${documentos.length} documentos de egresos en el XML`);

      // 4. Procesar y guardar cada documento
      let nuevosRegistros = 0;
      let actualizados = 0;
      const errores = [];

      for (const documento of documentos) {
        try {
          const encabezado = documento.Encabezado;
          const idDoc = encabezado.IdDoc;
          const emisor = encabezado.Emisor;
          const receptor = encabezado.Receptor;
          const totales = encabezado.Totales;

          // Extraer valores del XML usando las funciones helper
          const tipoDteEgreso = SiiService.extractXmlValue(idDoc.TipoDTE);
          const folioEgreso = SiiService.extractXmlInt(idDoc.Folio);

          // Validar que tenemos los campos requeridos
          if (!tipoDteEgreso || !folioEgreso) {
            console.warn(`Documento de egreso omitido: tipo_dte=${tipoDteEgreso}, folio=${folioEgreso}`);
            continue;
          }

          // EXCLUIR monto_total_signed ya que es GENERATED ALWAYS en PostgreSQL
          const datosEgreso = {
            proyecto_id: proyecto_id || null,
            tipo_dte: tipoDteEgreso,
            folio: folioEgreso,
            fecha_emision: idDoc.FchEmis ? new Date(SiiService.extractXmlValue(idDoc.FchEmis)) : null,
            fecha_venc: null,
            proveedor_rut: SiiService.extractXmlValue(emisor.RUTEmisor),
            proveedor_nombre: SiiService.extractXmlValue(emisor.RznSoc),
            receptor_rut: SiiService.extractXmlValue(receptor.RUTRecep),
            receptor_nombre: SiiService.extractXmlValue(receptor.RznSocRecep),
            monto_neto: SiiService.extractXmlNumber(totales.MntNeto) || 0,
            monto_exento: SiiService.extractXmlNumber(totales.MntExe) || 0,
            iva: SiiService.extractXmlNumber(totales.IVA) || 0,
            tasa_iva: SiiService.extractXmlNumber(totales.TasaIVA) || 19.00,
            monto_total: SiiService.extractXmlNumber(totales.MntTotal) || 0,
            estado_sii: 'ACEPTADO',
            url_xml: null,
            url_pdf: null,
            ref_tipo_dte: null,
            ref_folio: null,
            ref_fecha: null,
            ref_cod: null,
            ref_razon: null,
            digest_xml: null,
            source_filename: tipoDteEgreso && folioEgreso ? `DTE_${tipoDteEgreso}_${folioEgreso}_EGRESO.xml` : `DTE_UNKNOWN_EGRESO.xml`
            // monto_total_signed se calcula automáticamente por PostgreSQL (GENERATED ALWAYS)
          };

          // Verificar si ya existe un registro con el mismo tipo_dte y folio
          try {
            const registroExistente = await SiiEgreso.findOne({
              where: { tipo_dte: datosEgreso.tipo_dte, folio: datosEgreso.folio },
              transaction
            });

            if (registroExistente) {
              await registroExistente.update(datosEgreso, { transaction });
              actualizados++;
            } else {
              await SiiEgreso.create(datosEgreso, { transaction });
              nuevosRegistros++;
            }
          } catch (dbError) {
            console.error(`Error en BD para documento de egreso ${datosEgreso.tipo_dte}-${datosEgreso.folio}:`, dbError.message);
            errores.push({
              documento: `${tipoDteEgreso}-${folioEgreso}`,
              error: `Error de base de datos: ${dbError.message}`
            });
            // Continuamos con el siguiente documento sin abortar la transacción
          }

        } catch (docError) {
          console.error('Error procesando documento de egreso:', docError);
          errores.push({
            documento: `${tipoDteEgreso || 'N/A'}-${folioEgreso || 'N/A'}`,
            error: docError.message
          });
        }
      }

      await transaction.commit();

      console.log(`Sincronización de egresos completada: ${nuevosRegistros} nuevos, ${actualizados} actualizados, ${errores.length} errores`);

      return {
        message: 'Sincronización SII de egresos completada exitosamente',
        nuevosRegistros,
        actualizados,
        errores,
        totalDocumentos: documentos.length
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Error en SiiService.sincronizarEgresosSii:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de ingresos SII
   * @param {Object} filtros - Filtros opcionales
   * @returns {Object} Estadísticas de ingresos
   */
  async getEstadisticasIngresos(filtros = {}) {
    try {
      const { fechaInicio, fechaFin, proyecto_id } = filtros;

      const whereClause = {};
      if (fechaInicio && fechaFin) {
        whereClause.fecha_emision = {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        };
      }
      if (proyecto_id) {
        whereClause.proyecto_id = proyecto_id;
      }

      const estadisticas = await SiiIngreso.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_documentos'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'total_monto'],
          [sequelize.fn('AVG', sequelize.col('monto_total')), 'monto_promedio'],
          [sequelize.fn('MAX', sequelize.col('monto_total')), 'monto_maximo'],
          [sequelize.fn('MIN', sequelize.col('monto_total')), 'monto_minimo']
        ],
        raw: true
      });

      return estadisticas[0] || {
        total_documentos: 0,
        total_monto: 0,
        monto_promedio: 0,
        monto_maximo: 0,
        monto_minimo: 0
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas de ingresos SII:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de egresos SII
   * @param {Object} filtros - Filtros opcionales
   * @returns {Object} Estadísticas de egresos
   */
  async getEstadisticasEgresos(filtros = {}) {
    try {
      const { fechaInicio, fechaFin, proyecto_id } = filtros;

      const whereClause = {};
      if (fechaInicio && fechaFin) {
        whereClause.fecha_emision = {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        };
      }
      if (proyecto_id) {
        whereClause.proyecto_id = proyecto_id;
      }

      const estadisticas = await SiiEgreso.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_documentos'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'total_monto'],
          [sequelize.fn('AVG', sequelize.col('monto_total')), 'monto_promedio'],
          [sequelize.fn('MAX', sequelize.col('monto_total')), 'monto_maximo'],
          [sequelize.fn('MIN', sequelize.col('monto_total')), 'monto_minimo']
        ],
        raw: true
      });

      return estadisticas[0] || {
        total_documentos: 0,
        total_monto: 0,
        monto_promedio: 0,
        monto_maximo: 0,
        monto_minimo: 0
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas de egresos SII:', error);
      throw error;
    }
  }
}

module.exports = new SiiService();
