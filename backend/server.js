require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, closeConnections } = require('./models');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

// Importar middlewares de seguridad
const securityMiddleware = require('./middlewares/security.middleware');
const { globalLimiter } = require('./middlewares/rateLimit.middleware');
const { monitorMiddleware, errorMonitorMiddleware } = require('./middlewares/monitor.middleware');
const { httpLoggerMiddleware } = require('./utils/logger');
const { logInfo, logError } = require('./utils/logger');
const dbConnectionMiddleware = require('./middlewares/db-connection.middleware');

// Importar servicios
const { initJobs } = require('./services/jobs');

// Importar helper de PostgreSQL para ENUM
const { createPostgresEnums } = require('./utils/postgresEnumHelper');

const app = express();

// Verificar si estamos en modo simulado o con base de datos real
console.log('========== VERIFICACIÓN DE CONEXIÓN ==========');
console.log(`DB_ENABLED en .env: ${process.env.DB_ENABLED}`);
console.log(`dbEnabled en runtime: ${require('./models').dbEnabled}`);
if (require('./models').dbEnabled) {
  console.log('Modo: BASE DE DATOS REAL - Usando conexión real a PostgreSQL');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
} else {
  console.log('Modo: SIMULADO - NO se están guardando datos en la base de datos');
  console.log('ADVERTENCIA: Todos los datos son temporales y se perderán al reiniciar');
}
console.log('=============================================');

// Configurar Express para confiar en los proxies (necesario para express-rate-limit)
app.set('trust proxy', 1);

// Middleware de logging HTTP
app.use(httpLoggerMiddleware);

// Middleware de monitoreo
app.use(monitorMiddleware);

// Middlewares de seguridad
app.use(securityMiddleware); // Helmet para protección XSS y otras vulnerabilidades
app.use(globalLimiter); // Rate limiting global

// Middlewares estándar
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser()); // Para gestionar cookies
app.use(express.json({ limit: '10mb' })); // Limitar tamaño del payload
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos del frontend desde la carpeta '../frontend/build' relativa a este archivo
app.use(express.static(path.join(__dirname, '../frontend/build')));

// DESACTIVAMOS temporalmente el middleware de transacciones automáticas que causa problemas
// app.use(dbConnectionMiddleware); // Middleware para gestionar conexiones a la BD
console.log('Middleware de transacciones automáticas DESACTIVADO para evitar errores.');

// Rutas
try {
  // Ruta de diagnóstico para verificar que Express está funcionando
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString()
    });
  });
  
  // Cargar las rutas completas con controladores reales
  const apiRoutes = require('./routes/index');
  app.use('/api', apiRoutes);
  
  // Verificar si se cargaron las rutas de autenticación
  if (apiRoutes.stack) {
    console.log('Rutas cargadas:');
    const authRoutes = apiRoutes.stack
      .filter(r => r.route && r.route.path)
      .map(r => `/api${r.route.path}`);
    console.log(authRoutes);
  }
  
  // Ruta de prueba
  app.get('/', (req, res) => {
    res.json({ message: 'API de Hadda - ERP funcionando correctamente' });
  });
  
  logInfo('Rutas completas cargadas correctamente');
  console.log('Rutas completas cargadas correctamente');
} catch (error) {
  console.error('Error al cargar las rutas:', error);
  logError('Error al cargar las rutas:', error);
  
  // En caso de error, cargar rutas básicas como respaldo
  try {
    const apiBasicRoutes = require('./routes/indexBasic');
    app.use('/api', apiBasicRoutes);
    logInfo('Rutas básicas cargadas como respaldo');
    console.log('Rutas básicas cargadas como respaldo');
  } catch (fallbackError) {
    console.error('Error crítico al cargar las rutas básicas:', fallbackError);
    logError('Error crítico al cargar las rutas básicas:', fallbackError);
  }
}

