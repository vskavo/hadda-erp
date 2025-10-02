const { SiiEgreso, Proyecto, sequelize } = require('../models');
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

// Obtener todos los egresos SII con filtros y paginación
exports.getSiiEgresos = async (req, res) => {
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
      emisor_rut,
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

    if (emisor_rut) {
      whereClause.emisor_rut = { [Op.iLike]: `%${emisor_rut}%` };
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
    const { rows: egresos, count: total } = await SiiEgreso.findAndCountAll({
      where: whereClause,
      include: [includeProyectoComun],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      egresos,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('Error en sii_egreso.controller.js al obtener egresos SII:', error);
    res.status(500).json({
      message: 'Error al obtener egresos SII',
      error: error.message
    });
  }
};

// Obtener un egreso SII por ID
exports.getSiiEgreso = async (req, res) => {
  try {
    const { id } = req.params;

    const egreso = await SiiEgreso.findByPk(id, {
      include: [includeProyectoComun]
    });

    if (!egreso) {
      return res.status(404).json({
        message: 'Egreso SII no encontrado'
      });
    }

    res.status(200).json({
      egreso
    });

  } catch (error) {
    console.error('Error en sii_egreso.controller.js al obtener egreso SII:', error);
    res.status(500).json({
      message: 'Error al obtener egreso SII',
      error: error.message
    });
  }
};

// Crear un nuevo egreso SII
exports.createSiiEgreso = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const datosEgreso = req.body;

    // Validar existencia del proyecto si se proporciona
    if (datosEgreso.proyecto_id) {
      await validarExistenciaEntidad(Proyecto, datosEgreso.proyecto_id, 'Proyecto');
    }

    // Crear el egreso SII
    const nuevoEgreso = await SiiEgreso.create(datosEgreso, { transaction });

    // Recargar con asociaciones
    const egresoCreado = await SiiEgreso.findByPk(nuevoEgreso.id, {
      include: [includeProyectoComun],
      transaction
    });

    await transaction.commit();

    res.status(201).json({
      message: 'Egreso SII creado exitosamente',
      egreso: egresoCreado
    });

  } catch (error) {
    await transaction.rollback();

    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error('Error en sii_egreso.controller.js al crear egreso SII:', error);
    res.status(500).json({
      message: 'Error al crear egreso SII',
      error: error.message
    });
  }
};

// Actualizar un egreso SII
exports.updateSiiEgreso = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    // Verificar que el egreso existe
    const egresoExistente = await SiiEgreso.findByPk(id, { transaction });
    if (!egresoExistente) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Egreso SII no encontrado'
      });
    }

    // Validar existencia del proyecto si se proporciona
    if (datosActualizacion.proyecto_id) {
      await validarExistenciaEntidad(Proyecto, datosActualizacion.proyecto_id, 'Proyecto');
    }

    // Actualizar el egreso
    await egresoExistente.update(datosActualizacion, { transaction });

    // Recargar con asociaciones
    const egresoActualizado = await SiiEgreso.findByPk(id, {
      include: [includeProyectoComun],
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      message: 'Egreso SII actualizado exitosamente',
      egreso: egresoActualizado
    });

  } catch (error) {
    await transaction.rollback();

    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error('Error en sii_egreso.controller.js al actualizar egreso SII:', error);
    res.status(500).json({
      message: 'Error al actualizar egreso SII',
      error: error.message
    });
  }
};

// Eliminar un egreso SII
exports.deleteSiiEgreso = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Verificar que el egreso existe
    const egresoExistente = await SiiEgreso.findByPk(id, { transaction });
    if (!egresoExistente) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Egreso SII no encontrado'
      });
    }

    // Eliminar el egreso
    await egresoExistente.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      message: 'Egreso SII eliminado exitosamente'
    });

  } catch (error) {
    await transaction.rollback();

    console.error('Error en sii_egreso.controller.js al eliminar egreso SII:', error);
    res.status(500).json({
      message: 'Error al eliminar egreso SII',
      error: error.message
    });
  }
};

// Sincronizar egresos desde SII
exports.sincronizarEgresosSii = async (req, res) => {
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
    const resultado = await siiService.sincronizarEgresosSii({ rut, clave, proyecto_id });

    res.status(200).json(resultado);

  } catch (error) {
    console.error('Error en sii_egreso.controller.js al sincronizar egresos SII:', error);

    // Determinar el código de estado apropiado
    let statusCode = 500;
    if (error.message.includes('servicio de scraping')) {
      statusCode = 502; // Bad Gateway
    } else if (error.message.includes('Parámetros requeridos') || error.message.includes('Credenciales inválidas')) {
      statusCode = 400; // Bad Request
    }

    res.status(statusCode).json({
      message: 'Error al sincronizar egresos SII',
      error: error.message,
      nuevosRegistros: 0,
      actualizados: 0,
      errores: []
    });
  }
};

// Obtener estadísticas de egresos SII
exports.getEstadisticasSiiEgresos = async (req, res) => {
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
    const [totalEgresos, totalMonto, egresosPorEstado, egresosPorTipo] = await Promise.all([
      // Total de egresos
      SiiEgreso.count({ where: whereClause }),

      // Suma total de montos
      SiiEgreso.sum('monto_total', { where: whereClause }),

      // Agrupados por estado
      SiiEgreso.findAll({
        attributes: [
          'estado_sii',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'total']
        ],
        where: whereClause,
        group: ['estado_sii']
      }),

      // Agrupados por tipo DTE
      SiiEgreso.findAll({
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
      totalEgresos: totalEgresos || 0,
      totalMonto: totalMonto || 0,
      egresosPorEstado,
      egresosPorTipo,
      periodo: { desde, hasta }
    });

  } catch (error) {
    console.error('Error en sii_egreso.controller.js al obtener estadísticas:', error);
    res.status(500).json({
      message: 'Error al obtener estadísticas de egresos SII',
      error: error.message
    });
  }
};

// Actualizar proyecto de un egreso SII
exports.actualizarProyectoEgreso = async (req, res) => {
  const { id } = req.params;
  const { proyecto_id } = req.body;

  try {
    // Validar que el egreso SII existe
    const egreso = await SiiEgreso.findByPk(id, {
      include: [includeProyectoComun]
    });
    if (!egreso) {
      return res.status(404).json({
        message: 'Egreso SII no encontrado'
      });
    }

    // Validar que el proyecto existe (si se proporciona uno)
    if (proyecto_id) {
      await validarExistenciaEntidad(Proyecto, proyecto_id, 'Proyecto');
    }

    // Actualizar el proyecto_id
    await egreso.update({ proyecto_id: proyecto_id || null });

    // Obtener el egreso actualizado con la información del proyecto
    const egresoActualizado = await SiiEgreso.findByPk(id, {
      include: [includeProyectoComun]
    });

    res.status(200).json({
      message: 'Proyecto del egreso SII actualizado exitosamente',
      egreso: egresoActualizado
    });

  } catch (error) {
    console.error(`Error en sii_egreso.controller.js al actualizar proyecto del egreso ${id}:`, error);

    if (error instanceof EntityNotFoundError) {
      return res.status(error.statusCode).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: 'Error al actualizar proyecto del egreso SII',
      error: error.message
    });
  }
};
