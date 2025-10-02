const { SiiIngreso, Proyecto, sequelize } = require('../models');
const { Op } = require('sequelize');
const siiService = require('../services/sii.service');
const SiiUtils = require('../utils/sii.utils');

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
const includeProyectoComun = {
  model: Proyecto,
  as: 'Proyecto',
  attributes: ['id', 'nombre'],
  required: false
};

// Obtener todos los ingresos SII con filtros y paginación
exports.getSiiIngresos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'fecha_emision',
      sortOrder = 'DESC',
      search,
      tipo_dte,
      estado_sii,
      proyecto_id,
      cliente_rut,
      desde,
      hasta
    } = req.query;

    // Construir cláusula WHERE
    const whereClause = {};

    // Filtro de búsqueda general
    if (search) {
      whereClause[Op.or] = [
        { cliente_nombre: { [Op.iLike]: `%${search}%` } },
        { emisor_nombre: { [Op.iLike]: `%${search}%` } },
        sequelize.where(sequelize.cast(sequelize.col('folio'), 'TEXT'), { [Op.iLike]: `%${search}%` })
      ];
    }

    // Filtros específicos
    if (tipo_dte) {
      whereClause.tipo_dte = tipo_dte;
    }

    if (estado_sii) {
      whereClause.estado_sii = estado_sii;
    }

    if (proyecto_id) {
      whereClause.proyecto_id = proyecto_id;
    }

    if (cliente_rut) {
      whereClause.cliente_rut = { [Op.iLike]: `%${cliente_rut}%` };
    }

    // Filtro por rango de fechas
    if (desde || hasta) {
      whereClause.fecha_emision = {};
      if (desde) {
        whereClause.fecha_emision[Op.gte] = new Date(desde);
      }
      if (hasta) {
        whereClause.fecha_emision[Op.lte] = new Date(hasta);
      }
    }

    // Configuración de ordenamiento
    const order = [[sortBy, sortOrder.toUpperCase()]];

    // Configuración de paginación
    const offset = (page - 1) * limit;

    // Ejecutar consulta
    const { rows: ingresos, count: total } = await SiiIngreso.findAndCountAll({
      where: whereClause,
      include: [includeProyectoComun],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      ingresos,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('Error en sii_ingreso.controller.js al obtener ingresos SII:', error);
    res.status(500).json({
      message: 'Error al obtener ingresos SII',
      error: error.message
    });
  }
};

// Obtener un ingreso SII por ID
exports.getSiiIngreso = async (req, res) => {
  try {
    const { id } = req.params;

    const ingreso = await SiiIngreso.findByPk(id, {
      include: [includeProyectoComun]
    });

    if (!ingreso) {
      return res.status(404).json({
        message: 'Ingreso SII no encontrado'
      });
    }

    res.status(200).json({
      ingreso
    });

  } catch (error) {
    console.error('Error en sii_ingreso.controller.js al obtener ingreso SII:', error);
    res.status(500).json({
      message: 'Error al obtener ingreso SII',
      error: error.message
    });
  }
};

// Crear un nuevo ingreso SII
exports.createSiiIngreso = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const datosIngreso = req.body;

    // Validar existencia del proyecto si se proporciona
    if (datosIngreso.proyecto_id) {
      await validarExistenciaEntidad(Proyecto, datosIngreso.proyecto_id, 'Proyecto');
    }

    // Crear el ingreso SII
    const nuevoIngreso = await SiiIngreso.create(datosIngreso, { transaction });

    // Recargar con asociaciones
    const ingresoCreado = await SiiIngreso.findByPk(nuevoIngreso.id, {
      include: [includeProyectoComun],
      transaction
    });

    await transaction.commit();

    res.status(201).json({
      message: 'Ingreso SII creado exitosamente',
      ingreso: ingresoCreado
    });

  } catch (error) {
    await transaction.rollback();

    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error('Error en sii_ingreso.controller.js al crear ingreso SII:', error);
    res.status(500).json({
      message: 'Error al crear ingreso SII',
      error: error.message
    });
  }
};

// Actualizar un ingreso SII
exports.updateSiiIngreso = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    // Verificar que el ingreso existe
    const ingresoExistente = await SiiIngreso.findByPk(id, { transaction });
    if (!ingresoExistente) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Ingreso SII no encontrado'
      });
    }

    // Validar existencia del proyecto si se proporciona
    if (datosActualizacion.proyecto_id) {
      await validarExistenciaEntidad(Proyecto, datosActualizacion.proyecto_id, 'Proyecto');
    }

    // Actualizar el ingreso
    await ingresoExistente.update(datosActualizacion, { transaction });

    // Recargar con asociaciones
    const ingresoActualizado = await SiiIngreso.findByPk(id, {
      include: [includeProyectoComun],
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      message: 'Ingreso SII actualizado exitosamente',
      ingreso: ingresoActualizado
    });

  } catch (error) {
    await transaction.rollback();

    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error('Error en sii_ingreso.controller.js al actualizar ingreso SII:', error);
    res.status(500).json({
      message: 'Error al actualizar ingreso SII',
      error: error.message
    });
  }
};

