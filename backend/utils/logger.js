const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Formato personalizado para los logs
const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato personalizado para consola
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  if (stack) {
    // Si hay un stack trace (error), incluirlo en el log
    return `${timestamp} [${level}]: ${message}\n${stack}`;
  }
  return `${timestamp} [${level}]: ${message}`;
});

// Crear el logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  defaultMeta: { service: 'erp-otec' },
  transports: [
    // Escribir todos los logs con nivel 'error' o inferior a 'error.log'
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Escribir todos los logs con nivel 'info' o inferior a 'combined.log'
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5, 
    }),
  ],
  exceptionHandlers: [
    // Manejar excepciones no capturadas
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  rejectionHandlers: [
    // Manejar promesas rechazadas no capturadas
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// En desarrollo, también imprimir a la consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    )
  }));
}

// Métodos de uso común para facilitar su uso
const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

const logError = (message, error = null) => {
  if (error) {
    logger.error(`${message}: ${error.message}`, { 
      stack: error.stack,
      ...error
    });
  } else {
    logger.error(message);
  }
};

const logWarning = (message, meta = {}) => {
  logger.warn(message, meta);
};

const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

// Middleware para Express que registra las solicitudes HTTP
const httpLogger = require('morgan');

// Formato personalizado para morgan
const morganFormat = process.env.NODE_ENV === 'production'
  ? 'combined' // Apache combined log format
  : 'dev';     // Colorizado para desarrollo

// Stream para redirigir los logs de morgan a winston
const morganStream = {
  write: (message) => {
    // Eliminar el carácter de nueva línea al final
    const log = message.toString().trim();
    logger.http(log);
  }
};

module.exports = {
  logger,
  logInfo,
  logError,
  logWarning,
  logDebug,
  httpLoggerMiddleware: httpLogger(morganFormat, { stream: morganStream })
}; 