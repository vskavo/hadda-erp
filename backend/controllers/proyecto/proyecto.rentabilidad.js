/**
 * Controlador para gestionar la rentabilidad de proyectos
 */
const { models } = require('./proyecto.utils');
const { Proyecto, Cliente, CostoProyecto, sequelize, Comision } = models;
const { Op } = require('sequelize');

// Calcular rentabilidad de un proyecto
exports.calcularRentabilidad = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proyecto = await Proyecto.findByPk(id, {
      include: [
        {
          model: CostoProyecto,
          as: 'CostoProyectos',
          attributes: ['id', 'proyecto_id', 'concepto', 'tipo_costo', 'monto', 'fecha', 'estado', 'proveedor'],
          where: { 
            estado: 'ejecutado',
            incluido_rentabilidad: true
          },
          required: false
        }
      ]
    });
    
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Calcular costos totales ejecutados
    const costosTotales = proyecto.CostoProyectos.reduce((sum, costo) => sum + parseFloat(costo.monto), 0);
    
    // Obtener ingresos facturados para este proyecto desde la tabla de facturas
    // Esto requeriría una relación entre proyectos y facturas
    // Por ahora usamos el presupuesto como ingresos esperados
    const ingresosEsperados = parseFloat(proyecto.presupuesto || 0);
    
    // Cálculos de rentabilidad
    const margenEsperado = ingresosEsperados > 0 
      ? ((ingresosEsperados - costosTotales) / ingresosEsperados * 100)
      : 0;
    
    const roi = costosTotales > 0 
      ? ((ingresosEsperados - costosTotales) / costosTotales * 100) 
      : 0;
    
    // Calcular rentabilidad por tipo de costo
    const rentabilidadPorTipoCosto = await CostoProyecto.findAll({
      attributes: [
        'tipo_costo',
        [sequelize.fn('SUM', sequelize.col('monto')), 'total'],
        [sequelize.literal(`ROUND((SUM(monto) / ${costosTotales || 1}) * 100, 2)`), 'porcentaje']
      ],
      where: {
        proyecto_id: id,
        estado: 'ejecutado',
        incluido_rentabilidad: true
      },
      group: ['tipo_costo'],
      order: [[sequelize.literal('total'), 'DESC']]
    });
    
    // Actualizar costo real en el proyecto
    await proyecto.update({
      costo_real: costosTotales
    });
    
    // --- Cálculo de comisión (manual o automática) ---
    let tipoComision = 'automatica';
    let porcentajeComision = 0;
    let fuenteComision = null;
    if (proyecto.usar_comision_manual && proyecto.comision_manual !== null && !isNaN(parseFloat(proyecto.comision_manual))) {
      tipoComision = 'manual';
      porcentajeComision = parseFloat(proyecto.comision_manual);
      fuenteComision = { origen: 'manual', valor: porcentajeComision };
    } else {
      // Buscar comisión automática según margen y rol responsable
      let responsableId = proyecto.responsable_id;
      // Aquí podrías obtener el rol del responsable si es necesario
      // Por simplicidad, asumimos que el rol_id está disponible o se puede obtener
      // Si no tienes el rol_id, deberías hacer un join o consulta adicional
      // Por ahora, devolvemos 0 si no hay responsable
      if (responsableId) {
        // Obtener el usuario y su rol
        const usuario = await Cliente.sequelize.models.Usuario.findByPk(responsableId);
        let rolId = usuario && usuario.rol_id ? usuario.rol_id : null;
        if (rolId) {
          const comisionRecord = await Comision.findOne({
            where: {
              rol_id: rolId,
              margen_desde: { [Op.lte]: margenEsperado },
              [Op.or]: [
                { margen_hasta: { [Op.gte]: margenEsperado } },
                { margen_hasta: { [Op.is]: null } }
              ]
            }
          });
          if (comisionRecord) {
            porcentajeComision = parseFloat(comisionRecord.comision);
            fuenteComision = { origen: 'automatica', rango: [comisionRecord.margen_desde, comisionRecord.margen_hasta], valor: porcentajeComision };
          }
        }
      }
    }
    
    res.status(200).json({
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        presupuesto: ingresosEsperados,
        costos_totales: costosTotales,
        margen_bruto: ingresosEsperados - costosTotales,
        margen_porcentaje: parseFloat(margenEsperado),
        roi: parseFloat(roi),
        estado: proyecto.estado,
        porcentaje_avance: proyecto.porcentaje_avance,
        tipo_comision: tipoComision,
        porcentaje_comision: porcentajeComision,
        fuente_comision: fuenteComision
      },
      desglose_costos: rentabilidadPorTipoCosto,
      detalle_costos: proyecto.CostoProyectos
    });
  } catch (error) {
    console.error('Error al calcular rentabilidad:', error);
    res.status(500).json({ message: 'Error al calcular rentabilidad', error: error.message });
  }
};

