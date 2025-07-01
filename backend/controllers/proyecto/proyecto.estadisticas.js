/**
 * Controlador para obtener estadísticas de proyectos
 */
const { models, Op } = require('./proyecto.utils');
const { Proyecto, sequelize } = models;

// Obtener estadísticas básicas de proyectos
exports.getEstadisticas = async (req, res) => {
  try {
    // Total de proyectos por estado
    const proyectosPorEstado = await Proyecto.count({
      group: ['estado']
    });
    
    // Total de proyectos por prioridad
    const proyectosPorPrioridad = await Proyecto.count({
      group: ['prioridad']
    });
    
    // Proyectos con fecha de fin cercana (próximos 30 días)
    const fechaActual = new Date();
    const fecha30Dias = new Date();
    fecha30Dias.setDate(fecha30Dias.getDate() + 30);
    
    const proyectosProximosAFinalizar = await Proyecto.count({
      where: {
        fecha_fin: {
          [Op.between]: [fechaActual, fecha30Dias]
        },
        estado: 'En curso'
      }
    });
    
    // Proyectos con avance menor al esperado
    const proyectosRetrasados = await Proyecto.findAll({
      attributes: [
        'id', 
        'nombre', 
        'fecha_inicio', 
        'fecha_fin', 
        'porcentaje_avance',
        [
          sequelize.literal(`
            CASE
              WHEN fecha_fin IS NULL THEN 0
              ELSE 
                ROUND(
                  (CURRENT_DATE - fecha_inicio::DATE)::FLOAT / 
                  NULLIF((fecha_fin::DATE - fecha_inicio::DATE), 0) * 100
                )
            END
          `),
          'avance_esperado'
        ]
      ],
      where: {
        estado: 'En curso'
      },
      having: sequelize.literal('porcentaje_avance < "avance_esperado" - 10')
    });
    
    res.status(200).json({
      proyectosPorEstado,
      proyectosPorPrioridad,
      proyectosProximosAFinalizar,
      proyectosRetrasados: proyectosRetrasados.length,
      detalleProyectosRetrasados: proyectosRetrasados
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de proyectos:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas de proyectos', error: error.message });
  }
}; 