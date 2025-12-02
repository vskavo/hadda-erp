const senceService = require('../services/sence.service');
const { DeclaracionJurada, Curso } = require('../models');

/**
 * Almacenamiento en memoria del estado de scraping por cursoId
 * En producción, esto debería estar en Redis o una base de datos
 */
const scrapingStatus = {};

/**
 * 🆕 Almacenamiento de sesiones de sincronización pendientes
 * Clave: syncId (UUID)
 * Valor: { cursoId, otec, djtype, input_data, email, user_id, timestamp, erpOrigin }
 * TTL: 10 minutos (se limpia automáticamente)
 */
const pendingSyncSessions = {};
const SYNC_SESSION_TTL = 10 * 60 * 1000; // 10 minutos en ms

/**
 * Limpia sesiones de sincronización expiradas
 */
function cleanExpiredSessions() {
  const now = Date.now();
  let cleaned = 0;
  for (const syncId in pendingSyncSessions) {
    if (now - pendingSyncSessions[syncId].timestamp > SYNC_SESSION_TTL) {
      delete pendingSyncSessions[syncId];
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[Scraping Controller] 🧹 ${cleaned} sesiones expiradas limpiadas`);
  }
}

// Limpiar cada 2 minutos
setInterval(cleanExpiredSessions, 2 * 60 * 1000);

/**
 * 🆕 Endpoint para preparar una sesión de sincronización
 * El frontend envía los datos del curso ANTES de abrir la ventana de SENCE
 * @route POST /api/scraping/prepare-sync
 */
exports.prepareSync = async (req, res) => {
  try {
    console.log('[Scraping Controller] 📋 Preparando sesión de sincronización...');
    
    const { cursoId, otec, djtype, input_data, email, user_id, erpOrigin } = req.body;
    
    // Validar datos requeridos
    if (!otec || !djtype || !input_data) {
      console.error('[Scraping Controller] ❌ Datos incompletos para prepare-sync');
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos. Se requiere: otec, djtype, input_data'
      });
    }
    
    // Generar ID de sesión único
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Guardar datos en memoria
    pendingSyncSessions[syncId] = {
      cursoId,
      otec,
      djtype,
      input_data,
      email,
      user_id,
      erpOrigin: erpOrigin || req.headers.origin,
      timestamp: Date.now()
    };
    
    console.log('[Scraping Controller] ✅ Sesión de sincronización creada:', syncId);
    console.log('[Scraping Controller] 📦 Datos guardados:');
    console.log('[Scraping Controller]   - cursoId:', cursoId);
    console.log('[Scraping Controller]   - otec:', otec);
    console.log('[Scraping Controller]   - djtype:', djtype);
    console.log('[Scraping Controller]   - input_data:', input_data);
    console.log('[Scraping Controller]   - erpOrigin:', pendingSyncSessions[syncId].erpOrigin);
    
    // Responder con el syncId
    return res.json({
      success: true,
      syncId: syncId,
      message: 'Sesión de sincronización preparada. Abre SENCE para continuar.',
      expiresIn: SYNC_SESSION_TTL / 1000, // en segundos
      senceUrl: `https://lce.sence.cl/CertificadoAsistencia/?syncId=${syncId}`
    });
    
  } catch (error) {
    console.error('[Scraping Controller] ❌ Error en prepare-sync:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

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
    
    // 🆕 NUEVO: Buscar datos por syncId si no vienen completos
    let finalScraperData = scraperData || {};
    
    // Si hay syncId, buscar los datos de la sesión pendiente
    const syncId = scraperData?.syncId || req.body.syncId;
    if (syncId && pendingSyncSessions[syncId]) {
      console.log('[Scraping Controller] 🔗 syncId encontrado:', syncId);
      console.log('[Scraping Controller] 📦 Recuperando datos de sesión pendiente...');
      
      const sessionData = pendingSyncSessions[syncId];
      
      // Combinar datos de la sesión con los que vengan en scraperData
      finalScraperData = {
        ...finalScraperData,
        cursoId: sessionData.cursoId,
        otec: sessionData.otec,
        djtype: sessionData.djtype,
        input_data: sessionData.input_data,
        email: sessionData.email,
        user_id: sessionData.user_id,
        erpOrigin: sessionData.erpOrigin
      };
      
      console.log('[Scraping Controller] ✅ Datos combinados:');
      console.log('[Scraping Controller]   - otec:', finalScraperData.otec);
      console.log('[Scraping Controller]   - djtype:', finalScraperData.djtype);
      console.log('[Scraping Controller]   - input_data:', finalScraperData.input_data);
      console.log('[Scraping Controller]   - cursoId:', finalScraperData.cursoId);
      
      // Eliminar la sesión pendiente (ya se usó)
      delete pendingSyncSessions[syncId];
      console.log('[Scraping Controller] 🗑️ Sesión pendiente eliminada');
    }
    
    // Modo test: Si no hay datos completos, solo validar cookies
    const isTestMode = !finalScraperData.otec || !finalScraperData.djtype || !finalScraperData.input_data;
    
    if (isTestMode) {
      console.log('[Scraping Controller] ⚠️ MODO TEST: Solo validando cookies (sin datos de curso)');
      console.log(`[Scraping Controller] ${cookies.length} cookies recibidas en modo test`);
      
      if (syncId) {
        console.log('[Scraping Controller] ⚠️ syncId proporcionado pero no se encontraron datos pendientes');
        console.log('[Scraping Controller] ⚠️ Posibles causas: sesión expirada o syncId inválido');
      }
      
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
          value: aspNetCookie.value.substring(0, 10) + '...'
        },
        note: syncId 
          ? 'syncId proporcionado pero no se encontraron datos. La sesión pudo haber expirado (TTL: 10 min).'
          : 'Para ejecutar scraping real, abre SENCE desde el botón "Sincronizar" en el ERP'
      });
    }
    
    console.log(`[Scraping Controller] ${cookies.length} cookies recibidas`);
    console.log(`[Scraping Controller] Datos: OTEC=${finalScraperData.otec}, DJ Type=${finalScraperData.djtype}, Cursos=${finalScraperData.input_data?.length || 0}`);
    
    // Generar ID de sesión para tracking
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Si hay un cursoId, marcar como en progreso
    if (finalScraperData.cursoId) {
      scrapingStatus[finalScraperData.cursoId] = {
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
        otec: finalScraperData.otec,
        djtype: finalScraperData.djtype,
        input_data: finalScraperData.input_data,
        email: finalScraperData.email,
        user_id: finalScraperData.user_id
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
        if (finalScraperData.cursoId) {
          scrapingStatus[finalScraperData.cursoId] = {
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
      if (finalScraperData.cursoId) {
        scrapingStatus[finalScraperData.cursoId] = {
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
  prepareSync: exports.prepareSync,
  startScrapingWithAuth: exports.startScrapingWithAuth,
  getScrapingStatus: exports.getScrapingStatus,
  scrapingStatus, // Exportar para uso en otros controladores
  pendingSyncSessions // Exportar para debugging
};

