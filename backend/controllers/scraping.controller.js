const senceService = require('../services/sence.service');
const { DeclaracionJurada, Curso } = require('../models');

/**
 * Almacenamiento en memoria del estado de scraping por cursoId
 * En producción, esto debería estar en Redis o una base de datos
 */
const scrapingStatus = {};

/**
 * Mapeo de estados de declaraciones juradas
 */
const mapEstado = (estadoSence) => {
  const estadoMap = {
    'Aprobado': 'Aprobado',
    'Enviada': 'Enviada',
    'Pendiente': 'Pendiente',
    'Rechazado': 'Rechazado',
    'En Revisión': 'En Revisión'
  };
  return estadoMap[estadoSence] || 'Pendiente';
};

/**
 * Endpoint que recibe cookies de la extensión y ejecuta scraping
 * @route POST /api/scraping/start-with-auth
 */
exports.startScrapingWithAuth = async (req, res) => {
  try {
    console.log('[Scraping Controller] Recibida solicitud con cookies de extensión');
    
    // Extraer datos del request
    const { cookies, scraperData, timestamp } = req.body;
    
    // Validación básica de cookies
    if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
      console.error('[Scraping Controller] No se proporcionaron cookies válidas');
      return res.status(400).json({
        success: false,
        error: 'No se proporcionaron cookies válidas'
      });
    }
    
    // Modo test: Si no hay scraperData completo, solo validar cookies (para pruebas)
    const isTestMode = !scraperData || !scraperData.otec || !scraperData.djtype || !scraperData.input_data;
    
    if (isTestMode) {
      console.log('[Scraping Controller] ⚠️ MODO TEST: Solo validando cookies (sin datos de curso)');
      console.log(`[Scraping Controller] ${cookies.length} cookies recibidas en modo test`);
      
      // Validar que al menos tengamos la cookie de sesión de SENCE
      const aspNetCookie = cookies.find(c => c.name === 'ASP.NET_SessionId' && c.domain.includes('lce.sence.cl'));
      
      if (!aspNetCookie) {
        return res.status(400).json({
          success: false,
          error: 'No se encontró la cookie ASP.NET_SessionId de lce.sence.cl'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Cookies validadas correctamente (modo test)',
        cookiesCount: cookies.length,
        sessionCookie: {
          name: aspNetCookie.name,
          domain: aspNetCookie.domain,
          value: aspNetCookie.value.substring(0, 10) + '...' // Solo mostrar primeros caracteres
        },
        note: 'Para ejecutar scraping real, abre SENCE desde el botón "Sincronizar" en el ERP'
      });
    }
    
    console.log(`[Scraping Controller] ${cookies.length} cookies recibidas`);
    console.log(`[Scraping Controller] Datos: OTEC=${scraperData.otec}, DJ Type=${scraperData.djtype}, Cursos=${scraperData.input_data?.length || 0}`);
    
    // Generar ID de sesión para tracking
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Si hay un cursoId en scraperData, marcar como en progreso
    if (scraperData.cursoId) {
      scrapingStatus[scraperData.cursoId] = {
        status: 'en_progreso',
        startedAt: new Date(),
        sessionId
      };
    }
    
    try {
      // Llamar al servicio de SENCE con cookies
      console.log('[Scraping Controller] Llamando a Azure Function con cookies...');
      const result = await senceService.obtenerDeclaracionesConCookies({
        cookies: cookies,
        otec: scraperData.otec,
        djtype: scraperData.djtype,
        input_data: scraperData.input_data,
        email: scraperData.email,
        user_id: scraperData.user_id
      });
      
      console.log('[Scraping Controller] Azure Function respondió:', result.status);
      
      // Procesar resultados si fue exitoso
      if (result.status === 'success' && result.data && Array.isArray(result.data)) {
        console.log(`[Scraping Controller] ${result.data.length} registros recibidos`);
        
        // Guardar declaraciones en la base de datos
        for (const item of result.data) {
          if (item.data && Array.isArray(item.data)) {
            for (const dj of item.data) {
              try {
                const [declaracionExistente, creada] = await DeclaracionJurada.findOrCreate({
                  where: { 
                    id_sence: String(dj.codigo_curso),
                    rut: dj.RUT
                  },
                  defaults: {
                    nombre: dj.Nombre,
                    sesiones: dj.Sesiones,
                    estado: mapEstado(dj.Estado_Declaracion_Jurada)
                  }
                });

                if (!creada) {
                  // Actualizar si ya existía
                  await declaracionExistente.update({
                    nombre: dj.Nombre,
                    sesiones: dj.Sesiones,
                    estado: mapEstado(dj.Estado_Declaracion_Jurada)
                  });
                }
              } catch (dbError) {
                console.error('[Scraping Controller] Error al guardar declaración:', dbError);
                // Continuar con los demás registros
              }
            }
          }
        }
        
        // Actualizar estado de sincronización
        if (scraperData.cursoId) {
          scrapingStatus[scraperData.cursoId] = {
            status: 'completado',
            finishedAt: new Date(),
            sessionId,
            recordCount: result.data.reduce((acc, item) => acc + (item.data?.length || 0), 0)
          };
        }
        
        // Responder al cliente
        return res.json({
          success: true,
          sessionId: sessionId,
          status: 'completed',
          recordCount: result.data.reduce((acc, item) => acc + (item.data?.length || 0), 0),
          message: 'Scraping completado exitosamente',
          data: result.data
        });
      } else {
        throw new Error(result.message || 'Error desconocido en scraping');
      }
      
    } catch (scrapingError) {
      console.error('[Scraping Controller] Error en scraping:', scrapingError);
      
      // Actualizar estado de error
      if (scraperData.cursoId) {
        scrapingStatus[scraperData.cursoId] = {
          status: 'error',
          error: scrapingError.message,
          finishedAt: new Date(),
          sessionId
        };
      }
      
      throw scrapingError;
    }
    
  } catch (error) {
    console.error('[Scraping Controller] Error general:', error);
    console.error('[Scraping Controller] Stack trace:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Obtener el estado de scraping de un curso
 * @route GET /api/scraping/status/:cursoId
 */
exports.getScrapingStatus = (req, res) => {
  try {
    const { cursoId } = req.params;
    
    if (!scrapingStatus[cursoId]) {
      return res.json({
        success: true,
        status: 'idle',
        message: 'No hay sincronización en progreso'
      });
    }
    
    return res.json({
      success: true,
      ...scrapingStatus[cursoId]
    });
  } catch (error) {
    console.error('[Scraping Controller] Error al obtener estado:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  startScrapingWithAuth: exports.startScrapingWithAuth,
  getScrapingStatus: exports.getScrapingStatus,
  scrapingStatus // Exportar para uso en otros controladores
};

