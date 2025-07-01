const { SeguimientoCliente, Cliente, Contacto, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los seguimientos con filtros
exports.findAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      estado, 
      tipo, 
      usuario_id,
      cliente_id,
      contacto_id,
      fecha_inicio,
      fecha_fin,
      sortBy = 'fecha', 
      sortOrder = 'DESC' 
    } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { asunto: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } },
        sequelize.literal(`"Cliente"."razon_social" ILIKE '%${search}%'`),
        sequelize.literal(`"Contacto"."nombre" ILIKE '%${search}%'`)
      ];
    }
    
    if (estado) {
      whereConditions.estado = estado;
    }
    
    if (tipo) {
      whereConditions.tipo = tipo;
    }
    
    if (usuario_id) {
      whereConditions.usuario_id = usuario_id;
    }
    
    if (cliente_id) {
      whereConditions.cliente_id = cliente_id;
    }
    
    if (contacto_id) {
      whereConditions.contacto_id = contacto_id;
    }
    
    // Filtrar por rango de fechas
    if (fecha_inicio || fecha_fin) {
      whereConditions.fecha = {};
      
      if (fecha_inicio) {
        whereConditions.fecha[Op.gte] = new Date(fecha_inicio);
      }
      
      if (fecha_fin) {
        whereConditions.fecha[Op.lte] = new Date(fecha_fin);
      }
    }
    
    // Ejecutar la consulta
    const { count, rows: seguimientos } = await SeguimientoCliente.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Cliente,
          attributes: ['id', 'razon_social', 'rut', 'estado']
        },
        {
          model: Contacto,
          attributes: ['id', 'nombre', 'cargo', 'email', 'telefono_directo']
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });
    
    res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      seguimientos
    });
  } catch (error) {
    console.error('Error al obtener seguimientos:', error);
    res.status(500).json({ message: 'Error al obtener seguimientos', error: error.message });
  }
};

// Obtener seguimientos por cliente
exports.findByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      estado, 
      tipo,
      sortBy = 'fecha', 
      sortOrder = 'DESC' 
    } = req.query;
    const offset = (page - 1) * limit;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Construir condiciones de búsqueda
    const whereConditions = { cliente_id: clienteId };
    
    if (estado) {
      whereConditions.estado = estado;
    }
    
    if (tipo) {
      whereConditions.tipo = tipo;
    }
    
    // Log para depuración
    console.log('Buscando seguimientos para cliente:', clienteId);
    console.log('Condiciones:', JSON.stringify(whereConditions));
    console.log('Orden:', sortBy, sortOrder);
    
    try {
      // Ejecutar la consulta
      const { count, rows: seguimientos } = await SeguimientoCliente.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: Contacto,
            attributes: ['id', 'nombre', 'cargo', 'email']
          },
          {
            model: Usuario,
            attributes: ['id', 'nombre', 'apellido']
          }
        ]
      });
      
      res.status(200).json({
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        seguimientos
      });
    } catch (dbError) {
      console.error('Error en la consulta:', dbError);
      return res.status(500).json({ 
        message: 'Error al ejecutar la consulta', 
        error: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }
  } catch (error) {
    console.error('Error al obtener seguimientos por cliente:', error);
    res.status(500).json({ 
      message: 'Error al obtener seguimientos', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Obtener seguimientos por contacto
exports.findByContacto = async (req, res) => {
  try {
    const { contactoId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      estado, 
      tipo,
      sortBy = 'fecha', 
      sortOrder = 'DESC' 
    } = req.query;
    const offset = (page - 1) * limit;
    
    // Verificar si el contacto existe
    const contacto = await Contacto.findByPk(contactoId);
    if (!contacto) {
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }
    
    // Construir condiciones de búsqueda
    const whereConditions = { contacto_id: contactoId };
    
    if (estado) {
      whereConditions.estado = estado;
    }
    
    if (tipo) {
      whereConditions.tipo = tipo;
    }
    
    // Ejecutar la consulta
    const { count, rows: seguimientos } = await SeguimientoCliente.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Cliente,
          attributes: ['id', 'razon_social', 'rut']
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });
    
    res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      seguimientos
    });
  } catch (error) {
    console.error('Error al obtener seguimientos por contacto:', error);
    res.status(500).json({ message: 'Error al obtener seguimientos', error: error.message });
  }
};

