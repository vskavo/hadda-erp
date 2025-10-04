const { Reporte, ReporteTemplate, Usuario, Cliente, Proyecto, Factura, Venta, Curso, Ingreso, Egreso, sequelize } = require('../models');
const { Op } = require('sequelize');
const { logError, logInfo } = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Controlador para gestión de reportes personalizados
 */

// Obtener listado de reportes predefinidos
exports.getReportesPredefinidos = async (req, res) => {
  try {
    const { categoria, tipo_reporte } = req.query;
    const usuarioId = req.usuario?.id;

    const whereConditions = {
      activo: true
    };

    // Filtros opcionales
    if (categoria) {
      whereConditions.categoria = categoria;
    }

    if (tipo_reporte) {
      whereConditions.tipo_reporte = tipo_reporte;
    }

    // Verificar permisos del usuario
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{ model: require('../models/rol.model')(sequelize), as: 'Rol' }]
    });

    if (usuario && usuario.Rol) {
      // Si no es admin, filtrar por roles permitidos
      if (!usuario.Rol.nombre.toLowerCase().includes('admin')) {
        whereConditions.roles_permitidos = {
          [Op.contains]: [usuario.Rol.nombre.toLowerCase()]
        };
      }
    }

    const reportesPredefinidos = await ReporteTemplate.findAll({
      where: whereConditions,
      include: [{
        model: Usuario,
        as: 'TemplatesCreados',
        attributes: ['id', 'nombre', 'apellido']
      }],
      order: [['orden', 'ASC'], ['nombre', 'ASC']]
    });

    // Obtener estadísticas de uso para cada reporte
    const reportesConEstadisticas = await Promise.all(
      reportesPredefinidos.map(async (reporte) => {
        const estadisticas = await Reporte.findAll({
          where: {
            template_id: reporte.id,
            estado: 'completado'
          },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'consultas_realizadas'],
            [sequelize.fn('MAX', sequelize.col('created_at')), 'ultima_consulta']
          ],
          raw: true
        });

        return {
          ...reporte.toJSON(),
          consultasRealizadas: estadisticas[0]?.consultas_realizadas || 0,
          ultimaConsulta: estadisticas[0]?.ultima_consulta
        };
      })
    );

    res.status(200).json(reportesConEstadisticas);
  } catch (error) {
    logError('Error al obtener reportes predefinidos', error);
    res.status(500).json({
      message: 'Error al obtener reportes predefinidos',
      error: error.message
    });
  }
};

// Obtener un reporte específico por ID
exports.getReporteById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    const reporte = await Reporte.findByPk(id, {
      include: [
        {
          model: ReporteTemplate,
          attributes: ['id', 'nombre', 'descripcion', 'tipo_reporte', 'modulo']
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });

    if (!reporte) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    // Verificar permisos
    const reporteUsuarioId = parseInt(reporte.usuario_id);
    const currentUsuarioId = parseInt(usuarioId);

    // Un usuario puede acceder a su propio reporte, o si es admin puede acceder a cualquier reporte
    const puedeAcceder = (reporteUsuarioId === currentUsuarioId) || reporte.compartido;

    if (!puedeAcceder) {
      // Si no puede acceder por ser propietario o compartido, verificar si es admin
      const usuario = await Usuario.findByPk(currentUsuarioId, {
        include: [{ model: require('../models/rol.model')(sequelize), as: 'Rol' }]
      });

      if (!usuario?.Rol?.nombre.toLowerCase().includes('admin')) {
        return res.status(403).json({ message: 'No tiene permisos para acceder a este reporte' });
      }
    }

    res.status(200).json(reporte);
  } catch (error) {
    logError('Error al obtener reporte', error);
    res.status(500).json({
      message: 'Error al obtener reporte',
      error: error.message
    });
  }
};

