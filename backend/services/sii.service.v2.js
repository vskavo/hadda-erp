// Versión alternativa del servicio SII con manejo más robusto de respuestas
const { SiiIngreso, SiiEgreso, Proyecto, sequelize } = require('../models');
const { Op } = require('sequelize');

class SiiServiceV2 {

  // Método para intentar parsear XML con diferentes estrategias
  async parseXmlSafely(xmlText, tipo = 'ingresos') {
    console.log(`🔍 Intentando parsear XML de ${tipo}...`);

    // Estrategia 1: Verificar si es XML válido
    if (!xmlText.trim().startsWith('<?xml') && !xmlText.trim().startsWith('<')) {
      throw new Error(`La respuesta no es XML válido para ${tipo}. Contenido: ${xmlText.substring(0, 200)}`);
    }

    // Estrategia 2: Intentar con configuración estándar
    try {
      const xml2js = require('xml2js');
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        explicitCharkey: true,
        normalize: true,
        normalizeTags: false,
        trim: true
      });

      return await parser.parseStringPromise(xmlText);
    } catch (error1) {
      console.warn(`⚠️ Primera estrategia falló: ${error1.message}`);

      // Estrategia 3: Intentar con configuración más permisiva
      try {
        const xml2js = require('xml2js');
        const parser = new xml2js.Parser({
          explicitArray: false,
          ignoreAttrs: true, // Ignorar atributos problemáticos
          explicitCharkey: false,
          normalize: true,
          normalizeTags: false,
          trim: true,
          strict: false // Modo no estricto
        });

        return await parser.parseStringPromise(xmlText);
      } catch (error2) {
        console.error(`❌ Todas las estrategias de parsing fallaron para ${tipo}`);
        console.error('Contenido problemático:', xmlText.substring(0, 1000));
        throw new Error(`No se pudo parsear el XML de ${tipo}: ${error2.message}`);
      }
    }
  }

  async sincronizarIngresosSii(credentials) {
    const transaction = await sequelize.transaction();

    try {
      const { rut, clave, proyecto_id } = credentials;

      if (!rut || !clave) {
        throw new Error('Parámetros requeridos: rut y clave');
      }

      console.log('Iniciando sincronización SII para ingresos con credenciales proporcionadas');

      // 1. Llamar al servicio de scraping
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

      // 2. Parsear el XML con método seguro
      const parsedXml = await this.parseXmlSafely(xmlData, 'ingresos');
      console.log('XML de ingresos parseado exitosamente');

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
          const tipoDte = this.extractXmlValue(idDoc.TipoDTE);
          const folio = this.extractXmlInt(idDoc.Folio);

          // Validar que tenemos los campos requeridos
          if (!tipoDte || !folio) {
            console.warn(`Documento omitido: tipo_dte=${tipoDte}, folio=${folio}`);
            continue;
          }

          const datosIngreso = {
            proyecto_id: proyecto_id || null,
            tipo_dte: tipoDte,
            folio: folio,
            fecha_emision: idDoc.FchEmis ? new Date(this.extractXmlValue(idDoc.FchEmis)) : null,
            fecha_venc: null,
            cliente_rut: this.extractXmlValue(receptor.RUTRecep),
            cliente_nombre: this.extractXmlValue(receptor.RznSocRecep),
            emisor_rut: this.extractXmlValue(emisor.RUTEmisor),
            emisor_nombre: this.extractXmlValue(emisor.RznSoc),
            monto_neto: this.extractXmlNumber(totales.MntNeto) || 0,
            monto_exento: this.extractXmlNumber(totales.MntExe) || 0,
            iva: this.extractXmlNumber(totales.IVA) || 0,
            tasa_iva: this.extractXmlNumber(totales.TasaIVA) || 19.00,
            monto_total: this.extractXmlNumber(totales.MntTotal) || 0,
            estado_sii: 'ACEPTADO',
            url_xml: null,
            url_pdf: null,
            ref_tipo_dte: null,
            ref_folio: null,
            ref_fecha: null,
            ref_cod: null,
            ref_razon: null,
            digest_xml: null,
            source_filename: tipoDte && folio ? `DTE_${tipoDte}_${folio}.xml` : `DTE_UNKNOWN.xml`,
            monto_total_signed: this.extractXmlNumber(totales.MntTotal) || null
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
            console.error(`Error en BD para documento ${tipoDte}-${folio}:`, dbError.message);
            errores.push({
              documento: `${tipoDte}-${folio}`,
              error: `Error de base de datos: ${dbError.message}`
            });
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
      console.error('Error en SiiServiceV2.sincronizarIngresosSii:', error);
      throw error;
    }
  }

  // Funciones helper para extraer valores del XML
  static extractXmlValue(xmlValue) {
    if (!xmlValue) return null;
    if (typeof xmlValue === 'string') return xmlValue.trim();
    if (typeof xmlValue === 'object' && xmlValue._) return xmlValue._.trim();
    return null;
  }

  static extractXmlNumber(xmlValue) {
    const value = SiiServiceV2.extractXmlValue(xmlValue);
    if (!value) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  static extractXmlInt(xmlValue) {
    const value = SiiServiceV2.extractXmlValue(xmlValue);
    if (!value) return null;
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  }

  // Alias para mantener compatibilidad
  extractXmlValue(xmlValue) {
    return SiiServiceV2.extractXmlValue(xmlValue);
  }

  extractXmlNumber(xmlValue) {
    return SiiServiceV2.extractXmlNumber(xmlValue);
  }

  extractXmlInt(xmlValue) {
    return SiiServiceV2.extractXmlInt(xmlValue);
  }
}

module.exports = new SiiServiceV2();