// Obtener dashboard de rentabilidad de proyectos
exports.dashboardRentabilidad = async (req, res) => {
  try {
    const { 
      mes_inicio, 
      mes_fin,
      anio,
      cliente_id
    } = req.query;
    
    // Construir filtros de fechas
    const whereConditions = {};
    
    if (mes_inicio && mes_fin && anio) {
      const fechaInicio = new Date(anio, mes_inicio - 1, 1);
      const fechaFin = new Date(anio, mes_fin, 0);
      
      whereConditions.fecha_inicio = {
        [sequelize.Op.between]: [fechaInicio, fechaFin]
      };
    } else if (anio) {
      const fechaInicio = new Date(anio, 0, 1);
      const fechaFin = new Date(anio, 11, 31);
      
      whereConditions.fecha_inicio = {
        [sequelize.Op.between]: [fechaInicio, fechaFin]
      };
    }
    
    if (cliente_id) {
      whereConditions.cliente_id = cliente_id;
    }
    
    // Proyectos más rentables
    const proyectosMasRentables = await Proyecto.findAll({
      attributes: [
        'id', 
        'nombre', 
        'presupuesto', 
        'costo_real',
        'estado',
        'fecha_inicio',
        'fecha_fin'
      ],
      where: {
        ...whereConditions,
        estado: {
          [sequelize.Op.in]: ['en_curso', 'finalizado']
        }
      },
      order: [[sequelize.literal('(presupuesto - costo_real) / NULLIF(presupuesto, 0) * 100'), 'DESC']],
      limit: 10,
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social']
        }
      ]
    });
    
    // Proyectos menos rentables
    const proyectosMenosRentables = await Proyecto.findAll({
      attributes: [
        'id', 
        'nombre', 
        'presupuesto', 
        'costo_real',
        'estado',
        'fecha_inicio',
        'fecha_fin'
      ],
      where: {
        ...whereConditions,
        estado: {
          [sequelize.Op.in]: ['en_curso', 'finalizado']
        }
      },
      order: [[sequelize.literal('(presupuesto - costo_real) / NULLIF(presupuesto, 0) * 100'), 'ASC']],
      limit: 10,
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social']
        }
      ]
    });
    
    // Rentabilidad promedio por tipo de proyecto (basándonos en el nombre como aproximación)
    const rentabilidadPromedioPorTipo = await Proyecto.findAll({
      attributes: [
        [sequelize.fn('substring', sequelize.col('nombre'), 1, 20), 'tipo_proyecto'],
        [sequelize.literal('AVG((presupuesto - costo_real) / NULLIF(presupuesto, 0) * 100)'), 'margen_promedio'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad_proyectos']
      ],
      where: {
        ...whereConditions
      },
      group: [sequelize.fn('substring', sequelize.col('nombre'), 1, 20)],
      having: sequelize.literal('COUNT(id) > 1'),
      order: [[sequelize.literal('margen_promedio'), 'DESC']]
    });
    
    // Calcular rentabilidad general
    const rentabilidadGeneral = await Proyecto.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('presupuesto')), 'presupuesto_total'],
        [sequelize.fn('SUM', sequelize.col('costo_real')), 'costo_total'],
        [
          sequelize.literal(`
            CASE 
              WHEN SUM(presupuesto) = 0 THEN 0
              ELSE (SUM(presupuesto) - SUM(costo_real)) / SUM(presupuesto) * 100
            END
          `),
          'margen_promedio'
        ]
      ],
      where: {
        ...whereConditions,
        estado: {
          [sequelize.Op.in]: ['en_curso', 'finalizado']
        },
        presupuesto: {
          [sequelize.Op.not]: null
        },
        costo_real: {
          [sequelize.Op.not]: null
        }
      }
    });
    
    // Distribución de costos por categoría
    const distribucionCostos = await CostoProyecto.findAll({
      attributes: [
        'tipo_costo',
        [sequelize.fn('SUM', sequelize.col('monto')), 'total']
      ],
      include: [
        {
          model: Proyecto,
          as: 'Proyecto',
          attributes: [],
          where: whereConditions,
          required: true
        }
      ],
      where: {
        estado: 'ejecutado',
        incluido_rentabilidad: true
      },
      group: ['tipo_costo'],
      order: [[sequelize.literal('total'), 'DESC']]
    });
    
    res.status(200).json({
      rentabilidad_general: rentabilidadGeneral[0] || {
        presupuesto_total: 0,
        costo_total: 0,
        margen_promedio: 0
      },
      proyectos_mas_rentables: proyectosMasRentables,
      proyectos_menos_rentables: proyectosMenosRentables,
      rentabilidad_promedio_por_tipo: rentabilidadPromedioPorTipo,
      distribucion_costos: distribucionCostos
    });
  } catch (error) {
    console.error('Error al obtener dashboard de rentabilidad:', error);
    res.status(500).json({ message: 'Error al obtener dashboard de rentabilidad', error: error.message });
  }
};

