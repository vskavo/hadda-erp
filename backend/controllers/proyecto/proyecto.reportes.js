/**
 * Controlador para generar reportes de proyectos
 */
const { models, Op } = require('./proyecto.utils');
const { Proyecto, Cliente, Usuario, CostoProyecto, AvanceProyecto, HitoProyecto, Curso, sequelize } = models;

// Generar informe de avance de proyecto
exports.generarInformeAvance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proyecto = await Proyecto.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social', 'rut']
        },
        {
          model: Usuario,
          as: 'Responsable',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });
    
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Obtener hitos
    const hitos = await HitoProyecto.findAll({
      where: { proyecto_id: id },
      order: [['fecha_objetivo', 'ASC']]
    });
    
    // Calcular hitos completados y pendientes
    const hitosCompletados = hitos.filter(h => h.completado);
    const hitosPendientes = hitos.filter(h => !h.completado);
    
    // Obtener historial de avance reciente
    const avanceReciente = await AvanceProyecto.findAll({
      where: { proyecto_id: id },
      order: [['fecha', 'DESC']],
      limit: 5,
      include: [{
        model: Usuario,
        as: 'Usuario',
        attributes: ['id', 'nombre', 'apellido']
      }]
    });
    
    // Calcular días transcurridos y restantes
    const hoy = new Date();
    const diasTranscurridos = Math.ceil((hoy - new Date(proyecto.fecha_inicio)) / (1000 * 60 * 60 * 24));
    
    let diasRestantes = null;
    let avanceEsperado = null;
    
    if (proyecto.fecha_fin) {
      diasRestantes = Math.ceil((new Date(proyecto.fecha_fin) - hoy) / (1000 * 60 * 60 * 24));
      
      const duracionTotal = Math.ceil(
        (new Date(proyecto.fecha_fin) - new Date(proyecto.fecha_inicio)) / (1000 * 60 * 60 * 24)
      );
      
      avanceEsperado = duracionTotal > 0 
        ? Math.round((diasTranscurridos / duracionTotal) * 100) 
        : null;
    }
    
    // Analizar desviación del avance
    let estadoAvance = 'A tiempo';
    let desviacion = 0;
    
    if (avanceEsperado !== null && proyecto.porcentaje_avance !== null) {
      desviacion = proyecto.porcentaje_avance - avanceEsperado;
      
      if (desviacion < -10) {
        estadoAvance = 'Retrasado';
      } else if (desviacion > 10) {
        estadoAvance = 'Adelantado';
      }
    }
    
    // Construir informe
    const informe = {
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion,
        cliente: proyecto.Cliente ? proyecto.Cliente.razon_social : 'Sin cliente',
        responsable: proyecto.Responsable ? 
          `${proyecto.Responsable.nombre} ${proyecto.Responsable.apellido}` : 
          'Sin responsable',
        fecha_inicio: proyecto.fecha_inicio,
        fecha_fin: proyecto.fecha_fin,
        estado: proyecto.estado,
        presupuesto_total: proyecto.presupuesto_total,
        costo_estimado: proyecto.costo_real
      },
      avance: {
        porcentaje_actual: proyecto.porcentaje_avance,
        porcentaje_esperado: avanceEsperado,
        desviacion,
        estado_avance: estadoAvance,
        dias_transcurridos: diasTranscurridos,
        dias_restantes: diasRestantes
      },
      hitos: {
        total: hitos.length,
        completados: hitosCompletados.length,
        pendientes: hitosPendientes.length,
        proximos_hitos: hitosPendientes.slice(0, 3)
      },
      historial_reciente: avanceReciente,
      fecha_informe: new Date()
    };
    
    res.status(200).json(informe);
  } catch (error) {
    console.error('Error al generar informe de avance:', error);
    res.status(500).json({ 
      message: 'Error al generar informe de avance', 
      error: error.message 
    });
  }
};

