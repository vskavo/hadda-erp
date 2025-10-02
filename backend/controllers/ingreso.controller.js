const { Ingreso, Cliente, Proyecto, Factura, CuentaBancaria, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');
const IngresoService = require('../services/ingreso.service'); // Importar el servicio

// Clase de error personalizada para entidades no encontradas
class EntityNotFoundError extends Error {
  constructor(entityName, entityId) {
    super(`${entityName} con ID ${entityId} no encontrado/a.`);
    this.name = 'EntityNotFoundError';
    this.statusCode = 404;
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

// Función auxiliar para validar la existencia de una entidad
async function validarExistenciaEntidad(Model, id, entityNameForError) {
  if (id === null || id === undefined) {
    return; // No hay nada que validar si no se proporciona el ID (campo opcional)
  }
  const entidad = await Model.findByPk(id);
  if (!entidad) {
    throw new EntityNotFoundError(entityNameForError, id);
  }
}

// Definiciones de inclusiones comunes
const includeClienteComun = {
  model: Cliente,
  as: 'Cliente',
  attributes: ['id', 'razon_social', 'rut'],
  required: false
};

const includeProyectoComun = {
  model: Proyecto,
  as: 'Proyecto',
  attributes: ['id', 'nombre'],
  required: false
};

const includeFacturaGeneral = { // Usado en findAll, create (completo), update (actualizado)
  model: Factura,
  as: 'Factura',
  attributes: ['id', 'numero_factura', 'fecha_emision'],
  required: false
};

// Para findAll
const includeCuentaBancariaFindAll = {
  model: CuentaBancaria,
  as: 'CuentaBancaria',
  attributes: ['id', 'banco', 'tipo_cuenta', 'numero_cuenta'], // Nota: 'banco'
  required: false
};
const includeUsuarioFindAll = {
  model: Usuario,
  as: 'Usuario',
  attributes: ['id', 'nombre', 'apellido'],
  required: false
};

// Para findOne
const includeFacturaFindOne = {
  model: Factura,
  as: 'Factura',
  attributes: ['id', 'numero_factura', 'fecha_emision', 'monto_total'],
  required: false
};
const includeCuentaBancariaDetalle = { // Usado en findOne, create (completo), update (actualizado), confirmar (actualizado)
  model: CuentaBancaria,
  as: 'CuentaBancaria',
  attributes: ['id', 'banco', 'tipo_cuenta', 'numero_cuenta'], // Nota: 'banco'
  required: false
};
const includeUsuarioDetalle = { // Usado en findOne
  model: Usuario,
  as: 'Usuario',
  attributes: ['id', 'nombre', 'apellido', 'email'],
  required: false
};

// Para confirmar (ingresoActualizado)
const includeFacturaConfirmar = {
  model: Factura,
  as: 'Factura',
  attributes: ['id', 'numero_factura', 'estado'],
  required: false
};

// Arrays de include para cada función
const includesForFindAll = [
  includeClienteComun,
  includeProyectoComun,
  includeFacturaGeneral,
  includeCuentaBancariaFindAll,
  includeUsuarioFindAll
];

const includesForFindOne = [
  includeClienteComun,
  includeProyectoComun,
  includeFacturaFindOne,
  includeCuentaBancariaDetalle,
  includeUsuarioDetalle
];

const includesForCreateUpdate = [ // Para obtener el ingreso completo/actualizado después de crear/actualizar
  includeClienteComun,
  includeProyectoComun,
  includeFacturaGeneral,
  includeCuentaBancariaDetalle
  // Usuario no se incluye aquí en el código original al obtener el ingreso completo/actualizado
];

const includesForConfirmar = [ // Para obtener el ingreso actualizado después de confirmar
  includeClienteComun,
  // Proyecto no se incluye aquí en el código original
  includeFacturaConfirmar,
  includeCuentaBancariaDetalle
  // Usuario no se incluye aquí en el código original
];

// Función auxiliar para construir las condiciones de búsqueda para ingresos
const buildWhereConditionsIngresos = (queryParams) => {
  const { 
    search = '', 
    estado, 
    desde,
    hasta,
    cliente_id,
    proyecto_id,
    tipo_ingreso,
    categoria,
    conciliado,
    cuenta_bancaria_id
  } = queryParams;

  const whereConditions = {};

  if (search) {
    whereConditions[Op.or] = [
      { descripcion: { [Op.iLike]: `%${search}%` } },
      { numero_documento: { [Op.iLike]: `%${search}%` } },
      { observaciones: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  if (estado) {
    whereConditions.estado = estado;
  }
  
  if (desde && hasta) {
    whereConditions.fecha = {
      [Op.between]: [new Date(desde), new Date(hasta)]
    };
  } else if (desde) {
    whereConditions.fecha = {
      [Op.gte]: new Date(desde)
    };
  } else if (hasta) {
    whereConditions.fecha = {
      [Op.lte]: new Date(hasta)
    };
  }
  
  if (cliente_id) {
    whereConditions.cliente_id = cliente_id;
  }
  
  if (proyecto_id) {
    whereConditions.proyecto_id = proyecto_id;
  }
  
  if (tipo_ingreso) {
    whereConditions.tipo_ingreso = tipo_ingreso;
  }
  
  if (categoria) {
    whereConditions.categoria = categoria;
  }
  
  if (conciliado !== undefined) {
    whereConditions.conciliado = conciliado === 'true';
  }
  
  if (cuenta_bancaria_id) {
    whereConditions.cuenta_bancaria_id = cuenta_bancaria_id;
  }

  return whereConditions;
};

// Obtener todos los ingresos con paginación y filtros
exports.findAll = async (req, res) => {
  try {
    // Los queryParams (page, limit, sortBy, sortOrder, y todos los filtros)
    // se pasan directamente al servicio.
    const resultado = await IngresoService.getAllIngresos(req.query);
    
    res.status(200).json(resultado);

  } catch (error) {
    // El servicio ya maneja y loguea el error.
    // Aquí solo nos preocupamos por la respuesta HTTP.
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    // Este console.error es redundante si el servicio ya lo hizo, pero puede dejarse por si acaso.
    console.error('Error en ingreso.controller.js al obtener ingresos:', error);
    res.status(500).json({ message: 'Error al obtener ingresos', error: error.message });
  }
};

// Obtener un ingreso por ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const ingreso = await IngresoService.getIngresoById(id);
    
    // El servicio ya lanza EntityNotFoundError si no se encuentra
    // por lo que no es necesario verificar `!ingreso` aquí.
    
    res.status(200).json(ingreso);

  } catch (error) {
    if (error.statusCode) { // Capturar EntityNotFoundError y otros errores del servicio
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Error en ingreso.controller.js al obtener ingreso:', error);
    res.status(500).json({ message: 'Error al obtener ingreso', error: error.message });
  }
};

// Crear un nuevo ingreso
exports.create = async (req, res) => {
  try {
    const datosIngreso = req.body;
    const usuarioSolicitanteId = req.usuario ? req.usuario.id : null; // Asumiendo que tienes el usuario en req.usuario

    const nuevoIngreso = await IngresoService.crearIngreso(datosIngreso, usuarioSolicitanteId);

    res.status(201).json({
      message: 'Ingreso registrado exitosamente',
      ingreso: nuevoIngreso
    });

  } catch (error) {
    // El servicio debería lanzar errores con statusCode si es posible
    // o errores que podamos mapear aquí.
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    // Loguear el error si no tiene un statusCode manejable por el cliente directamente
    console.error('Error en ingreso.controller.js al crear ingreso:', error);
    res.status(500).json({ message: 'Error al crear ingreso', error: error.message });
  }
};

// Actualizar un ingreso existente
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;
    // const usuarioSolicitanteId = req.usuario ? req.usuario.id : null; // Si necesitas identificar quién hace el update

    const ingresoActualizado = await IngresoService.actualizarIngreso(id, datosActualizacion /*, usuarioSolicitanteId */);

    res.status(200).json({
      message: 'Ingreso actualizado exitosamente',
      ingreso: ingresoActualizado
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Error en ingreso.controller.js al actualizar ingreso:', error);
    res.status(500).json({ message: 'Error al actualizar ingreso', error: error.message });
  }
};

// Anular un ingreso (cambiar estado a 'anulado')
exports.anular = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body; // El motivo de anulación es opcional

    const resultado = await IngresoService.anularIngreso(id, motivo);

    res.status(200).json(resultado); // El servicio ya devuelve { id, message }

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Error en ingreso.controller.js al anular ingreso:', error);
    res.status(500).json({ message: 'Error al anular ingreso', error: error.message });
  }
};

// Confirmar un ingreso pendiente
exports.confirmar = async (req, res) => {
  try {
    const { id } = req.params;
    const datosConfirmacion = req.body; // { fecha_confirmacion, cuenta_bancaria_id }

    const ingresoConfirmado = await IngresoService.confirmarIngreso(id, datosConfirmacion);

    res.status(200).json({
      message: 'Ingreso confirmado exitosamente',
      ingreso: ingresoConfirmado
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Error en ingreso.controller.js al confirmar ingreso:', error);
    res.status(500).json({ message: 'Error al confirmar ingreso', error: error.message });
  }
};

// Conciliar ingreso con extracto bancario
exports.conciliar = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await IngresoService.conciliarIngreso(id);

    res.status(200).json(resultado);

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Error en ingreso.controller.js al conciliar ingreso:', error);
    res.status(500).json({ message: 'Error al conciliar ingreso', error: error.message });
  }
};

// Obtener estadísticas de ingresos
exports.getEstadisticas = async (req, res) => {
  try {
    // Los queryParams (desde, hasta) se pasan directamente al servicio.
    const estadisticas = await IngresoService.getEstadisticasIngresos(req.query);
    
    res.status(200).json(estadisticas);

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Error en ingreso.controller.js al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
}; 