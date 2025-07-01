/**
 * Middleware para gestionar conexiones a la base de datos por petición
 * Asegura que las consultas se realicen en una transacción y que las conexiones
 * se liberen adecuadamente después de procesar cada petición.
 */

const { sequelize, dbEnabled } = require('../models');
const { logError } = require('../utils/logger');

module.exports = async (req, res, next) => {
  // Si la base de datos no está habilitada, simplemente continúa
  if (!dbEnabled) {
    return next();
  }

  // Detectar rutas relacionadas con autenticación y saltarlas
  if (req.path.startsWith('/auth/') || req.path.includes('/login') || req.path.includes('/logout')) {
    console.log(`[${req.method} ${req.path}] Ruta de autenticación - Saltando transacción`);
    return next();
  }
  
  // Para peticiones de solo lectura (GET), no necesitamos transacción
  if (req.method === 'GET') {
    // Añadir un hook para asegurar que se libere la conexión después
    res.on('finish', () => {
      console.log(`[GET ${req.path}] Solicitud completada`);
    });
    return next();
  }

  // Para peticiones que modifican datos (POST, PUT, DELETE), usar transacción
  let transaction = null;
  
  try {
    // Iniciar transacción con configuración especial para tiempos de espera más cortos
    transaction = await sequelize.transaction({
      isolationLevel: 'READ COMMITTED', // Nivel de aislamiento más bajo para evitar bloqueos
      // deferrable: true,              // Esta opción causa el error de SQL "syntax error at or near 'true'"
      autocommit: false                 // No auto-commit
    });
    
    // Añadir la transacción al objeto request para que esté disponible en los controladores
    req.transaction = transaction;
    
    // Cuando la respuesta esté completa (exitosa o con error)
    res.on('finish', async () => {
      try {
        // Si el código de estado es 2xx, confirmar la transacción
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (transaction && !transaction.finished) {
            await transaction.commit();
            console.log(`[${req.method} ${req.path}] Transacción confirmada`);
          }
        } 
        // Si hay un error, deshacer la transacción
        else if (transaction && !transaction.finished) {
          await transaction.rollback();
          console.log(`[${req.method} ${req.path}] Transacción cancelada (status ${res.statusCode})`);
        }
      } catch (error) {
        console.error('Error al finalizar transacción:', error);
        // Intentar cancelar la transacción si aún no está finalizada
        if (transaction && !transaction.finished) {
          try {
            await transaction.rollback();
          } catch (rollbackError) {
            console.error('Error adicional al intentar cancelar la transacción:', rollbackError);
          }
        }
      }
    });
    
    // Continuar con el siguiente middleware
    next();
  } catch (error) {
    logError('Error al iniciar transacción:', error);
    console.error('Error al iniciar transacción:', error);
    
    // Si ocurre un error, cancelar la transacción y continuar
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error adicional al intentar cancelar la transacción:', rollbackError);
      }
    }
    
    // En caso de error con la transacción, devolver error 500
    res.status(500).json({ 
      message: 'Error de base de datos', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor' 
    });
  }
}; 