// Manejo de rutas del cliente (React Router)
// CUALQUIER solicitud GET que no haya sido manejada por las rutas de API o los archivos estáticos anteriores
// debería devolver el index.html de la aplicación React.
// Esto debe ir DESPUÉS de tus rutas API y ANTES de tu middleware 404.
app.get('*', (req, res, next) => {
  // Solo procesar si la solicitud no es para la API para evitar conflictos
  // y si la solicitud acepta HTML (para no interferir con solicitudes de assets que podrían fallar)
  if (!req.originalUrl.startsWith('/api') && req.accepts('html')) {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'), (err) => {
      if (err) {
        // Si index.html no se encuentra por alguna razón, pasa al siguiente manejador (404)
        next(err);
      }
    });
  } else {
    // Si es una ruta API no encontrada o no acepta HTML, dejar que el siguiente middleware la maneje
    next(); 
  }
});

// Middleware para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de monitoreo de errores
app.use(errorMonitorMiddleware);

// Manejo de errores
app.use((err, req, res, next) => {
  logError('Error interno del servidor', err);
  
  // No exponer detalles sensibles en producción
  const errorMessage = process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor';
  const errorDetails = process.env.NODE_ENV === 'development' ? err.stack : {};
  
  res.status(500).json({
    message: errorMessage,
    error: errorDetails
  });
});

process.on('uncaughtException', async (error) => {
  logError('Error no capturado:', error);
  console.error('ERROR NO CAPTURADO:', error);
  fs.writeFileSync('error.log', `${new Date().toISOString()} - ${error.message}\n${error.stack}\n\n`, { flag: 'a' });
  
  // Cerrar conexiones antes de terminar
  console.log('Cerrando conexiones debido a error no capturado...');
  await closeConnections();
  
  // Si el error es crítico, podemos decidir finalizar el proceso
  // process.exit(1);
});

// Capturar errores específicos de conexión a PostgreSQL
const handleDBConnectionError = (error) => {
  let errorMessage = 'Error de conexión a la base de datos:\n';
  
  if (error.original) {
    errorMessage += `Código: ${error.original.code}\n`;
    errorMessage += `Detalle: ${error.original.detail || 'No disponible'}\n`;
    
    // Errores comunes de PostgreSQL
    if (error.original.code === 'ECONNREFUSED') {
      errorMessage += 'La conexión fue rechazada. Verifica que PostgreSQL esté en ejecución y que la dirección y puerto sean correctos.\n';
    } else if (error.original.code === '28P01') {
      errorMessage += 'Autenticación fallida. Verifica el nombre de usuario y contraseña.\n';
    } else if (error.original.code === '3D000') {
      errorMessage += 'Base de datos no existe. Verifica el nombre de la base de datos.\n';
    }
  }
  
  console.error(errorMessage);
  fs.writeFileSync('db_error.log', `${new Date().toISOString()} - ${errorMessage}\n\n`, { flag: 'a' });
  return errorMessage;
};

