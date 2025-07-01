const { scheduleTask } = require('../cron.service');
const { logInfo } = require('../../utils/logger');
const createDatabaseBackup = require('./backup.job');
const notificarCursosVencimiento = require('./curso-vencimiento.job');

/**
 * Configura e inicia todas las tareas programadas
 */
const initJobs = () => {
  logInfo('Inicializando tareas programadas...');

  // Backup diario de la base de datos a las 2AM
  scheduleTask(
    'db-backup-diario',
    '0 2 * * *', // Cron: a las 2:00 AM todos los días
    createDatabaseBackup,
    {
      timezone: 'America/Santiago',
      onError: (error) => {
        // Acciones adicionales en caso de error, como notificar a administradores
      }
    }
  );

  // Notificación de cursos por vencer (cada día a las 8 AM)
  scheduleTask(
    'notificar-cursos-vencimiento',
    '0 8 * * *', // Cron: a las 8:00 AM todos los días
    notificarCursosVencimiento,
    {
      timezone: 'America/Santiago'
    }
  );

  // Cron para generar reportes mensuales (primer día del mes a las 1 AM)
  scheduleTask(
    'generar-reportes-mensuales',
    '0 1 1 * *', // Cron: a la 1:00 AM el primer día de cada mes
    async () => {
      logInfo('Generando reportes mensuales...');
      // Esta función debe implementarse según los reportes necesarios
      // Ejemplo: await reportService.generarReportesMensuales();
    },
    {
      timezone: 'America/Santiago'
    }
  );

  // Cron para actualizar tipos de cambio (cada día a las 7 AM)
  scheduleTask(
    'actualizar-tipos-cambio',
    '0 7 * * 1-5', // Cron: a las 7:00 AM de lunes a viernes
    async () => {
      logInfo('Actualizando tipos de cambio...');
      // Esta función debe implementarse, posiblemente consultando una API externa
      // Ejemplo: await finanzasService.actualizarTiposCambio();
    },
    {
      timezone: 'America/Santiago'
    }
  );

  // Cron para sincronizar códigos SENCE (cada día a las 5 AM)
  scheduleTask(
    'sincronizar-codigos-sence',
    '0 5 * * *', // Cron: a las 5:00 AM todos los días
    async () => {
      logInfo('Sincronizando códigos SENCE...');
      // Esta función debe implementarse según la integración con SENCE
      // Ejemplo: await senceService.sincronizarCodigos();
    },
    {
      timezone: 'America/Santiago'
    }
  );

  // Cron para limpiar archivos temporales (cada domingo a las 3 AM)
  scheduleTask(
    'limpiar-archivos-temporales',
    '0 3 * * 0', // Cron: a las 3:00 AM cada domingo
    async () => {
      logInfo('Limpiando archivos temporales...');
      // Esta función debe implementarse para eliminar archivos temporales
      // Ejemplo: await storageService.limpiarTemporales();
    },
    {
      timezone: 'America/Santiago'
    }
  );

  logInfo('Tareas programadas inicializadas correctamente');
};

module.exports = {
  initJobs
}; 