// Generar reporte general de proyectos
exports.reporteGeneral = async (req, res) => {
  try {
    const { 
      cliente_id, 
      estado, 
      prioridad,
      responsable_id,
      fecha_inicio_desde,
      fecha_inicio_hasta,
      fecha_fin_desde,
      fecha_fin_hasta
    } = req.query;
    
    // Construir condiciones de filtrado
    const whereConditions = {};
    
    if (cliente_id) {
      whereConditions.cliente_id = cliente_id;
    }
    
    if (estado) {
      whereConditions.estado = estado;
    }
    
    if (prioridad) {
      whereConditions.prioridad = prioridad;
    }
    
    if (responsable_id) {
      whereConditions.responsable_id = responsable_id;
    }
    
    if (fecha_inicio_desde && fecha_inicio_hasta) {
      whereConditions.fecha_inicio = {
        [Op.between]: [new Date(fecha_inicio_desde), new Date(fecha_inicio_hasta)]
      };
    } else if (fecha_inicio_desde) {
      whereConditions.fecha_inicio = {
        [Op.gte]: new Date(fecha_inicio_desde)
      };
    } else if (fecha_inicio_hasta) {
      whereConditions.fecha_inicio = {
        [Op.lte]: new Date(fecha_inicio_hasta)
      };
    }
    
    if (fecha_fin_desde && fecha_fin_hasta) {
      whereConditions.fecha_fin = {
        [Op.between]: [new Date(fecha_fin_desde), new Date(fecha_fin_hasta)]
      };
    } else if (fecha_fin_desde) {
      whereConditions.fecha_fin = {
        [Op.gte]: new Date(fecha_fin_desde)
      };
    } else if (fecha_fin_hasta) {
      whereConditions.fecha_fin = {
        [Op.lte]: new Date(fecha_fin_hasta)
      };
    }
    
    // Obtener proyectos según filtros
    const proyectos = await Proyecto.findAll({
      where: whereConditions,
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social', 'rut']
        },
        {
          model: Usuario,
          as: 'Responsable',
          attributes: ['id', 'nombre', 'apellido']
        }
      ],
      order: [['fecha_inicio', 'DESC']]
    });
    
    // Calcular totales y resúmenes
    const totalPresupuesto = proyectos.reduce((sum, p) => sum + parseFloat(p.presupuesto || 0), 0);
    const totalCostoReal = proyectos.reduce((sum, p) => sum + parseFloat(p.costo_real || 0), 0);
    
    const proyectosPorEstado = {};
    const proyectosPorPrioridad = {};
    const proyectosPorCliente = {};
    
    proyectos.forEach(proyecto => {
      // Contar por estado
      if (!proyectosPorEstado[proyecto.estado]) {
        proyectosPorEstado[proyecto.estado] = 0;
      }
      proyectosPorEstado[proyecto.estado]++;
      
      // Contar por prioridad
      if (!proyectosPorPrioridad[proyecto.prioridad]) {
        proyectosPorPrioridad[proyecto.prioridad] = 0;
      }
      proyectosPorPrioridad[proyecto.prioridad]++;
      
      // Contar por cliente
      const clienteNombre = proyecto.Cliente ? proyecto.Cliente.razon_social : 'Sin cliente';
      if (!proyectosPorCliente[clienteNombre]) {
        proyectosPorCliente[clienteNombre] = 0;
      }
      proyectosPorCliente[clienteNombre]++;
    });
    
    // Calcular métricas de avance
    const avancePromedio = proyectos.length > 0 
      ? proyectos.reduce((sum, p) => sum + (p.porcentaje_avance || 0), 0) / proyectos.length 
      : 0;
    
    // Calcular rentabilidad promedio de proyectos que tienen costo y presupuesto
    const proyectosConMargen = proyectos.filter(p => 
      p.presupuesto !== null && 
      p.presupuesto > 0 && 
      p.costo_real !== null
    );
    
    const margenPromedio = proyectosConMargen.length > 0
      ? proyectosConMargen.reduce((sum, p) => {
          const margen = ((p.presupuesto - p.costo_real) / p.presupuesto) * 100;
          return sum + margen;
        }, 0) / proyectosConMargen.length
      : 0;
    
    // Construir datos de reporte
    const reporte = {
      fecha_generacion: new Date(),
      filtros_aplicados: {
        cliente_id,
        estado,
        prioridad,
        responsable_id,
        fecha_inicio_desde,
        fecha_inicio_hasta,
        fecha_fin_desde,
        fecha_fin_hasta
      },
      resumen: {
        total_proyectos: proyectos.length,
        total_presupuesto: totalPresupuesto,
        total_costo_real: totalCostoReal,
        avance_promedio: parseFloat(avancePromedio.toFixed(2)),
        margen_promedio: parseFloat(margenPromedio.toFixed(2))
      },
      distribucion: {
        por_estado: proyectosPorEstado,
        por_prioridad: proyectosPorPrioridad,
        por_cliente: proyectosPorCliente
      },
      proyectos: proyectos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        cliente: p.Cliente ? p.Cliente.razon_social : 'Sin cliente',
        responsable: p.Responsable ? `${p.Responsable.nombre} ${p.Responsable.apellido}` : 'Sin responsable',
        fecha_inicio: p.fecha_inicio,
        fecha_fin: p.fecha_fin,
        estado: p.estado,
        prioridad: p.prioridad,
        presupuesto_total: p.presupuesto_total,
        costo_estimado: p.costo_real,
        margen_estimado: p.margen_estimado,
        porcentaje_avance: p.porcentaje_avance
      }))
    };
    
    res.status(200).json(reporte);
  } catch (error) {
    console.error('Error al generar reporte general de proyectos:', error);
    res.status(500).json({ 
      message: 'Error al generar reporte general de proyectos', 
      error: error.message 
    });
  }
};

