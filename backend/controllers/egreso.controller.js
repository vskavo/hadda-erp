const { Egreso, Proyecto, CuentaBancaria, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');
const EgresoService = require('../services/egreso.service'); // Importar el servicio

// Obtener todos los egresos con paginación y filtros
exports.findAll = async (req, res) => {
  try {
    const resultado = await EgresoService.getAllEgresos(req.query);
    res.status(200).json(resultado);
  } catch (error) {
    // El servicio ya debería loguear errores internos.
    // El controlador se encarga de la respuesta HTTP.
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error al obtener egresos';
    console.error(`Error en egreso.controller.js findAll: ${message}`, error); // Logueo específico del controlador
    res.status(statusCode).json({ message, error: error.name });
  }
};

// Obtener un egreso por ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const egreso = await EgresoService.getEgresoById(id);
    // El servicio ya maneja el error si no se encuentra
    res.status(200).json(egreso);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error al obtener egreso';
    console.error(`Error en egreso.controller.js findOne: ${message}`, error);
    res.status(statusCode).json({ message, error: error.name });
  }
};

// Crear un nuevo egreso
exports.create = async (req, res) => {
  try {
    const datosEgreso = req.body;
    // Asumir que req.usuario.id está disponible si es necesario como fallback
    const usuarioSolicitanteId = req.usuario ? req.usuario.id : null; 

    const nuevoEgreso = await EgresoService.crearEgreso(datosEgreso, usuarioSolicitanteId);
    
    res.status(201).json({
      message: 'Egreso registrado exitosamente',
      egreso: nuevoEgreso
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error al crear egreso';
    console.error(`Error en egreso.controller.js create: ${message}`, error);
    res.status(statusCode).json({ message, error: error.name });
  }
};

// Actualizar un egreso existente
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;
    const usuarioSolicitanteId = req.usuario ? req.usuario.id : null;

    const egresoActualizado = await EgresoService.actualizarEgreso(id, datosActualizacion, usuarioSolicitanteId);
    
    res.status(200).json({
      message: 'Egreso actualizado exitosamente',
      egreso: egresoActualizado
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error al actualizar egreso';
    console.error(`Error en egreso.controller.js update: ${message}`, error);
    res.status(statusCode).json({ message, error: error.name });
  }
};

// Anular un egreso (cambiar estado a 'anulado')
exports.anular = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const resultado = await EgresoService.anularEgreso(id, motivo);
    
    res.status(200).json(resultado);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error al anular egreso';
    console.error(`Error en egreso.controller.js anular: ${message}`, error);
    res.status(statusCode).json({ message, error: error.name });
  }
};

// Pagar un egreso pendiente
exports.pagar = async (req, res) => {
  try {
    const { id } = req.params;
    const datosPago = req.body; // { fecha_pago, cuenta_bancaria_id, metodo_pago }
    
    const egresoPagado = await EgresoService.pagarEgreso(id, datosPago);
    
    res.status(200).json({
      message: 'Egreso pagado exitosamente',
      egreso: egresoPagado
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error al pagar egreso';
    console.error(`Error en egreso.controller.js pagar: ${message}`, error);
    res.status(statusCode).json({ message, error: error.name });
  }
};

// Conciliar egreso con extracto bancario
exports.conciliar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await EgresoService.conciliarEgreso(id);
    res.status(200).json(resultado);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error al conciliar egreso';
    console.error(`Error en egreso.controller.js conciliar: ${message}`, error);
    res.status(statusCode).json({ message, error: error.name });
  }
};

// Obtener estadísticas de egresos
exports.getEstadisticas = async (req, res) => {
  try {
    const estadisticas = await EgresoService.getEstadisticasEgresos(req.query);
    res.status(200).json(estadisticas);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error al obtener estadísticas de egresos';
    console.error(`Error en egreso.controller.js getEstadisticas: ${message}`, error);
    res.status(statusCode).json({ message, error: error.name });
  }
}; 