// Obtener un seguimiento específico
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const seguimiento = await SeguimientoCliente.findByPk(id, {
      include: [
        {
          model: Cliente,
          attributes: ['id', 'razon_social', 'rut', 'estado']
        },
        {
          model: Contacto,
          attributes: ['id', 'nombre', 'cargo', 'email', 'telefono_directo']
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });
    
    if (!seguimiento) {
      return res.status(404).json({ message: 'Seguimiento no encontrado' });
    }
    
    res.status(200).json(seguimiento);
  } catch (error) {
    console.error('Error al obtener seguimiento:', error);
    res.status(500).json({ message: 'Error al obtener seguimiento', error: error.message });
  }
};

// Crear un nuevo seguimiento
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      cliente_id, 
      contacto_id, 
      tipo_actividad, 
      asunto, 
      descripcion, 
      fecha, 
      estado, 
      resultado, 
      fecha_siguiente, 
      recordatorio, 
      accion_siguiente,
      fecha_recordatorio 
    } = req.body;
    
    console.log('Datos recibidos para crear seguimiento:', req.body);
    
    // Verificar datos requeridos
    if (!cliente_id) {
      await t.rollback();
      return res.status(400).json({ message: 'El ID del cliente es obligatorio' });
    }
    
    if (!asunto) {
      await t.rollback();
      return res.status(400).json({ message: 'El asunto es obligatorio' });
    }
    
    if (!tipo_actividad) {
      await t.rollback();
      return res.status(400).json({ message: 'El tipo de actividad es obligatorio' });
    }
    
    // Verificar que si recordatorio es true, se proporcione una fecha de recordatorio
    if (recordatorio && !fecha_recordatorio) {
      await t.rollback();
      return res.status(400).json({ message: 'Si se activa el recordatorio, debe especificar una fecha para el mismo' });
    }
    
    // Verificar si el cliente existe
    const cliente = await Cliente.findByPk(cliente_id, { transaction: t });
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Verificar si el contacto existe y pertenece al cliente
    if (contacto_id) {
      const contacto = await Contacto.findOne({ 
        where: { 
          id: contacto_id,
          cliente_id
        },
        transaction: t
      });
      
      if (!contacto) {
        await t.rollback();
        return res.status(400).json({ message: 'El contacto no existe o no pertenece al cliente especificado' });
      }
    }
    
    // Crear el seguimiento
    const nuevoSeguimiento = await SeguimientoCliente.create({
      cliente_id,
      contacto_id,
      usuario_id: req.usuario.id, // Usuario que crea el seguimiento
      tipo_actividad,
      asunto,
      descripcion,
      fecha: fecha || new Date(),
      estado: estado || 'pendiente',
      resultado,
      fecha_siguiente,
      recordatorio: recordatorio || false,
      accion_siguiente,
      fecha_recordatorio: recordatorio ? fecha_recordatorio : null
    }, { transaction: t });
    
    // Actualizar fecha de último contacto en el cliente
    await cliente.update({ 
      fecha_ultimo_contacto: fecha || new Date() 
    }, { transaction: t });
    
    await t.commit();
    
    // Obtener el seguimiento con sus relaciones
    const seguimientoCreado = await SeguimientoCliente.findByPk(nuevoSeguimiento.id, {
      include: [
        {
          model: Cliente,
          attributes: ['id', 'razon_social', 'rut']
        },
        {
          model: Contacto,
          attributes: ['id', 'nombre', 'cargo', 'email']
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Seguimiento creado exitosamente',
      seguimiento: seguimientoCreado
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear seguimiento:', error);
    res.status(500).json({ message: 'Error al crear seguimiento', error: error.message });
  }
};

// Actualizar un seguimiento existente
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      contacto_id, 
      tipo_actividad, 
      asunto, 
      descripcion, 
      fecha, 
      estado, 
      resultado, 
      fecha_siguiente,
      recordatorio, 
      accion_siguiente,
      fecha_recordatorio 
    } = req.body;
    
    console.log('Datos recibidos para actualizar seguimiento:', req.body);
    
    // Verificar si el seguimiento existe
    const seguimiento = await SeguimientoCliente.findByPk(id, { transaction: t });
    if (!seguimiento) {
      await t.rollback();
      return res.status(404).json({ message: 'Seguimiento no encontrado' });
    }
    
    // Verificar que si recordatorio es true, se proporcione una fecha de recordatorio
    if (recordatorio && !fecha_recordatorio && !seguimiento.fecha_recordatorio) {
      await t.rollback();
      return res.status(400).json({ message: 'Si se activa el recordatorio, debe especificar una fecha para el mismo' });
    }
    
    // Verificar si el contacto existe y pertenece al cliente
    if (contacto_id) {
      const contacto = await Contacto.findOne({ 
        where: { 
          id: contacto_id,
          cliente_id: seguimiento.cliente_id
        },
        transaction: t
      });
      
      if (!contacto) {
        await t.rollback();
        return res.status(400).json({ message: 'El contacto no existe o no pertenece al cliente' });
      }
    }
    
    // Actualizar el seguimiento
    await seguimiento.update({
      ...(contacto_id !== undefined && { contacto_id }),
      ...(tipo_actividad && { tipo_actividad }),
      ...(asunto && { asunto }),
      ...(descripcion !== undefined && { descripcion }),
      ...(fecha && { fecha }),
      ...(estado && { estado }),
      ...(resultado !== undefined && { resultado }),
      ...(fecha_siguiente !== undefined && { fecha_siguiente }),
      ...(recordatorio !== undefined && { recordatorio }),
      ...(accion_siguiente !== undefined && { accion_siguiente }),
      ...(recordatorio === false && { fecha_recordatorio: null }), // Si se desactiva el recordatorio, eliminar la fecha
      ...((recordatorio === true && fecha_recordatorio !== undefined) && { fecha_recordatorio })
    }, { transaction: t });
    
    // Si se cambió a estado completada, actualizar fecha de último contacto en el cliente
    if (estado === 'completada' && seguimiento.estado !== 'completada') {
      const cliente = await Cliente.findByPk(seguimiento.cliente_id, { transaction: t });
      if (cliente) {
        await cliente.update({ 
          fecha_ultimo_contacto: new Date() 
        }, { transaction: t });
      }
    }
    
    await t.commit();
    
    // Obtener el seguimiento actualizado con sus relaciones
    const seguimientoActualizado = await SeguimientoCliente.findByPk(id, {
      include: [
        {
          model: Cliente,
          attributes: ['id', 'razon_social', 'rut']
        },
        {
          model: Contacto,
          attributes: ['id', 'nombre', 'cargo', 'email']
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });
    
    res.status(200).json({
      message: 'Seguimiento actualizado exitosamente',
      seguimiento: seguimientoActualizado
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar seguimiento:', error);
    res.status(500).json({ message: 'Error al actualizar seguimiento', error: error.message });
  }
};

// Eliminar un seguimiento
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el seguimiento existe
    const seguimiento = await SeguimientoCliente.findByPk(id);
    if (!seguimiento) {
      return res.status(404).json({ message: 'Seguimiento no encontrado' });
    }
    
    // Verificar permisos - solo administrador, gerencia, o el usuario que lo creó puede eliminar
    if (req.usuario.rol !== 'administrador' && 
        req.usuario.rol !== 'gerencia' && 
        seguimiento.usuario_id !== req.usuario.id) {
      return res.status(403).json({ message: 'No tiene permisos para eliminar este seguimiento' });
    }
    
    // Eliminar el seguimiento
    await seguimiento.destroy();
    
    res.status(200).json({ message: 'Seguimiento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar seguimiento:', error);
    res.status(500).json({ message: 'Error al eliminar seguimiento', error: error.message });
  }
}; 