// Eliminar un ingreso SII
exports.deleteSiiIngreso = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Verificar que el ingreso existe
    const ingresoExistente = await SiiIngreso.findByPk(id, { transaction });
    if (!ingresoExistente) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Ingreso SII no encontrado'
      });
    }

    // Eliminar el ingreso
    await ingresoExistente.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      message: 'Ingreso SII eliminado exitosamente'
    });

  } catch (error) {
    await transaction.rollback();

    console.error('Error en sii_ingreso.controller.js al eliminar ingreso SII:', error);
    res.status(500).json({
      message: 'Error al eliminar ingreso SII',
      error: error.message
    });
  }
};

// Sincronizar ingresos desde SII
exports.sincronizarIngresosSii = async (req, res) => {
  try {
    const { rut, clave, proyecto_id } = req.body;

    // Validar credenciales usando utilidades
    const validacionCredenciales = SiiUtils.validarCredencialesSii({ rut, clave });
    if (!validacionCredenciales.valido) {
      return res.status(400).json({
        message: 'Credenciales inválidas',
        error: validacionCredenciales.errores.join(', ')
      });
    }

    // Usar el servicio para la sincronización
    const resultado = await siiService.sincronizarIngresosSii({ rut, clave, proyecto_id });

    res.status(200).json(resultado);

  } catch (error) {
    console.error('Error en sii_ingreso.controller.js al sincronizar ingresos SII:', error);

    // Determinar el código de estado apropiado
    let statusCode = 500;
    if (error.message.includes('servicio de scraping')) {
      statusCode = 502; // Bad Gateway
    } else if (error.message.includes('Parámetros requeridos') || error.message.includes('Credenciales inválidas')) {
      statusCode = 400; // Bad Request
    }

    res.status(statusCode).json({
      message: 'Error al sincronizar ingresos SII',
      error: error.message,
      nuevosRegistros: 0,
      actualizados: 0,
      errores: []
    });
  }
};

// Obtener estadísticas de ingresos SII
exports.getEstadisticasSiiIngresos = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    // Construir cláusula WHERE para fechas
    const whereClause = {};
    if (desde || hasta) {
      whereClause.fecha_emision = {};
      if (desde) {
        whereClause.fecha_emision[Op.gte] = new Date(desde);
      }
      if (hasta) {
        whereClause.fecha_emision[Op.lte] = new Date(hasta);
      }
    }

    // Obtener estadísticas
    const [totalIngresos, totalMonto, ingresosPorEstado, ingresosPorTipo] = await Promise.all([
      // Total de ingresos
      SiiIngreso.count({ where: whereClause }),

      // Suma total de montos
      SiiIngreso.sum('monto_total', { where: whereClause }),

      // Agrupados por estado
      SiiIngreso.findAll({
        attributes: [
          'estado_sii',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'total']
        ],
        where: whereClause,
        group: ['estado_sii']
      }),

      // Agrupados por tipo DTE
      SiiIngreso.findAll({
        attributes: [
          'tipo_dte',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'total']
        ],
        where: whereClause,
        group: ['tipo_dte']
      })
    ]);

    res.status(200).json({
      totalIngresos: totalIngresos || 0,
      totalMonto: totalMonto || 0,
      ingresosPorEstado,
      ingresosPorTipo,
      periodo: { desde, hasta }
    });

  } catch (error) {
    console.error('Error en sii_ingreso.controller.js al obtener estadísticas:', error);
    res.status(500).json({
      message: 'Error al obtener estadísticas de ingresos SII',
      error: error.message
    });
  }
};

// Actualizar proyecto de un ingreso SII
exports.actualizarProyectoIngreso = async (req, res) => {
  const { id } = req.params;
  const { proyecto_id } = req.body;

  try {
    // Validar que el ingreso SII existe
    const ingreso = await SiiIngreso.findByPk(id, {
      include: [includeProyectoComun]
    });
    if (!ingreso) {
      return res.status(404).json({
        message: 'Ingreso SII no encontrado'
      });
    }

    // Validar que el proyecto existe (si se proporciona uno)
    if (proyecto_id) {
      await validarExistenciaEntidad(Proyecto, proyecto_id, 'Proyecto');
    }

    // Actualizar el proyecto_id
    await ingreso.update({ proyecto_id: proyecto_id || null });

    // Obtener el ingreso actualizado con la información del proyecto
    const ingresoActualizado = await SiiIngreso.findByPk(id, {
      include: [includeProyectoComun]
    });

    res.status(200).json({
      message: 'Proyecto del ingreso SII actualizado exitosamente',
      ingreso: ingresoActualizado
    });

  } catch (error) {
    console.error(`Error en sii_ingreso.controller.js al actualizar proyecto del ingreso ${id}:`, error);

    if (error instanceof EntityNotFoundError) {
      return res.status(error.statusCode).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: 'Error al actualizar proyecto del ingreso SII',
      error: error.message
    });
  }
};
