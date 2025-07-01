const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { logInfo, logError } = require('../../utils/logger');
const { sequelize } = require('../../models');

// Directorio donde se guardarán las copias de seguridad
const backupDir = path.join(__dirname, '../../backups');

// Crear directorio de backups si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Realiza una copia de seguridad de la base de datos
 * @returns {Promise<string>} - Ruta al archivo de backup creado
 */
const createDatabaseBackup = async () => {
  try {
    // Obtener la fecha y hora actual para el nombre del archivo
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);
    
    // Obtener configuración de la base de datos desde sequelize
    const { database, username, password, host, port } = sequelize.config;
    
    // Comando pg_dump para PostgreSQL
    const dumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -F c -b -v -f "${backupFilePath}" ${database}`;
    
    // Ejecutar comando
    return new Promise((resolve, reject) => {
      exec(dumpCommand, { env: { ...process.env, PGPASSWORD: password } }, (error, stdout, stderr) => {
        if (error) {
          logError(`Error al crear backup: ${error.message}`);
          return reject(error);
        }
        
        logInfo(`Backup creado exitosamente: ${backupFilePath}`);
        
        // Limpiar backups antiguos (mantener solo los últimos 7)
        cleanOldBackups(7);
        
        resolve(backupFilePath);
      });
    });
  } catch (error) {
    logError('Error al crear backup de la base de datos', error);
    throw error;
  }
};

/**
 * Limpia backups antiguos manteniendo solo los más recientes
 * @param {number} keepLatest - Número de backups recientes a mantener
 */
const cleanOldBackups = (keepLatest = 7) => {
  try {
    // Obtener todos los archivos de backup
    fs.readdir(backupDir, (err, files) => {
      if (err) {
        logError('Error al leer directorio de backups', err);
        return;
      }
      
      // Filtrar solo los archivos que comienzan con 'backup-'
      const backupFiles = files
        .filter(file => file.startsWith('backup-'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Ordenar por fecha (más reciente primero)
      
      // Eliminar backups antiguos
      if (backupFiles.length > keepLatest) {
        backupFiles.slice(keepLatest).forEach(file => {
          fs.unlink(file.path, err => {
            if (err) {
              logError(`Error al eliminar backup antiguo ${file.name}`, err);
            } else {
              logInfo(`Backup antiguo eliminado: ${file.name}`);
            }
          });
        });
      }
    });
  } catch (error) {
    logError('Error al limpiar backups antiguos', error);
  }
};

// Exportar función de backup
module.exports = createDatabaseBackup; 