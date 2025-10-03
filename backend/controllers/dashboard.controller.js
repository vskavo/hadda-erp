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
// Consulta datos reales de la base de datos

/**
 * Obtener estadísticas generales para el dashboard
 */
exports.getEstadisticas = async (req, res) => {
  try {
    // Contar clientes activos
    const clientesCount = await Cliente.count({
      where: { estado: 'activo' }
    });
    
    // Contar cursos activos (estado activo y fecha_fin mayor o igual a hoy)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const cursosCount = await Curso.count({
      where: { 
        estado: 'activo',
        fecha_fin: {
          [Op.gte]: hoy
        }
      }
    });
    
    // Calcular ingresos del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const finMes = new Date();
    finMes.setMonth(finMes.getMonth() + 1);
    finMes.setDate(0);
    finMes.setHours(23, 59, 59, 999);
    
    const ingresosMes = await Ingreso.sum('monto', {
      where: {
        fecha: {
          [Op.between]: [inicioMes, finMes]
        },
        estado: 'confirmado'
      }
    }) || 0; // Si no hay ingresos, devolver 0
    
    // Formatear ingresos a CLP
    const ingresosFormateados = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(ingresosMes);
    
    // Contar proyectos en curso
    const proyectosCount = await Proyecto.count({
      where: { 
        estado: 'En curso'
      }
    });
    
    res.status(200).json({
      clientes: { title: 'Clientes', value: clientesCount },
      cursos: { title: 'Cursos Activos', value: cursosCount },
      ingresos: { title: 'Ingresos Mensuales', value: ingresosFormateados },
      proyectos: { title: 'Proyectos en Curso', value: proyectosCount }
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
    const limitInt = parseInt(limit);
    
    // Obtener últimos clientes registrados
    const nuevosClientes = await Cliente.findAll({
      order: [['created_at', 'DESC']],
      limit: limitInt,
      attributes: ['id', 'razon_social', 'rut', 'created_at']
    });
    
    // Obtener últimos cursos creados
    const cursosRecientes = await Curso.findAll({
      order: [['created_at', 'DESC']],
      limit: limitInt,
      attributes: ['id', 'nombre', 'codigo_sence', 'created_at']
    });
    
    // Obtener últimos ingresos confirmados
    const ingresosRecientes = await Ingreso.findAll({
      where: { 
        estado: 'confirmado'
      },
      order: [['fecha', 'DESC']],
      limit: limitInt,
      attributes: ['id', 'descripcion', 'monto', 'fecha'],
      include: [{
        model: Cliente,
        attributes: ['razon_social'],
        required: false
      }]
    });
    
    // Obtener últimos proyectos creados
    const proyectosRecientes = await Proyecto.findAll({
      order: [['created_at', 'DESC']],
      limit: limitInt,
      attributes: ['id', 'nombre', 'created_at'],
      include: [{
        model: Cliente,
        attributes: ['razon_social'],
        required: false
      }]
    });
    
    // Formatear y combinar todas las actividades
    const actividades = [];
    
    // Función auxiliar para calcular tiempo relativo
    const tiempoRelativo = (fecha) => {
      const ahora = new Date();
      const diff = ahora - new Date(fecha);
      const minutos = Math.floor(diff / 60000);
      const horas = Math.floor(diff / 3600000);
      const dias = Math.floor(diff / 86400000);
      
      if (minutos < 60) return `${minutos} minuto${minutos !== 1 ? 's' : ''} atrás`;
      if (horas < 24) return `${horas} hora${horas !== 1 ? 's' : ''} atrás`;
      return `${dias} día${dias !== 1 ? 's' : ''} atrás`;
    };
    
    // Agregar clientes
    nuevosClientes.forEach(cliente => {
      actividades.push({
        id: `client-${cliente.id}`,
        type: 'client',
        title: 'Nuevo cliente',
        description: `Se registró ${cliente.razon_social}`,
        time: tiempoRelativo(cliente.created_at),
        fecha: cliente.created_at
      });
    });
    
    // Agregar cursos
    cursosRecientes.forEach(curso => {
      actividades.push({
        id: `course-${curso.id}`,
        type: 'course',
        title: 'Nuevo curso',
        description: `${curso.nombre}`,
        time: tiempoRelativo(curso.created_at),
        fecha: curso.created_at
      });
    });
    
    // Agregar ingresos
    ingresosRecientes.forEach(ingreso => {
      const montoFormateado = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(ingreso.monto);
      
      const clienteNombre = ingreso.Cliente?.razon_social || 'Cliente';
      
      actividades.push({
        id: `invoice-${ingreso.id}`,
        type: 'invoice',
        title: 'Ingreso confirmado',
        description: `${clienteNombre} - ${montoFormateado}`,
        time: tiempoRelativo(ingreso.fecha),
        fecha: ingreso.fecha
      });
    });
    
    // Agregar proyectos
    proyectosRecientes.forEach(proyecto => {
      const clienteNombre = proyecto.Cliente?.razon_social || 'Cliente';
      
      actividades.push({
        id: `project-${proyecto.id}`,
        type: 'project',
        title: 'Nuevo proyecto',
        description: `${proyecto.nombre} - ${clienteNombre}`,
        time: tiempoRelativo(proyecto.created_at),
        fecha: proyecto.created_at
      });
    });
    
    // Ordenar por fecha más reciente y limitar resultados
    actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const actividadesLimitadas = actividades.slice(0, limitInt);
    
    // Eliminar el campo fecha antes de enviar la respuesta
    const actividadesFinales = actividadesLimitadas.map(({ fecha, ...rest }) => rest);
    
    res.status(200).json(actividadesFinales);
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
    const limitInt = parseInt(limit);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Obtener próximos cursos con participantes
    const proximosCursos = await Curso.findAll({
      where: {
        fecha_inicio: {
          [Op.gt]: hoy
        }
      },
      order: [['fecha_inicio', 'ASC']],
      limit: limitInt,
      attributes: ['id', 'nombre', 'fecha_inicio', 'nro_participantes']
    });
    
    // Formatear los resultados
    const cursosFormateados = await Promise.all(proximosCursos.map(async (curso) => {
      // Contar participantes reales del curso
      const { Participante } = require('../models');
      const participantesCount = await Participante.count({
        where: { curso_id: curso.id }
      });
      
      // Formatear fecha a formato español
      const fecha = new Date(curso.fecha_inicio);
      const opciones = { day: '2-digit', month: 'long', year: 'numeric' };
      const fechaFormateada = fecha.toLocaleDateString('es-CL', opciones);
      
      return {
      id: curso.id,
      name: curso.nombre,
        date: fechaFormateada,
        participants: participantesCount || curso.nro_participantes || 0
      };
    }));
    
    res.status(200).json(cursosFormateados);
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
    
    // ============ ESTADÍSTICAS ============
    // Contar clientes activos
    const clientesCount = await Cliente.count({
      where: { estado: 'activo' }
    });
    
    // Contar cursos activos
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const cursosCount = await Curso.count({
      where: { 
        estado: 'activo',
        fecha_fin: {
          [Op.gte]: hoy
        }
      }
    });
    
    // Calcular ingresos del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const finMes = new Date();
    finMes.setMonth(finMes.getMonth() + 1);
    finMes.setDate(0);
    finMes.setHours(23, 59, 59, 999);
    
    const ingresosMes = await Ingreso.sum('monto', {
      where: {
        fecha: {
          [Op.between]: [inicioMes, finMes]
        },
        estado: 'confirmado'
      }
    }) || 0;
    
    const ingresosFormateados = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(ingresosMes);
    
    // Contar proyectos en curso
    const proyectosCount = await Proyecto.count({
      where: { 
        estado: 'En curso'
      }
    });
    
    // ============ ACTIVIDADES RECIENTES ============
    const limitActividades = 5;
    
    const nuevosClientes = await Cliente.findAll({
      order: [['created_at', 'DESC']],
      limit: limitActividades,
      attributes: ['id', 'razon_social', 'created_at']
    });
    
    const cursosRecientes = await Curso.findAll({
      order: [['created_at', 'DESC']],
      limit: limitActividades,
      attributes: ['id', 'nombre', 'created_at']
    });
    
    const ingresosRecientes = await Ingreso.findAll({
      where: {
        estado: 'confirmado'
      },
      order: [['fecha', 'DESC']],
      limit: limitActividades,
      attributes: ['id', 'descripcion', 'monto', 'fecha'],
      include: [{
        model: Cliente,
        attributes: ['razon_social'],
        required: false
      }]
    });
    
    const proyectosRecientes = await Proyecto.findAll({
      order: [['created_at', 'DESC']],
      limit: limitActividades,
      attributes: ['id', 'nombre', 'created_at'],
      include: [{
        model: Cliente,
        attributes: ['razon_social'],
        required: false
      }]
    });
    
    // Formatear actividades
    const actividades = [];
    
    const tiempoRelativo = (fecha) => {
      const ahora = new Date();
      const diff = ahora - new Date(fecha);
      const minutos = Math.floor(diff / 60000);
      const horas = Math.floor(diff / 3600000);
      const dias = Math.floor(diff / 86400000);
      
      if (minutos < 60) return `${minutos} minuto${minutos !== 1 ? 's' : ''} atrás`;
      if (horas < 24) return `${horas} hora${horas !== 1 ? 's' : ''} atrás`;
      return `${dias} día${dias !== 1 ? 's' : ''} atrás`;
    };
    
    nuevosClientes.forEach(cliente => {
      actividades.push({
        id: `client-${cliente.id}`,
        type: 'client',
        title: 'Nuevo cliente',
        description: `Se registró ${cliente.razon_social}`,
        time: tiempoRelativo(cliente.created_at),
        fecha: cliente.created_at
      });
    });
    
    cursosRecientes.forEach(curso => {
      actividades.push({
        id: `course-${curso.id}`,
        type: 'course',
        title: 'Nuevo curso',
        description: `${curso.nombre}`,
        time: tiempoRelativo(curso.created_at),
        fecha: curso.created_at
      });
    });
    
    ingresosRecientes.forEach(ingreso => {
      const montoFormateado = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(ingreso.monto);
      
      const clienteNombre = ingreso.Cliente?.razon_social || 'Cliente';
      
      actividades.push({
        id: `invoice-${ingreso.id}`,
        type: 'invoice',
        title: 'Ingreso confirmado',
        description: `${clienteNombre} - ${montoFormateado}`,
        time: tiempoRelativo(ingreso.fecha),
        fecha: ingreso.fecha
      });
    });
    
    proyectosRecientes.forEach(proyecto => {
      const clienteNombre = proyecto.Cliente?.razon_social || 'Cliente';
      
      actividades.push({
        id: `project-${proyecto.id}`,
        type: 'project',
        title: 'Nuevo proyecto',
        description: `${proyecto.nombre} - ${clienteNombre}`,
        time: tiempoRelativo(proyecto.created_at),
        fecha: proyecto.created_at
      });
    });
    
    actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const actividadesFinales = actividades.slice(0, limitActividades).map(({ fecha, ...rest }) => rest);
    
    // ============ PRÓXIMOS CURSOS ============
    const proximosCursos = await Curso.findAll({
      where: {
        fecha_inicio: {
          [Op.gt]: hoy
        }
      },
      order: [['fecha_inicio', 'ASC']],
      limit: 3,
      attributes: ['id', 'nombre', 'fecha_inicio', 'nro_participantes']
    });
    
    const { Participante } = require('../models');
    const cursosFormateados = await Promise.all(proximosCursos.map(async (curso) => {
      const participantesCount = await Participante.count({
        where: { curso_id: curso.id }
      });
      
      const fecha = new Date(curso.fecha_inicio);
      const opciones = { day: '2-digit', month: 'long', year: 'numeric' };
      const fechaFormateada = fecha.toLocaleDateString('es-CL', opciones);
      
      return {
        id: curso.id,
        name: curso.nombre,
        date: fechaFormateada,
        participants: participantesCount || curso.nro_participantes || 0
      };
    }));
    
    // ============ CONSTRUIR RESPUESTA ============
    const dashboardData = {
      estadisticas: {
        clientes: { title: 'Clientes', value: clientesCount },
        cursos: { title: 'Cursos Activos', value: cursosCount },
        ingresos: { title: 'Ingresos Mensuales', value: ingresosFormateados },
        proyectos: { title: 'Proyectos en Curso', value: proyectosCount }
      },
      actividades: actividadesFinales,
      proximosCursos: cursosFormateados
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