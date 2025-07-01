const { 
  Cliente, 
  Curso, 
  Factura, 
  Ingreso, 
  Egreso, 
  Proyecto, 
  sequelize 
} = require('../models');
const { Op } = require('sequelize');

// Controlador del Dashboard
// Estas funciones deberían reemplazarse con consultas reales a la base de datos

/**
 * Obtener estadísticas generales para el dashboard
 */
exports.getEstadisticas = async (req, res) => {
  try {
    // Aquí deberían ir consultas reales a la base de datos
    // Por ejemplo:
    
    /* 
    // Contar clientes activos
    const clientesCount = await Cliente.count({
      where: { activo: true }
    });
    
    // Contar cursos activos
    const cursosCount = await Curso.count({
      where: { 
        estado: 'en_progreso',
        fecha_fin: {
          [Op.gte]: new Date()
        }
      }
    });
    
    // Calcular ingresos del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const ingresosMes = await Ingreso.sum('monto', {
      where: {
        fecha: {
          [Op.gte]: inicioMes
        },
        estado: 'aprobado'
      }
    });
    
    // Contar proyectos activos
    const proyectosCount = await Proyecto.count({
      where: { 
        estado: 'activo'
      }
    });
    */
    
    // Por ahora devolvemos datos estáticos de ejemplo
    res.status(200).json({
      clientes: { title: 'Clientes', value: 42 },
      cursos: { title: 'Cursos Activos', value: 8 },
      ingresos: { title: 'Ingresos Mensuales', value: '$3.450.000' },
      proyectos: { title: 'Proyectos en Curso', value: 6 }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas', 
      error: error.message 
    });
  }
};

/**
 * Obtener actividades recientes para el dashboard
 */
exports.getActividades = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Aquí deberían ir consultas reales a la base de datos
    // Por ejemplo:
    
    /*
    // Obtener últimos clientes registrados
    const nuevosClientes = await Cliente.findAll({
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'razon_social', 'rut', 'createdAt']
    });
    
    // Obtener últimos cursos finalizados
    const cursosFinalizados = await Curso.findAll({
      where: { 
        estado: 'finalizado',
        fecha_fin: {
          [Op.lte]: new Date(),
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        }
      },
      order: [['fecha_fin', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'nombre', 'codigo', 'fecha_fin']
    });
    
    // Obtener últimas facturas emitidas
    const facturasEmitidas = await Factura.findAll({
      where: {
        estado: 'emitida'
      },
      order: [['fecha_emision', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'numero_factura', 'monto_total', 'fecha_emision']
    });
    
    // Combinar y formatear los resultados
    */
    
    // Por ahora devolvemos datos estáticos de ejemplo
    res.status(200).json([
      { id: 1, type: 'client', title: 'Nuevo cliente', description: 'Se registró Empresa ABC', time: '2 horas atrás' },
      { id: 2, type: 'course', title: 'Curso finalizado', description: 'Curso de Excel Avanzado', time: '1 día atrás' },
      { id: 3, type: 'invoice', title: 'Factura emitida', description: 'Factura #1234 por $750.000', time: '2 días atrás' },
      { id: 4, type: 'project', title: 'Proyecto iniciado', description: 'Capacitación corporativa XYZ', time: '3 días atrás' }
    ]);
  } catch (error) {
    console.error('Error al obtener actividades recientes:', error);
    res.status(500).json({ 
      message: 'Error al obtener actividades recientes', 
      error: error.message 
    });
  }
};

/**
 * Obtener próximos cursos para el dashboard
 */
exports.getProximosCursos = async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    
    // Aquí deberían ir consultas reales a la base de datos
    // Por ejemplo:
    
    /*
    // Obtener próximos cursos
    const proximosCursos = await Curso.findAll({
      where: {
        fecha_inicio: {
          [Op.gt]: new Date()
        },
        estado: 'programado'
      },
      order: [['fecha_inicio', 'ASC']],
      limit: parseInt(limit),
      include: [
        {
          model: Participante,
          as: 'participantes',
          attributes: []
        }
      ],
      attributes: [
        'id', 
        'nombre', 
        'fecha_inicio',
        [sequelize.fn('COUNT', sequelize.col('participantes.id')), 'participantes_count']
      ],
      group: ['Curso.id']
    });
    
    // Formatear los resultados
    const cursosFormateados = proximosCursos.map(curso => ({
      id: curso.id,
      name: curso.nombre,
      date: format(new Date(curso.fecha_inicio), 'dd/MM/yyyy'),
      participants: curso.dataValues.participantes_count || 0
    }));
    */
    
    // Por ahora devolvemos datos estáticos de ejemplo
    res.status(200).json([
      { id: 1, name: 'Liderazgo Efectivo', date: '15 de diciembre, 2023', participants: 12 },
      { id: 2, name: 'Excel Intermedio', date: '20 de diciembre, 2023', participants: 8 },
      { id: 3, name: 'Atención al Cliente', date: '05 de enero, 2024', participants: 15 }
    ]);
  } catch (error) {
    console.error('Error al obtener próximos cursos:', error);
    res.status(500).json({ 
      message: 'Error al obtener próximos cursos', 
      error: error.message 
    });
  }
};