// Generar un reporte personalizado
exports.generarReportePersonalizado = async (req, res) => {
  try {
    const { entidad, campos, filtros, nombre, descripcion } = req.body;
    const usuarioId = req.usuario?.id;

    if (!entidad || !campos || campos.length === 0) {
      return res.status(400).json({
        message: 'Los campos entidad y campos son obligatorios'
      });
    }

    // Crear registro del reporte
    const reporte = await Reporte.create({
      nombre: nombre || `Reporte de ${entidad}`,
      descripcion: descripcion || `Reporte personalizado de ${entidad}`,
      tipo_reporte: 'personalizado',
      modulo: entidad,
      formato: 'json',
      estado: 'generando',
      usuario_id: usuarioId,
      parametros: {
        entidad,
        campos,
        filtros: filtros || {}
      }
    });

    // Ejecutar la generación en segundo plano (simulado)
    setTimeout(async () => {
      try {
        const datos = await generarDatosReporte(entidad, campos, filtros || {});
        await reporte.update({
          estado: 'completado',
          metadata: {
            registros_generados: datos.length,
            fecha_generacion: new Date()
          }
        });

        // Aquí se podría almacenar el resultado en un archivo o cache
        logInfo(`Reporte ${reporte.id} generado exitosamente`);
      } catch (error) {
        await reporte.update({
          estado: 'error',
          metadata: {
            error: error.message,
            fecha_error: new Date()
          }
        });
        logError(`Error al generar reporte ${reporte.id}`, error);
      }
    }, 100); // Simular procesamiento asíncrono

    res.status(201).json({
      message: 'Reporte en proceso de generación',
      reporte_id: reporte.id,
      estado: reporte.estado
    });
  } catch (error) {
    logError('Error al generar reporte personalizado', error);
    res.status(500).json({
      message: 'Error al generar reporte personalizado',
      error: error.message
    });
  }
};

// Obtener estado de un reporte
exports.getEstadoReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    const reporte = await Reporte.findByPk(id, {
      attributes: ['id', 'estado', 'metadata', 'created_at', 'updated_at']
    });

    if (!reporte) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    // Verificar permisos
    const reporteUsuarioId = parseInt(reporte.usuario_id);
    const currentUsuarioId = parseInt(usuarioId);

    // Un usuario puede acceder a su propio reporte, o si es admin puede acceder a cualquier reporte
    const puedeAcceder = (reporteUsuarioId === currentUsuarioId) || reporte.compartido;

    if (!puedeAcceder) {
      // Si no puede acceder por ser propietario o compartido, verificar si es admin
      const usuario = await Usuario.findByPk(currentUsuarioId, {
        include: [{ model: require('../models/rol.model')(sequelize), as: 'Rol' }]
      });

      if (!usuario?.Rol?.nombre.toLowerCase().includes('admin')) {
        return res.status(403).json({ message: 'No tiene permisos para acceder a este reporte' });
      }
    }

    res.status(200).json(reporte);
  } catch (error) {
    logError('Error al obtener estado del reporte', error);
    res.status(500).json({
      message: 'Error al obtener estado del reporte',
      error: error.message
    });
  }
};

// Obtener datos de un reporte completado
exports.getDatosReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    const reporte = await Reporte.findByPk(id);

    if (!reporte) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    // Verificar permisos
    const reporteUsuarioId = parseInt(reporte.usuario_id);
    const currentUsuarioId = parseInt(usuarioId);

    // Un usuario puede acceder a su propio reporte, o si es admin puede acceder a cualquier reporte
    const puedeAcceder = (reporteUsuarioId === currentUsuarioId) || reporte.compartido;

    if (!puedeAcceder) {
      // Si no puede acceder por ser propietario o compartido, verificar si es admin
      const usuario = await Usuario.findByPk(currentUsuarioId, {
        include: [{ model: require('../models/rol.model')(sequelize), as: 'Rol' }]
      });

      if (!usuario?.Rol?.nombre.toLowerCase().includes('admin')) {
        return res.status(403).json({ message: 'No tiene permisos para acceder a este reporte' });
      }
    }

    if (reporte.estado !== 'completado') {
      return res.status(400).json({
        message: 'El reporte aún no está completado',
        estado: reporte.estado
      });
    }

    // Regenerar datos (en una implementación real, se almacenarían)
    const { entidad, campos, filtros } = reporte.parametros;
    const datos = await generarDatosReporte(entidad, campos, filtros);

    res.status(200).json({
      reporte: {
        id: reporte.id,
        nombre: reporte.nombre,
        descripcion: reporte.descripcion,
        fecha_generacion: reporte.fecha_generacion
      },
      datos
    });
  } catch (error) {
    logError('Error al obtener datos del reporte', error);
    res.status(500).json({
      message: 'Error al obtener datos del reporte',
      error: error.message
    });
  }
};

