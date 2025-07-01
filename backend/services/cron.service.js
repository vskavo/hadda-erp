const cron = require('node-cron');
const { logInfo, logError, logWarning } = require('../utils/logger');

// Objeto para almacenar todas las tareas programadas
const scheduledTasks = {};

/**
 * Registra y programa una nueva tarea cron
 * @param {string} taskName - Nombre único de la tarea
 * @param {string} schedule - Expresión cron (ej: '0 0 * * *' para ejecutar cada día a medianoche)
 * @param {Function} taskFunction - Función a ejecutar
 * @param {Object} options - Opciones adicionales
 * @returns {boolean} - true si la tarea se programó correctamente
 */
const scheduleTask = (taskName, schedule, taskFunction, options = {}) => {
  try {
    // Validar la expresión cron
    if (!cron.validate(schedule)) {
      logError(`Expresión cron inválida para la tarea ${taskName}: ${schedule}`);
      return false;
    }
    
    // Si ya existe una tarea con ese nombre, detenerla primero
    if (scheduledTasks[taskName]) {
      stopTask(taskName);
    }
    
    // Wrapper para la función de la tarea que agrega logging
    const wrappedTaskFunction = async () => {
      const startTime = Date.now();
      logInfo(`Iniciando tarea programada: ${taskName}`);
      
      try {
        await taskFunction();
        const duration = Date.now() - startTime;
        logInfo(`Tarea programada ${taskName} completada en ${duration}ms`);
      } catch (error) {
        logError(`Error en tarea programada ${taskName}`, error);
        
        // Si hay un callback de error, ejecutarlo
        if (options.onError && typeof options.onError === 'function') {
          options.onError(error);
        }
      }
    };
    
    // Programar la tarea
    const task = cron.schedule(schedule, wrappedTaskFunction, {
      scheduled: true,
      timezone: options.timezone || 'America/Santiago' // Timezone por defecto para Chile
    });
    
    // Almacenar la tarea programada
    scheduledTasks[taskName] = {
      task,
      schedule,
      options,
      status: 'active',
      createdAt: new Date()
    };
    
    logInfo(`Tarea programada registrada: ${taskName} con horario ${schedule}`);
    return true;
  } catch (error) {
    logError(`Error al programar tarea ${taskName}`, error);
    return false;
  }
};

/**
 * Detiene una tarea programada
 * @param {string} taskName - Nombre de la tarea a detener
 * @returns {boolean} - true si la tarea se detuvo correctamente
 */
const stopTask = (taskName) => {
  try {
    if (scheduledTasks[taskName]) {
      scheduledTasks[taskName].task.stop();
      scheduledTasks[taskName].status = 'stopped';
      logInfo(`Tarea programada detenida: ${taskName}`);
      return true;
    } else {
      logWarning(`Intento de detener tarea inexistente: ${taskName}`);
      return false;
    }
  } catch (error) {
    logError(`Error al detener tarea ${taskName}`, error);
    return false;
  }
};

/**
 * Inicia una tarea que estaba detenida
 * @param {string} taskName - Nombre de la tarea a iniciar
 * @returns {boolean} - true si la tarea se inició correctamente
 */
const startTask = (taskName) => {
  try {
    if (scheduledTasks[taskName]) {
      if (scheduledTasks[taskName].status === 'stopped') {
        scheduledTasks[taskName].task.start();
        scheduledTasks[taskName].status = 'active';
        logInfo(`Tarea programada iniciada: ${taskName}`);
        return true;
      } else {
        logWarning(`La tarea ${taskName} ya está en ejecución`);
        return false;
      }
    } else {
      logWarning(`Intento de iniciar tarea inexistente: ${taskName}`);
      return false;
    }
  } catch (error) {
    logError(`Error al iniciar tarea ${taskName}`, error);
    return false;
  }
};

/**
 * Obtiene información sobre todas las tareas programadas
 * @returns {Object} - Objeto con información de todas las tareas
 */
const getAllTasks = () => {
  const tasks = {};
  
  Object.keys(scheduledTasks).forEach(taskName => {
    const { schedule, status, createdAt, options } = scheduledTasks[taskName];
    tasks[taskName] = {
      schedule,
      status,
      createdAt,
      timezone: options.timezone || 'America/Santiago'
    };
  });
  
  return tasks;
};

module.exports = {
  scheduleTask,
  stopTask,
  startTask,
  getAllTasks
}; 