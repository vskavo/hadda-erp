// Archivo de depuración para encontrar problemas en el servidor
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Variables globales para debugging
const DEBUG_LOG = path.join(__dirname, 'debug.log');

// Función para escribir en el log de depuración
const writeDebugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}\n`;
  
  if (data) {
    if (typeof data === 'object') {
      try {
        logMessage += JSON.stringify(data, null, 2) + '\n';
      } catch (e) {
        logMessage += `[Error al serializar]: ${e.message}\n`;
      }
    } else {
      logMessage += data + '\n';
    }
  }
  
  fs.appendFileSync(DEBUG_LOG, logMessage);
  console.log(message);
};

// Iniciar depuración
writeDebugLog('Iniciando depuración del servidor...');

// 1. Prueba de carga de variables de entorno
writeDebugLog('1. Variables de entorno cargadas:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  PORT: process.env.PORT
});

// 2. Prueba de conexión a la base de datos
writeDebugLog('2. Intentando conectar a la base de datos...');
try {
  const { sequelize } = require('./models');
  
  sequelize.authenticate()
    .then(() => {
      writeDebugLog('Conexión a la base de datos establecida correctamente.');
      
      // 3. Verificar controladores y rutas
      writeDebugLog('3. Verificando controladores y rutas...');
      
      try {
        // Verificar auth.controller.js
        const authController = require('./controllers/auth.controller');
        writeDebugLog('Controlador de autenticación cargado:', Object.keys(authController));
        
        // Verificar rutas
        const authRoutes = require('./routes/auth.routes');
        writeDebugLog('Rutas de autenticación cargadas');
        
        // 4. Intentar iniciar Express
        writeDebugLog('4. Intentando iniciar Express...');
        try {
          const express = require('express');
          const app = express();
          
          // Middleware básico
          app.use(express.json());
          
          // Ruta simple para probar
          app.get('/test', (req, res) => {
            res.json({ message: 'Prueba exitosa' });
          });
          
          // Iniciar en un puerto diferente para no interferir con el servidor principal
          const PORT = 5001;
          app.listen(PORT, () => {
            writeDebugLog(`Servidor Express iniciado en puerto ${PORT}`);
            
            // Paso 5: Probar a importar todas las rutas
            writeDebugLog('5. Importando todas las rutas...');
            try {
              const apiRoutes = require('./routes/index');
              writeDebugLog('Todas las rutas importadas correctamente');
            } catch (routesError) {
              writeDebugLog('Error al importar todas las rutas:', routesError);
              // Mostrar el mensaje del error
              writeDebugLog('Mensaje de error:', routesError.message);
              
              // Mostrar la causa específica si es un error de módulo no encontrado
              if (routesError.code === 'MODULE_NOT_FOUND') {
                const errorMessage = routesError.message;
                const moduleMatch = errorMessage.match(/Cannot find module '([^']+)'/);
                if (moduleMatch && moduleMatch[1]) {
                  writeDebugLog('Módulo no encontrado:', moduleMatch[1]);
                }
              }
            }
          });
        } catch (expressError) {
          writeDebugLog('Error al iniciar Express:', expressError);
        }
        
      } catch (routeError) {
        writeDebugLog('Error al cargar controladores o rutas:', routeError);
      }
    })
    .catch(error => {
      writeDebugLog('Error al conectar a la base de datos:', error);
    });
} catch (error) {
  writeDebugLog('Error al cargar modelos:', error);
} 