// Guardar un reporte personalizado como predefinido
exports.guardarReportePredefinido = async (req, res) => {
  try {
    const { nombre, descripcion, categoria, entidad, campos, filtros, rolesPermitidos } = req.body;
    const usuarioId = req.usuario?.id;

    if (!nombre || !entidad || !campos || campos.length === 0) {
      return res.status(400).json({
        message: 'Los campos nombre, entidad y campos son obligatorios'
      });
    }

    const reporteTemplate = await ReporteTemplate.create({
      nombre,
      descripcion,
      tipo_reporte: 'personalizado',
      modulo: entidad,
      categoria: categoria || 'General',
      formatos_disponibles: ['pdf', 'excel', 'csv', 'json'],
      parametros_requeridos: {
        campos,
        filtros: filtros || {}
      },
      query_sql: null, // Para reportes personalizados, no usamos SQL directo
      activo: true,
      usuario_id: usuarioId,
      sistema: false,
      roles_permitidos: rolesPermitidos || [],
      opciones_configuracion: {
        entidad,
        campos,
        filtros: filtros || {}
      }
    });

    res.status(201).json({
      message: 'Reporte predefinido guardado exitosamente',
      template: reporteTemplate
    });
  } catch (error) {
    logError('Error al guardar reporte predefinido', error);
    res.status(500).json({
      message: 'Error al guardar reporte predefinido',
      error: error.message
    });
  }
};

// Eliminar un reporte predefinido
exports.eliminarReportePredefinido = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    const template = await ReporteTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ message: 'Template de reporte no encontrado' });
    }

    // Verificar permisos (solo el creador o admin pueden eliminar)
    if (template.usuario_id !== usuarioId && !template.sistema) {
      const usuario = await Usuario.findByPk(usuarioId, {
        include: [{ model: require('../models/rol.model')(sequelize), as: 'Rol' }]
      });

      if (!usuario?.Rol?.nombre.toLowerCase().includes('admin')) {
        return res.status(403).json({ message: 'No tiene permisos para eliminar este template' });
      }
    }

    // No permitir eliminar templates del sistema
    if (template.sistema) {
      return res.status(403).json({ message: 'No se pueden eliminar templates del sistema' });
    }

    await template.destroy();

    res.status(200).json({ message: 'Template de reporte eliminado exitosamente' });
  } catch (error) {
    logError('Error al eliminar template de reporte', error);
    res.status(500).json({
      message: 'Error al eliminar template de reporte',
      error: error.message
    });
  }
};

// Obtener campos disponibles para generar reportes personalizados
exports.getCamposDisponibles = async (req, res) => {
  try {
    const { entidad } = req.params;

    if (!entidad) {
      return res.status(400).json({ message: 'El parámetro entidad es obligatorio' });
    }

    const camposDisponibles = await obtenerCamposPorEntidad(entidad);

    res.status(200).json({
      entidad,
      campos: camposDisponibles.campos,
      filtros: camposDisponibles.filtros
    });
  } catch (error) {
    logError('Error al obtener campos disponibles', error);
    res.status(500).json({
      message: 'Error al obtener campos disponibles',
      error: error.message
    });
  }
};

// Obtener estadísticas de reportes generados
exports.getEstadisticasReportes = async (req, res) => {
  try {
    const usuarioId = req.usuario?.id;

    // Estadísticas generales
    const estadisticasGenerales = await Reporte.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_reportes'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('tipo_reporte'))), 'tipos_reportes'],
        [sequelize.fn('AVG', sequelize.col('tamano_archivo')), 'tamano_promedio']
      ],
      where: {
        usuario_id: usuarioId,
        estado: 'completado'
      },
      raw: true
    });

    // Reportes por tipo
    const reportesPorTipo = await Reporte.findAll({
      attributes: [
        'tipo_reporte',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      where: { usuario_id: usuarioId },
      group: ['tipo_reporte'],
      raw: true
    });

    // Reportes por mes (últimos 12 meses)
    const reportesPorMes = await Reporte.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'mes'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      where: {
        usuario_id: usuarioId,
        created_at: {
          [Op.gte]: sequelize.literal("CURRENT_DATE - INTERVAL '12 months'")
        }
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    res.status(200).json({
      generales: estadisticasGenerales[0],
      por_tipo: reportesPorTipo,
      por_mes: reportesPorMes
    });
  } catch (error) {
    logError('Error al obtener estadísticas de reportes', error);
    res.status(500).json({
      message: 'Error al obtener estadísticas de reportes',
      error: error.message
    });
  }
};

