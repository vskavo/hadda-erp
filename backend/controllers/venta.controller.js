const db = require('../models');
const { Venta, Cliente, Usuario, Proyecto, Cotizacion, Factura } = db;
const { Op } = require('sequelize');

// Obtener todas las ventas
exports.findAll = async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'razon_social', 'rut'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] },
        { model: Proyecto, as: 'proyecto', attributes: ['id', 'nombre'], required: false },
        { model: Cotizacion, as: 'cotizacion', attributes: ['id', 'numero_cotizacion'], required: false },
        { model: Factura, as: 'factura', attributes: ['id', 'numero_factura'], required: false }
      ],
      order: [['fecha_venta', 'DESC']]
    });
    
    res.status(200).json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ 
      message: 'Error al obtener las ventas', 
      error: error.message 
    });
  }
};

// Obtener una venta por ID
exports.findOne = async (req, res) => {
  const { id } = req.params;
  
  try {
    const venta = await Venta.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'razon_social', 'rut', 'email', 'telefono'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] },
        { model: Proyecto, as: 'proyecto', attributes: ['id', 'nombre'], required: false },
        { model: Cotizacion, as: 'cotizacion', attributes: ['id', 'numero_cotizacion'], required: false },
        { model: Factura, as: 'factura', attributes: ['id', 'numero_factura'], required: false }
      ]
    });
    
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    res.status(200).json(venta);
  } catch (error) {
    console.error('Error al obtener la venta:', error);
    res.status(500).json({ 
      message: 'Error al obtener la venta', 
      error: error.message 
    });
  }
};

// Obtener ventas por cliente
exports.findByCliente = async (req, res) => {
  const { clienteId } = req.params;
  
  try {
    const ventas = await Venta.findAll({
      where: { cliente_id: clienteId },
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'razon_social', 'rut'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] },
        { model: Proyecto, as: 'proyecto', attributes: ['id', 'nombre'], required: false },
        { model: Cotizacion, as: 'cotizacion', attributes: ['id', 'numero_cotizacion'], required: false },
        { model: Factura, as: 'factura', attributes: ['id', 'numero_factura'], required: false }
      ],
      order: [['fecha_venta', 'DESC']]
    });
    
    res.status(200).json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas del cliente:', error);
    res.status(500).json({ 
      message: 'Error al obtener las ventas del cliente', 
      error: error.message 
    });
  }
};

// Crear una nueva venta
exports.create = async (req, res) => {
  const { 
    cliente_id, 
    titulo, 
    descripcion, 
    monto_neto, 
    incluye_iva = true,
    fecha_venta = new Date(),
    estado = 'pendiente',
    forma_pago = 'transferencia',
    descuento_porcentaje = 0,
    proyecto_id,
    cotizacion_id,
    usuario_id,
    observaciones
  } = req.body;
  
  try {
    // Verificar si el cliente existe
    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Crear la venta
    const nuevaVenta = await Venta.create({
      cliente_id,
      titulo,
      descripcion,
      fecha_venta,
      monto_neto,
      incluye_iva,
      estado,
      forma_pago,
      descuento_porcentaje,
      proyecto_id: proyecto_id || null,
      cotizacion_id: cotizacion_id || null,
      usuario_id: usuario_id || null,
      observaciones
    });
    
    // Obtener la venta con todas las relaciones
    const ventaCreada = await Venta.findByPk(nuevaVenta.id, {
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'razon_social', 'rut'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] },
        { model: Proyecto, as: 'proyecto', attributes: ['id', 'nombre'], required: false },
        { model: Cotizacion, as: 'cotizacion', attributes: ['id', 'numero_cotizacion'], required: false }
      ]
    });
    
    res.status(201).json(ventaCreada);
  } catch (error) {
    console.error('Error al crear la venta:', error);
    res.status(500).json({ 
      message: 'Error al crear la venta', 
      error: error.message 
    });
  }
};