// Generar reporte de desempeño de proyectos
exports.reporteDesempeno = async (req, res) => {
  try {
    const { periodo } = req.query; // 'mes', 'trimestre', 'semestre', 'anual'
    const anio = parseInt(req.query.anio || new Date().getFullYear());
    const mes = parseInt(req.query.mes || (new Date().getMonth() + 1));
    
    // Determinar fechas según periodo
    let fechaInicio, fechaFin;
    const hoy = new Date();
    
    switch (periodo) {
      case 'mes':
        fechaInicio = new Date(anio, mes - 1, 1);
        fechaFin = new Date(anio, mes, 0); // Último día del mes
        break;
      case 'trimestre':
        const trimestre = Math.ceil(mes / 3);
        fechaInicio = new Date(anio, (trimestre - 1) * 3, 1);
        fechaFin = new Date(anio, trimestre * 3, 0);
        break;
      case 'semestre':
        const semestre = Math.ceil(mes / 6);
        fechaInicio = new Date(anio, (semestre - 1) * 6, 1);
        fechaFin = new Date(anio, semestre * 6, 0);
        break;
      case 'anual':
        fechaInicio = new Date(anio, 0, 1);
        fechaFin = new Date(anio, 11, 31);
        break;
      default:
        // Por defecto, último mes
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    }
    
    // Encontrar proyectos activos en el periodo
    const proyectos = await Proyecto.findAll({
      where: {
        [Op.or]: [
          {
            // Proyectos iniciados en el periodo
            fecha_inicio: {
              [Op.between]: [fechaInicio, fechaFin]
            }
          },
          {
            // Proyectos finalizados en el periodo
            fecha_fin: {
              [Op.between]: [fechaInicio, fechaFin]
            }
          },
          {
            // Proyectos activos durante el periodo
            [Op.and]: [
              { 
                fecha_inicio: { 
                  [Op.lte]: fechaFin 
                } 
              },
              { 
                [Op.or]: [
                  { fecha_fin: { [Op.gte]: fechaInicio } },
                  { fecha_fin: null }
                ]
              }
            ]
          }
        ]
      },
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social']
        },
        {
          model: Usuario,
          as: 'Responsable',
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: AvanceProyecto,
          as: 'Avances',
          where: {
            fecha: {
              [Op.between]: [fechaInicio, fechaFin]
            }
          },
          required: false
        },
        {
          model: HitoProyecto,
          as: 'Hitos',
          where: {
            [Op.or]: [
              {
                fecha_objetivo: {
                  [Op.between]: [fechaInicio, fechaFin]
                }
              },
              {
                fecha_completado: {
                  [Op.between]: [fechaInicio, fechaFin]
                }
              }
            ]
          },
          required: false
        }
      ]
    });
    
    // Analizar métricas de desempeño
    const metricas = {
      proyectos_iniciados: proyectos.filter(p => 
        new Date(p.fecha_inicio) >= fechaInicio && 
        new Date(p.fecha_inicio) <= fechaFin
      ).length,
      
      proyectos_finalizados: proyectos.filter(p => 
        p.fecha_fin && 
        new Date(p.fecha_fin) >= fechaInicio && 
        new Date(p.fecha_fin) <= fechaFin
      ).length,
      
      total_hitos_planificados: proyectos.reduce((sum, p) => 
        sum + p.Hitos.filter(h => 
          new Date(h.fecha_objetivo) >= fechaInicio && 
          new Date(h.fecha_objetivo) <= fechaFin
        ).length, 0),
      
      total_hitos_completados: proyectos.reduce((sum, p) => 
        sum + p.Hitos.filter(h => 
          h.completado && 
          h.fecha_completado && 
          new Date(h.fecha_completado) >= fechaInicio && 
          new Date(h.fecha_completado) <= fechaFin
        ).length, 0),
      
      actualizaciones_avance: proyectos.reduce((sum, p) => 
        sum + p.Avances.length, 0)
    };
    
    // Análisis de cumplimiento de plazos
    const proyectosFinalizados = proyectos.filter(p => 
      p.fecha_fin && 
      new Date(p.fecha_fin) >= fechaInicio && 
      new Date(p.fecha_fin) <= fechaFin
    );
    
    let proyectosEnPlazo = 0;
    let proyectosConRetraso = 0;
    let diasRetrasoPromedio = 0;
    
    proyectosFinalizados.forEach(p => {
      if (p.fecha_fin_original) {
        const fechaFinOriginal = new Date(p.fecha_fin_original);
        const fechaFinReal = new Date(p.fecha_fin);
        const diferenciaDias = Math.ceil((fechaFinReal - fechaFinOriginal) / (1000 * 60 * 60 * 24));
        
        if (diferenciaDias <= 0) {
          proyectosEnPlazo++;
        } else {
          proyectosConRetraso++;
          diasRetrasoPromedio += diferenciaDias;
        }
      }
    });
    
    if (proyectosConRetraso > 0) {
      diasRetrasoPromedio = diasRetrasoPromedio / proyectosConRetraso;
    }
    
    // Construir reporte
    const reporte = {
      periodo: {
        tipo: periodo,
        anio,
        mes,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      },
      metricas_generales: {
        proyectos_activos: proyectos.length,
        proyectos_iniciados: metricas.proyectos_iniciados,
        proyectos_finalizados: metricas.proyectos_finalizados,
        hitos_planificados: metricas.total_hitos_planificados,
        hitos_completados: metricas.total_hitos_completados,
        tasa_cumplimiento_hitos: metricas.total_hitos_planificados > 0 
          ? (metricas.total_hitos_completados / metricas.total_hitos_planificados * 100).toFixed(2) 
          : 0,
        actualizaciones_avance: metricas.actualizaciones_avance
      },
      analisis_plazos: {
        proyectos_finalizados: proyectosFinalizados.length,
        proyectos_en_plazo: proyectosEnPlazo,
        proyectos_con_retraso: proyectosConRetraso,
        porcentaje_cumplimiento: proyectosFinalizados.length > 0 
          ? (proyectosEnPlazo / proyectosFinalizados.length * 100).toFixed(2) 
          : 0,
        dias_retraso_promedio: parseFloat(diasRetrasoPromedio.toFixed(2))
      },
      proyectos_destacados: {
        mayor_avance: proyectos.length > 0 
          ? proyectos.reduce((prev, current) => 
              (prev.porcentaje_avance > current.porcentaje_avance) ? prev : current
            )
          : null,
        mayor_rentabilidad: proyectos.length > 0 
          ? proyectos.reduce((prev, current) => 
              (prev.margen_estimado > current.margen_estimado) ? prev : current
            )
          : null
      },
      detalle_proyectos: proyectos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        cliente: p.Cliente ? p.Cliente.razon_social : 'Sin cliente',
        responsable: p.Responsable ? `${p.Responsable.nombre} ${p.Responsable.apellido}` : 'Sin responsable',
        fecha_inicio: p.fecha_inicio,
        fecha_fin: p.fecha_fin,
        estado: p.estado,
        porcentaje_avance: p.porcentaje_avance,
        hitos_completados: p.Hitos.filter(h => h.completado).length,
        hitos_pendientes: p.Hitos.filter(h => !h.completado).length,
        actualizaciones_periodo: p.Avances.length
      }))
    };
    
    res.status(200).json(reporte);
  } catch (error) {
    console.error('Error al generar reporte de desempeño:', error);
    res.status(500).json({ 
      message: 'Error al generar reporte de desempeño', 
      error: error.message 
    });
  }
};