// Función auxiliar para generar datos de reporte según entidad
async function generarDatosReporte(entidad, campos, filtros = {}) {
  let modelo;
  let include = [];
  let whereConditions = {};

  // Configurar modelo y asociaciones según entidad
  switch (entidad) {
    case 'proyectos':
      modelo = Proyecto;
      include = [
        { model: Cliente, as: 'Cliente', attributes: ['id', 'razon_social', 'rut'] },
        { model: Usuario, as: 'Responsable', attributes: ['id', 'nombre', 'apellido'] }
      ];
      break;

    case 'clientes':
      modelo = Cliente;
      include = [
        { model: Usuario, as: 'Owner', attributes: ['id', 'nombre', 'apellido'] }
      ];
      break;

    case 'facturas':
      modelo = Factura;
      include = [
        { model: Cliente, attributes: ['id', 'razon_social', 'rut'] },
        { model: Proyecto, attributes: ['id', 'nombre'] }
      ];
      break;

    case 'ventas':
      modelo = Venta;
      include = [
        { model: Cliente, attributes: ['id', 'razon_social', 'rut'] },
        { model: Proyecto, attributes: ['id', 'nombre'] }
      ];
      break;

    case 'cursos':
      modelo = Curso;
      include = [
        { model: Proyecto, as: 'Proyecto', attributes: ['id', 'nombre'] }
      ];
      break;

    case 'finanzas':
      // Para finanzas, combinar ingresos y egresos
      const ingresos = await Ingreso.findAll({
        where: filtros.ingresos || {},
        include: [
          { model: Cliente, attributes: ['id', 'razon_social'] },
          { model: Proyecto, attributes: ['id', 'nombre'] }
        ],
        limit: 1000
      });

      const egresos = await Egreso.findAll({
        where: filtros.egresos || {},
        include: [
          { model: Proyecto, attributes: ['id', 'nombre'] }
        ],
        limit: 1000
      });

      return [
        ...ingresos.map(i => ({ ...i.toJSON(), tipo: 'ingreso' })),
        ...egresos.map(e => ({ ...e.toJSON(), tipo: 'egreso' }))
      ];

    default:
      throw new Error(`Entidad ${entidad} no soportada`);
  }

  // Aplicar filtros
  if (filtros.fecha_desde) {
    whereConditions.created_at = { ...whereConditions.created_at, [Op.gte]: new Date(filtros.fecha_desde) };
  }
  if (filtros.fecha_hasta) {
    whereConditions.created_at = { ...whereConditions.created_at, [Op.lte]: new Date(filtros.fecha_hasta) };
  }

  // Agregar filtros específicos
  Object.keys(filtros).forEach(key => {
    if (!['fecha_desde', 'fecha_hasta'].includes(key) && filtros[key]) {
      whereConditions[key] = filtros[key];
    }
  });

  const datos = await modelo.findAll({
    where: whereConditions,
    include,
    limit: 5000, // Límite de seguridad
    order: [['created_at', 'DESC']]
  });

  return datos.map(item => item.toJSON());
}