// Sincronizar base de datos e iniciar servidor
const startServer = async () => {
  let server = null;
  
  try {
    console.log('Intentando conectar a la base de datos...');
    console.log(`Host: ${process.env.DB_HOST}, DB: ${process.env.DB_NAME}, User: ${process.env.DB_USER}`);
    logInfo('Intentando conectar a la base de datos...');
    logInfo(`Host: ${process.env.DB_HOST}, DB: ${process.env.DB_NAME}, User: ${process.env.DB_USER}`);
    
    let dbConnected = false;
    
    try {
      await sequelize.authenticate();
      logInfo('Conexión a la base de datos establecida correctamente.');
      console.log('Conexión a la base de datos establecida correctamente.');
      dbConnected = true;
    } catch (dbError) {
      console.error('ERROR AL CONECTAR:', dbError);
      logError('Error al conectar con la base de datos:', dbError);
      
      // Manejar error de conexión
      const errorDetails = handleDBConnectionError(dbError);
      
      logError(`Detalles de conexión: Host=${process.env.DB_HOST}, DB=${process.env.DB_NAME}, Usuario=${process.env.DB_USER}`);
      logError('Verifique sus credenciales y que la base de datos esté accesible.');
      console.error(`Detalles de conexión: Host=${process.env.DB_HOST}, DB=${process.env.DB_NAME}, Usuario=${process.env.DB_USER}`);
      console.error('Verifique sus credenciales y que la base de datos esté accesible.');
      console.warn('CONTINUANDO SIN BASE DE DATOS - Se usarán datos simulados');
      logInfo('CONTINUANDO SIN BASE DE DATOS - Se usarán datos simulados');
    }
    
    // Si hay conexión y estamos en desarrollo, crea los ENUM
    if (dbConnected && process.env.NODE_ENV === 'development') {
      try {
        console.log('Creando ENUM de PostgreSQL...');
        // Crear tipos ENUM para PostgreSQL
        await createPostgresEnums();
        logInfo('ENUM de PostgreSQL creados correctamente.');
        console.log('ENUM de PostgreSQL creados correctamente.');
      } catch (enumError) {
        console.error('ERROR EN ENUM:', enumError);
        logError('Error al crear los ENUM o sincronizar modelos:', enumError);
      }
    }
    
    // Iniciar servidor en el puerto especificado
    const PORT = process.env.PORT || 5000;
    
    // Configurar timeouts del servidor para evitar conexiones pendientes
    server = app.listen(PORT, () => {
      console.log(`Servidor iniciado en puerto ${PORT}`);
      logInfo(`Servidor iniciado en puerto ${PORT}`);
      
      if (process.env.ENABLE_CRON_JOBS === 'true') {
        initJobs();
        console.log('Trabajos programados iniciados');
        logInfo('Trabajos programados iniciados');
      } else {
        console.log('Trabajos programados desactivados');
        logInfo('Trabajos programados desactivados');
      }
    });
    
    // Configurar timeouts
    server.timeout = 120000; // 2 minutos de timeout para las solicitudes
    server.keepAliveTimeout = 65000; // Mantener conexiones abiertas por 65 segundos
    server.headersTimeout = 66000; // Timeout para headers ligeramente mayor
    
    // Manejar errores del servidor
    server.on('error', (err) => {
      console.error('Error en el servidor:', err);
      logError('Error en el servidor:', err);
      
      if (err.code === 'EADDRINUSE') {
        console.error(`El puerto ${PORT} ya está en uso. Intentando reiniciar...`);
        logError(`El puerto ${PORT} ya está en uso. Intentando reiniciar...`);
        
        // Esperar 10 segundos y reintentar
        setTimeout(() => {
          server.close();
          server = app.listen(PORT, () => {
            console.log(`Servidor reiniciado en puerto ${PORT}`);
            logInfo(`Servidor reiniciado en puerto ${PORT}`);
          });
        }, 10000);
      }
    });
    
    // Manejar señales de cierre
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    function gracefulShutdown() {
      console.log('Recibida señal de cierre. Cerrando servidor...');
      logInfo('Recibida señal de cierre. Cerrando servidor...');
      
      server.close(async () => {
        console.log('Servidor HTTP cerrado.');
        logInfo('Servidor HTTP cerrado.');
        
        // Cerrar conexiones a la base de datos
        await closeConnections();
        
        console.log('Proceso terminado.');
        logInfo('Proceso terminado.');
        process.exit(0);
      });
      
      // Si no cierra en 10 segundos, forzar cierre
      setTimeout(() => {
        console.error('Cierre forzado después de 10s');
        logError('Cierre forzado después de 10s');
        process.exit(1);
      }, 10000);
    }
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    logError('Error al iniciar el servidor:', error);
    
    // Reintentar en 5 segundos
    console.log('Reintentando en 5 segundos...');
    setTimeout(startServer, 5000);
  }
};

startServer();

// Manejador de errores global para mostrar errores que no se capturan
process.on('unhandledRejection', async (error) => {
  console.error('Error de promesa no capturado:', error);
  
  // Para errores graves de promesas no capturadas, también podemos cerrar conexiones
  if (error && (error.name === 'SequelizeConnectionError' || 
      error.name === 'SequelizeConnectionRefusedError' ||
      error.name === 'SequelizeHostNotFoundError' ||
      error.name === 'SequelizeConnectionTimedOutError')) {
    console.log('Cerrando conexiones debido a error de conexión...');
    await closeConnections();
  }
}); 