/**
 * Obtener resumen financiero para el dashboard
 */
exports.getResumenFinanciero = async (req, res) => {
  try {
    const { periodo = 'mensual' } = req.query;
    
    // Aquí deberían ir consultas reales a la base de datos
    // Por ejemplo:
    
    /*
    // Definir rango de fechas según el periodo
    let fechaInicio;
    const fechaFin = new Date();
    
    if (periodo === 'mensual') {
      fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 5);
      fechaInicio.setDate(1);
      fechaInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'anual') {
      fechaInicio = new Date();
      fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
      fechaInicio.setHours(0, 0, 0, 0);
    } else {
      // Por defecto, últimos 30 días
      fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 30);
      fechaInicio.setHours(0, 0, 0, 0);
    }
    
    // Obtener ingresos por mes
    const ingresos = await Ingreso.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        },
        estado: 'aprobado'
      },
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('fecha')), 'mes'],
        [sequelize.fn('SUM', sequelize.col('monto')), 'total']
      ],
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('fecha'))],
      order: [[sequelize.fn('date_trunc', 'month', sequelize.col('fecha')), 'ASC']]
    });
    
    // Obtener egresos por mes
    const egresos = await Egreso.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        },
        estado: 'aprobado'
      },
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('fecha')), 'mes'],
        [sequelize.fn('SUM', sequelize.col('monto')), 'total']
      ],
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('fecha'))],
      order: [[sequelize.fn('date_trunc', 'month', sequelize.col('fecha')), 'ASC']]
    });
    
    // Calcular totales
    const ingresosTotal = ingresos.reduce((sum, item) => sum + parseFloat(item.dataValues.total), 0);
    const egresosTotal = egresos.reduce((sum, item) => sum + parseFloat(item.dataValues.total), 0);
    const resultadoNeto = ingresosTotal - egresosTotal;
    
    // Formatear los datos para gráficos
    */
    
    // Por ahora devolvemos datos estáticos de ejemplo
    res.status(200).json({
      ingresosTotal: '$10.850.000',
      egresosTotal: '$5.320.000',
      resultadoNeto: '$5.530.000',
      grafico: {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'],
        ingresos: [2800000, 3200000, 2750000, 3300000, 3450000],
        egresos: [1500000, 1800000, 1420000, 1700000, 1600000]
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen financiero:', error);
    res.status(500).json({ 
      message: 'Error al obtener resumen financiero', 
      error: error.message 
    });
  }
};

/**
 * Obtener dashboard completo para la vista principal
 */
exports.getDashboardCompleto = async (req, res) => {
  try {
    console.log('Solicitud a dashboard completo recibida');
    
    // En lugar de hacer múltiples consultas que pueden ser lentas,
    // devolvemos datos estáticos de ejemplo para mejorar el rendimiento
    
    // Datos de ejemplo
    const dashboardData = {
      estadisticas: {
        clientes: { title: 'Clientes', value: 42 },
        cursos: { title: 'Cursos Activos', value: 8 },
        ingresos: { title: 'Ingresos Mensuales', value: '$3.450.000' },
        proyectos: { title: 'Proyectos en Curso', value: 6 }
      },
      actividades: [
        { id: 1, type: 'client', title: 'Nuevo cliente', description: 'Se registró Empresa ABC', time: '2 horas atrás' },
        { id: 2, type: 'course', title: 'Curso finalizado', description: 'Curso de Excel Avanzado', time: '1 día atrás' },
        { id: 3, type: 'invoice', title: 'Factura emitida', description: 'Factura #1234 por $750.000', time: '2 días atrás' },
        { id: 4, type: 'project', title: 'Proyecto iniciado', description: 'Capacitación corporativa XYZ', time: '3 días atrás' }
      ],
      proximosCursos: [
        { id: 1, name: 'Liderazgo Efectivo', date: '15 de diciembre, 2023', participants: 12 },
        { id: 2, name: 'Excel Intermedio', date: '20 de diciembre, 2023', participants: 8 },
        { id: 3, name: 'Atención al Cliente', date: '05 de enero, 2024', participants: 15 }
      ],
      resumenFinanciero: {
        ingresos: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          data: [1800000, 2100000, 1950000, 2400000, 2850000, 3450000]
        },
        egresos: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          data: [1500000, 1650000, 1800000, 1950000, 2250000, 2700000]
        },
        facturasPendientes: [
          { id: 1, cliente: 'Empresa XYZ', monto: '$2.500.000', vencimiento: '15/12/2023' },
          { id: 2, cliente: 'Corporación ABC', monto: '$1.800.000', vencimiento: '20/12/2023' },
          { id: 3, cliente: 'Servicios 123', monto: '$950.000', vencimiento: '28/12/2023' }
        ]
      }
    };
    
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error al obtener dashboard completo:', error);
    res.status(500).json({ 
      message: 'Error al obtener dashboard completo', 
      error: error.message 
    });
  }
}; 