// Generar reporte detallado de un proyecto específico
exports.reporteDetalladoProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proyecto = await Proyecto.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social', 'rut']
        },
        {
          model: Usuario,
          as: 'Responsable',
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: CostoProyecto,
          as: 'CostoProyectos',
          attributes: ['id', 'proyecto_id', 'concepto', 'tipo_costo', 'monto', 'fecha', 'estado', 'proveedor', 'aprobado', 'aprobado_por']
        },
        {
          model: HitoProyecto,
          as: 'Hitos',
          include: [
            {
              model: Usuario,
              as: 'Usuario',
              attributes: ['id', 'nombre', 'apellido']
            }
          ]
        },
        {
          model: AvanceProyecto,
          as: 'Avances',
          limit: 10,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: Usuario,
              as: 'Usuario',
              attributes: ['id', 'nombre', 'apellido']
            }
          ]
        }
      ]
    });
    
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Calcular métricas financieras
    const costosTotales = proyecto.CostoProyectos.reduce((sum, costo) => sum + parseFloat(costo.monto || 0), 0);
    const presupuesto = parseFloat(proyecto.presupuesto || 0);
    const margen = presupuesto - costosTotales;
    const margenPorcentaje = presupuesto > 0 ? (margen / presupuesto * 100) : 0;
    
    // Agrupar costos por categoría
    const costosPorCategoria = {};
    proyecto.CostoProyectos.forEach(costo => {
      if (!costosPorCategoria[costo.tipo_costo]) {
        costosPorCategoria[costo.tipo_costo] = 0;
      }
      costosPorCategoria[costo.tipo_costo] += parseFloat(costo.monto || 0);
    });
    
    // Construir respuesta
    const reporte = {
      fecha_generacion: new Date(),
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion,
        cliente: proyecto.Cliente ? proyecto.Cliente.razon_social : 'Sin cliente',
        responsable: proyecto.Responsable 
          ? `${proyecto.Responsable.nombre} ${proyecto.Responsable.apellido}`
          : 'Sin asignar',
        estado: proyecto.estado,
        prioridad: proyecto.prioridad,
        porcentaje_avance: proyecto.porcentaje_avance,
        fecha_inicio: proyecto.fecha_inicio,
        fecha_fin: proyecto.fecha_fin,
        observaciones: proyecto.observaciones
      },
      finanzas: {
        presupuesto: proyecto.presupuesto,
        costo_actual: costosTotales,
        margen_actual: margen,
        margen_porcentaje: parseFloat(margenPorcentaje.toFixed(2)),
        costos_por_categoria: costosPorCategoria
      },
      hitos: {
        total: proyecto.Hitos.length,
        completados: proyecto.Hitos.filter(h => h.completado).length,
        pendientes: proyecto.Hitos.filter(h => !h.completado).length
      },
      avance: {
        porcentaje_actual: proyecto.porcentaje_avance,
        porcentaje_esperado: proyecto.porcentaje_esperado,
        desviacion_avance: proyecto.desviacion_avance,
        estado_avance: proyecto.estado_avance,
        dias_transcurridos: proyecto.dias_transcurridos,
        dias_restantes: proyecto.dias_restantes
      },
      historial_reciente: proyecto.Avances.map(a => ({
        fecha: a.fecha,
        porcentaje_anterior: a.porcentaje_anterior,
        porcentaje_nuevo: a.porcentaje_nuevo,
        incremento: a.porcentaje_nuevo - a.porcentaje_anterior,
        nota: a.nota,
        usuario: a.Usuario ? `${a.Usuario.nombre} ${a.Usuario.apellido}` : 'Sistema'
      }))
    };
    
    res.status(200).json(reporte);
  } catch (error) {
    console.error('Error al generar reporte detallado del proyecto:', error);
    res.status(500).json({ 
      message: 'Error al generar reporte detallado del proyecto', 
      error: error.message 
    });
  }
};