// Comparar rentabilidad entre proyectos
exports.compararRentabilidad = async (req, res) => {
  try {
    const { proyectos } = req.body;
    
    if (!proyectos || !Array.isArray(proyectos) || proyectos.length < 2) {
      return res.status(400).json({ message: 'Se requieren al menos dos IDs de proyectos para comparar' });
    }
    
    const resultados = await Promise.all(
      proyectos.map(async (proyectoId) => {
        const proyecto = await Proyecto.findByPk(proyectoId, {
          include: [
            {
              model: CostoProyecto,
              as: 'CostoProyectos',
              attributes: ['id', 'proyecto_id', 'concepto', 'tipo_costo', 'monto', 'estado', 'incluido_rentabilidad', 'proveedor'],
              where: { 
                estado: 'ejecutado',
                incluido_rentabilidad: true
              },
              required: false
            },
            {
              model: Cliente,
              as: 'Cliente',
              attributes: ['id', 'razon_social']
            }
          ]
        });
        
        if (!proyecto) return null;
        
        // Calcular costos totales ejecutados
        const costosTotales = proyecto.CostoProyectos.reduce((sum, costo) => sum + parseFloat(costo.monto), 0);
        
        // Por ahora usamos el presupuesto como ingresos esperados
        const ingresosEsperados = parseFloat(proyecto.presupuesto || 0);
        
        // Desglose de costos por tipo
        const costosPorTipo = {};
        proyecto.CostoProyectos.forEach(costo => {
          if (!costosPorTipo[costo.tipo_costo]) {
            costosPorTipo[costo.tipo_costo] = 0;
          }
          costosPorTipo[costo.tipo_costo] += parseFloat(costo.monto);
        });
        
        // Cálculos de rentabilidad
        const margenEsperado = ingresosEsperados > 0 
          ? ((ingresosEsperados - costosTotales) / ingresosEsperados * 100).toFixed(2)
          : 0;
        
        return {
          id: proyecto.id,
          nombre: proyecto.nombre,
          cliente: proyecto.Cliente ? proyecto.Cliente.razon_social : 'Sin cliente',
          presupuesto: ingresosEsperados,
          costos_totales: costosTotales,
          margen_bruto: ingresosEsperados - costosTotales,
          margen_porcentaje: parseFloat(margenEsperado),
          estado: proyecto.estado,
          fecha_inicio: proyecto.fecha_inicio,
          fecha_fin: proyecto.fecha_fin,
          duracion_dias: proyecto.fecha_fin && proyecto.fecha_inicio
            ? Math.ceil((new Date(proyecto.fecha_fin) - new Date(proyecto.fecha_inicio)) / (1000 * 60 * 60 * 24))
            : null,
          desglose_costos: costosPorTipo
        };
      })
    );
    
    // Filtrar proyectos no encontrados
    const resultadosFiltrados = resultados.filter(r => r !== null);
    
    if (resultadosFiltrados.length < 2) {
      return res.status(404).json({ message: 'No se encontraron suficientes proyectos para comparar' });
    }
    
    // Mejores proyectos
    const mejoresProyectos = resultadosFiltrados.map(p => ({
      id: p.id,
      nombre: p.nombre,
      cliente: p.cliente,
      presupuesto: p.presupuesto,
      costo_real: p.costos_totales,
      margen_calculado: p.margen_bruto,
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin
    })).sort((a, b) => b.margen_calculado - a.margen_calculado).slice(0, 5);
    
    // Peores proyectos
    const peoresProyectos = [...resultadosFiltrados.map(p => ({
      id: p.id,
      nombre: p.nombre,
      cliente: p.cliente,
      presupuesto: p.presupuesto,
      costo_real: p.costos_totales,
      margen_calculado: p.margen_bruto,
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin
    }))].sort((a, b) => a.margen_calculado - b.margen_calculado).slice(0, 5);

    // Calcular cuántos proyectos son rentables vs deficitarios
    const proyectosRentables = resultadosFiltrados.filter(p => (p.margen_bruto > 0)).length;
    const proyectosDeficitarios = resultadosFiltrados.filter(p => (p.margen_bruto < 0)).length;
    
    res.status(200).json({
      comparacion: resultadosFiltrados,
      mejorRentabilidad: mejoresProyectos[0],
      peorRentabilidad: peoresProyectos[0],
      proyectos_rentables: proyectosRentables,
      proyectos_deficitarios: proyectosDeficitarios
    });
  } catch (error) {
    console.error('Error al comparar rentabilidad:', error);
    res.status(500).json({ message: 'Error al comparar rentabilidad', error: error.message });
  }
}; 