// Actualizar una venta
exports.update = async (req, res) => {
  const { id } = req.params;
  const {
    titulo,
    descripcion,
    fecha_venta,
    monto_neto,
    incluye_iva,
    estado,
    forma_pago,
    descuento_porcentaje,
    proyecto_id,
    cotizacion_id,
    factura_id,
    observaciones
  } = req.body;
  
  try {
    // Verificar si la venta existe
    const venta = await Venta.findByPk(id);
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    // Actualizar la venta
    await venta.update({
      titulo: titulo || venta.titulo,
      descripcion: descripcion !== undefined ? descripcion : venta.descripcion,
      fecha_venta: fecha_venta || venta.fecha_venta,
      monto_neto: monto_neto !== undefined ? monto_neto : venta.monto_neto,
      incluye_iva: incluye_iva !== undefined ? incluye_iva : venta.incluye_iva,
      estado: estado || venta.estado,
      forma_pago: forma_pago || venta.forma_pago,
      descuento_porcentaje: descuento_porcentaje !== undefined ? descuento_porcentaje : venta.descuento_porcentaje,
      proyecto_id: proyecto_id !== undefined ? proyecto_id : venta.proyecto_id,
      cotizacion_id: cotizacion_id !== undefined ? cotizacion_id : venta.cotizacion_id,
      factura_id: factura_id !== undefined ? factura_id : venta.factura_id,
      observaciones: observaciones !== undefined ? observaciones : venta.observaciones
    });
    
    // Obtener la venta actualizada con todas las relaciones
    const ventaActualizada = await Venta.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'razon_social', 'rut'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] },
        { model: Proyecto, as: 'proyecto', attributes: ['id', 'nombre'], required: false },
        { model: Cotizacion, as: 'cotizacion', attributes: ['id', 'numero_cotizacion'], required: false },
        { model: Factura, as: 'factura', attributes: ['id', 'numero_factura'], required: false }
      ]
    });
    
    res.status(200).json(ventaActualizada);
  } catch (error) {
    console.error('Error al actualizar la venta:', error);
    res.status(500).json({ 
      message: 'Error al actualizar la venta', 
      error: error.message 
    });
  }
};

// Eliminar una venta
exports.delete = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar si la venta existe
    const venta = await Venta.findByPk(id);
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    // Verificar si la venta tiene facturas asociadas
    if (venta.factura_id) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la venta porque tiene una factura asociada' 
      });
    }
    
    // Eliminar la venta
    await venta.destroy();
    
    res.status(200).json({ message: 'Venta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la venta:', error);
    res.status(500).json({ 
      message: 'Error al eliminar la venta', 
      error: error.message 
    });
  }
};

// Cambiar estado de una venta
exports.cambiarEstado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  try {
    // Verificar si la venta existe
    const venta = await Venta.findByPk(id);
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    // Actualizar el estado
    await venta.update({ estado });
    
    res.status(200).json({ message: 'Estado de venta actualizado correctamente', estado });
  } catch (error) {
    console.error('Error al cambiar estado de la venta:', error);
    res.status(500).json({ 
      message: 'Error al cambiar estado de la venta', 
      error: error.message 
    });
  }
};

// Generar estadísticas de ventas
exports.estadisticas = async (req, res) => {
  try {
    // Total de ventas
    const totalVentas = await Venta.count();
    
    // Suma total de montos
    const sumaTotal = await Venta.sum('monto_total');
    
    // Ventas por estado
    const ventasPorEstado = await Venta.findAll({
      attributes: [
        'estado',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
        [db.sequelize.fn('SUM', db.sequelize.col('monto_total')), 'suma']
      ],
      group: ['estado']
    });
    
    // Ventas por mes (últimos 12 meses)
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 11);
    fechaInicio.setDate(1);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const ventasPorMes = await Venta.findAll({
      attributes: [
        [db.sequelize.fn('DATE_FORMAT', db.sequelize.col('fecha_venta'), '%Y-%m'), 'mes'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
        [db.sequelize.fn('SUM', db.sequelize.col('monto_total')), 'suma']
      ],
      where: {
        fecha_venta: {
          [Op.gte]: fechaInicio
        }
      },
      group: [db.sequelize.fn('DATE_FORMAT', db.sequelize.col('fecha_venta'), '%Y-%m')],
      order: [[db.sequelize.fn('DATE_FORMAT', db.sequelize.col('fecha_venta'), '%Y-%m'), 'ASC']]
    });
    
    res.status(200).json({
      totalVentas,
      sumaTotal,
      ventasPorEstado,
      ventasPorMes
    });
  } catch (error) {
    console.error('Error al generar estadísticas de ventas:', error);
    res.status(500).json({ 
      message: 'Error al generar estadísticas de ventas', 
      error: error.message 
    });
  }
}; 