// Generar reporte de rentabilidad por cliente
exports.reporteRentabilidadClientes = async (req, res) => {
  try {
    const { anio = new Date().getFullYear() } = req.query;
    
    // Obtener todos los clientes con proyectos
    const clientes = await Cliente.findAll({
      attributes: ['id', 'razon_social', 'rut'],
      include: [
        {
          model: Proyecto,
          as: 'Proyectos',
          attributes: ['id', 'nombre', 'presupuesto_total', 'costo_estimado', 'margen_estimado', 'fecha_inicio', 'fecha_fin', 'estado'],
          where: sequelize.literal(`EXTRACT(YEAR FROM fecha_inicio) = ${anio}`),
          required: true
        }
      ]
    });
    
    // Calcular métricas por cliente
    const resumenClientes = clientes.map(cliente => {
      const proyectos = cliente.Proyectos;
      
      const presupuestoTotal = proyectos.reduce((sum, p) => sum + parseFloat(p.presupuesto_total || 0), 0);
      const costoTotal = proyectos.reduce((sum, p) => sum + parseFloat(p.costo_estimado || 0), 0);
      const margenTotal = presupuestoTotal - costoTotal;
      const margenPorcentaje = presupuestoTotal > 0 ? (margenTotal / presupuestoTotal * 100) : 0;
      
      const proyectosRentables = proyectos.filter(p => p.margen_estimado > 0).length;
      const proyectosDeficitarios = proyectos.filter(p => p.margen_estimado < 0).length;
      
      return {
        cliente: {
          id: cliente.id,
          razon_social: cliente.razon_social,
          rut: cliente.rut
        },
        metricas: {
          total_proyectos: proyectos.length,
          proyectos_rentables: proyectosRentables,
          proyectos_deficitarios: proyectosDeficitarios,
          presupuesto_total: presupuestoTotal,
          costo_total: costoTotal,
          margen_total: margenTotal,
          margen_porcentaje: parseFloat(margenPorcentaje.toFixed(2)),
          proyecto_mas_rentable: proyectos.length > 0 
            ? proyectos.reduce((prev, current) => 
                (prev.margen_estimado > current.margen_estimado) ? prev : current
              )
            : null,
          proyecto_menos_rentable: proyectos.length > 0 
            ? proyectos.reduce((prev, current) => 
                (prev.margen_estimado < current.margen_estimado) ? prev : current
              )
            : null
        },
        proyectos: proyectos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          presupuesto_total: p.presupuesto_total,
          costo_estimado: p.costo_estimado,
          margen_estimado: p.margen_estimado,
          margen_porcentaje: p.margen_estimado ? 
            parseFloat(((p.margen_estimado / p.presupuesto_total) * 100).toFixed(2)) : 0,
          estado: p.estado,
          fecha_inicio: p.fecha_inicio,
          fecha_fin: p.fecha_fin
        }))
      };
    });
    
    // Ordernar clientes por margen total
    resumenClientes.sort((a, b) => b.metricas.margen_total - a.metricas.margen_total);
    
    // Calcular totales generales
    const totalPresupuesto = resumenClientes.reduce((sum, c) => sum + c.metricas.presupuesto_total, 0);
    const totalCosto = resumenClientes.reduce((sum, c) => sum + c.metricas.costo_total, 0);
    const totalMargen = totalPresupuesto - totalCosto;
    const totalMargenPorcentaje = totalPresupuesto > 0 ? (totalMargen / totalPresupuesto * 100) : 0;
    
    const reporte = {
      anio,
      fecha_generacion: new Date(),
      resumen_general: {
        total_clientes: clientes.length,
        total_proyectos: clientes.reduce((sum, c) => sum + c.Proyectos.length, 0),
        presupuesto_total: totalPresupuesto,
        costo_total: totalCosto,
        margen_total: totalMargen,
        margen_porcentaje: parseFloat(totalMargenPorcentaje.toFixed(2))
      },
      clientes: resumenClientes
    };
    
    res.status(200).json(reporte);
  } catch (error) {
    console.error('Error al generar reporte de rentabilidad por clientes:', error);
    res.status(500).json({ 
      message: 'Error al generar reporte de rentabilidad por clientes', 
      error: error.message 
    });
  }
}; 