// Función auxiliar para obtener campos disponibles por entidad
async function obtenerCamposPorEntidad(entidad) {
  const camposPorEntidad = {
    proyectos: {
      campos: [
        { id: 'id', nombre: 'ID', tipo: 'numero' },
        { id: 'nombre', nombre: 'Nombre', tipo: 'texto' },
        { id: 'descripcion', nombre: 'Descripción', tipo: 'texto' },
        { id: 'Cliente.razon_social', nombre: 'Cliente', tipo: 'texto' },
        { id: 'Responsable.nombre', nombre: 'Responsable', tipo: 'texto' },
        { id: 'estado', nombre: 'Estado', tipo: 'texto' },
        { id: 'prioridad', nombre: 'Prioridad', tipo: 'texto' },
        { id: 'presupuesto_total', nombre: 'Presupuesto Total', tipo: 'numero' },
        { id: 'costo_real', nombre: 'Costo Real', tipo: 'numero' },
        { id: 'margen_estimado', nombre: 'Margen Estimado', tipo: 'numero' },
        { id: 'porcentaje_avance', nombre: 'Porcentaje de Avance', tipo: 'numero' },
        { id: 'fecha_inicio', nombre: 'Fecha Inicio', tipo: 'fecha' },
        { id: 'fecha_fin', nombre: 'Fecha Fin', tipo: 'fecha' },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha' },
        { id: 'updated_at', nombre: 'Fecha Actualización', tipo: 'fecha' }
      ],
      filtros: [
        { id: 'estado', nombre: 'Estado', tipo: 'select', opciones: [
          { valor: 'No iniciado', etiqueta: 'No Iniciado' },
          { valor: 'En curso', etiqueta: 'En Curso' },
          { valor: 'Liquidado', etiqueta: 'Liquidado' },
          { valor: 'Facturado', etiqueta: 'Facturado' }
        ]},
        { id: 'prioridad', nombre: 'Prioridad', tipo: 'select', opciones: [
          { valor: 'baja', etiqueta: 'Baja' },
          { valor: 'media', etiqueta: 'Media' },
          { valor: 'alta', etiqueta: 'Alta' },
          { valor: 'critica', etiqueta: 'Crítica' }
        ]},
        { id: 'cliente_id', nombre: 'Cliente', tipo: 'texto' },
        { id: 'fecha_desde', nombre: 'Fecha Desde', tipo: 'fecha' },
        { id: 'fecha_hasta', nombre: 'Fecha Hasta', tipo: 'fecha' }
      ]
    },
    clientes: {
      campos: [
        { id: 'id', nombre: 'ID', tipo: 'numero' },
        { id: 'razon_social', nombre: 'Razón Social', tipo: 'texto' },
        { id: 'rut', nombre: 'RUT', tipo: 'texto' },
        { id: 'giro', nombre: 'Giro', tipo: 'texto' },
        { id: 'direccion', nombre: 'Dirección', tipo: 'texto' },
        { id: 'telefono', nombre: 'Teléfono', tipo: 'texto' },
        { id: 'email', nombre: 'Email', tipo: 'texto' },
        { id: 'Owner.nombre', nombre: 'Propietario', tipo: 'texto' },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha' },
        { id: 'updated_at', nombre: 'Fecha Actualización', tipo: 'fecha' }
      ],
      filtros: [
        { id: 'razon_social', nombre: 'Razón Social', tipo: 'texto' },
        { id: 'rut', nombre: 'RUT', tipo: 'texto' },
        { id: 'fecha_desde', nombre: 'Fecha Desde', tipo: 'fecha' },
        { id: 'fecha_hasta', nombre: 'Fecha Hasta', tipo: 'fecha' }
      ]
    },
    facturas: {
      campos: [
        { id: 'id', nombre: 'ID', tipo: 'numero' },
        { id: 'numero_factura', nombre: 'Número Factura', tipo: 'texto' },
        { id: 'Cliente.razon_social', nombre: 'Cliente', tipo: 'texto' },
        { id: 'Proyecto.nombre', nombre: 'Proyecto', tipo: 'texto' },
        { id: 'monto', nombre: 'Monto', tipo: 'numero' },
        { id: 'estado', nombre: 'Estado', tipo: 'texto' },
        { id: 'fecha_emision', nombre: 'Fecha Emisión', tipo: 'fecha' },
        { id: 'fecha_vencimiento', nombre: 'Fecha Vencimiento', tipo: 'fecha' },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha' },
        { id: 'updated_at', nombre: 'Fecha Actualización', tipo: 'fecha' }
      ],
      filtros: [
        { id: 'estado', nombre: 'Estado', tipo: 'select', opciones: [
          { valor: 'pendiente', etiqueta: 'Pendiente' },
          { valor: 'pagada', etiqueta: 'Pagada' },
          { valor: 'vencida', etiqueta: 'Vencida' }
        ]},
        { id: 'cliente_id', nombre: 'Cliente', tipo: 'texto' },
        { id: 'fecha_desde', nombre: 'Fecha Desde', tipo: 'fecha' },
        { id: 'fecha_hasta', nombre: 'Fecha Hasta', tipo: 'fecha' }
      ]
    },
    ventas: {
      campos: [
        { id: 'id', nombre: 'ID', tipo: 'numero' },
        { id: 'numero_venta', nombre: 'Número Venta', tipo: 'texto' },
        { id: 'Cliente.razon_social', nombre: 'Cliente', tipo: 'texto' },
        { id: 'Proyecto.nombre', nombre: 'Proyecto', tipo: 'texto' },
        { id: 'monto', nombre: 'Monto', tipo: 'numero' },
        { id: 'estado', nombre: 'Estado', tipo: 'texto' },
        { id: 'fecha_venta', nombre: 'Fecha Venta', tipo: 'fecha' },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha' },
        { id: 'updated_at', nombre: 'Fecha Actualización', tipo: 'fecha' }
      ],
      filtros: [
        { id: 'estado', nombre: 'Estado', tipo: 'select', opciones: [
          { valor: 'pendiente', etiqueta: 'Pendiente' },
          { valor: 'completada', etiqueta: 'Completada' },
          { valor: 'cancelada', etiqueta: 'Cancelada' }
        ]},
        { id: 'cliente_id', nombre: 'Cliente', tipo: 'texto' },
        { id: 'fecha_desde', nombre: 'Fecha Desde', tipo: 'fecha' },
        { id: 'fecha_hasta', nombre: 'Fecha Hasta', tipo: 'fecha' }
      ]
    },
    cursos: {
      campos: [
        { id: 'id', nombre: 'ID', tipo: 'numero' },
        { id: 'nombre', nombre: 'Nombre', tipo: 'texto' },
        { id: 'codigo_sence', nombre: 'Código SENCE', tipo: 'texto' },
        { id: 'modalidad', nombre: 'Modalidad', tipo: 'texto' },
        { id: 'estado', nombre: 'Estado', tipo: 'texto' },
        { id: 'fecha_inicio', nombre: 'Fecha Inicio', tipo: 'fecha' },
        { id: 'fecha_fin', nombre: 'Fecha Fin', tipo: 'fecha' },
        { id: 'Proyecto.nombre', nombre: 'Proyecto', tipo: 'texto' },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha' },
        { id: 'updated_at', nombre: 'Fecha Actualización', tipo: 'fecha' }
      ],
      filtros: [
        { id: 'estado', nombre: 'Estado', tipo: 'select', opciones: [
          { valor: 'planificado', etiqueta: 'Planificado' },
          { valor: 'en_curso', etiqueta: 'En Curso' },
          { valor: 'finalizado', etiqueta: 'Finalizado' },
          { valor: 'cancelado', etiqueta: 'Cancelado' }
        ]},
        { id: 'modalidad', nombre: 'Modalidad', tipo: 'select', opciones: [
          { valor: 'presencial', etiqueta: 'Presencial' },
          { valor: 'e-learning', etiqueta: 'E-Learning' },
          { valor: 'mixta', etiqueta: 'Mixta' }
        ]},
        { id: 'fecha_desde', nombre: 'Fecha Desde', tipo: 'fecha' },
        { id: 'fecha_hasta', nombre: 'Fecha Hasta', tipo: 'fecha' }
      ]
    },
    finanzas: {
      campos: [
        { id: 'id', nombre: 'ID', tipo: 'numero' },
        { id: 'tipo', nombre: 'Tipo', tipo: 'texto' },
        { id: 'monto', nombre: 'Monto', tipo: 'numero' },
        { id: 'descripcion', nombre: 'Descripción', tipo: 'texto' },
        { id: 'fecha', nombre: 'Fecha', tipo: 'fecha' },
        { id: 'Cliente.razon_social', nombre: 'Cliente', tipo: 'texto' },
        { id: 'Proyecto.nombre', nombre: 'Proyecto', tipo: 'texto' },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha' },
        { id: 'updated_at', nombre: 'Fecha Actualización', tipo: 'fecha' }
      ],
      filtros: [
        { id: 'tipo', nombre: 'Tipo', tipo: 'select', opciones: [
          { valor: 'ingreso', etiqueta: 'Ingreso' },
          { valor: 'egreso', etiqueta: 'Egreso' }
        ]},
        { id: 'fecha_desde', nombre: 'Fecha Desde', tipo: 'fecha' },
        { id: 'fecha_hasta', nombre: 'Fecha Hasta', tipo: 'fecha' }
      ]
    }
  };

  return camposPorEntidad[entidad] || { campos: [], filtros: [] };
}