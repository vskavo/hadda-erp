const { Cliente, Contacto, SeguimientoCliente, sequelize } = require('../models');
const { Op } = require('sequelize');
const HoldingService = require('../services/holding.service');

// Obtener todos los clientes con paginación y filtros
exports.findAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      estado, 
      sortBy = 'created_at',
      sortOrder = 'DESC' 
    } = req.query;
    
    // Convertir parámetros a números si son strings
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;
    
    // Construir condiciones de búsqueda
    const whereConditions = {};
    
    // Filtrar por propietario si no es admin
    if (req.usuario.rol !== 'administrador') {
      whereConditions.owner = req.usuario.id;
    }
    
    if (search) {
      whereConditions[Op.or] = [
        { razon_social: { [Op.iLike]: `%${search}%` } },
        { rut: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { contacto_nombre: { [Op.iLike]: `%${search}%` } },
        { holding: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (estado) {
      whereConditions.estado = estado;
    }
    
    console.log(`Buscando clientes - Page: ${pageNum}, Limit: ${limitNum}, Offset: ${offset}`);
    
    // Ejecutar la consulta
    const { count, rows: clientes } = await Cliente.findAndCountAll({
      where: whereConditions,
      limit: limitNum > 0 ? limitNum : null, // Si el límite es 0 o negativo, no aplicar límite
      offset: offset > 0 ? offset : 0,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Contacto,
          as: 'Contactos',
          where: { es_principal: true },
          required: false,
          limit: 1
        },
        {
          model: require('../models').Usuario,
          as: 'Owner',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });
    
    console.log(`Encontrados ${count} clientes, devolviendo ${clientes.length}`);
    
    res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / (limitNum || 1)),
      currentPage: pageNum,
      clientes
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
  }
};

// Obtener un cliente por ID
exports.findOne = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [
        {
          model: Contacto,
          as: 'Contactos'
        }
      ]
    });
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.status(200).json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ message: 'Error al obtener cliente', error: error.message });
  }
};

// Nueva función para obtener el resumen de holdings
exports.getHoldingsSummary = async (req, res) => {
  try {
    // Si el usuario no es admin, pasar su id para filtrar
    const userId = req.usuario.rol !== 'administrador' ? req.usuario.id : null;
    const summary = await HoldingService.getSummaryByHolding(userId);
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error al obtener resumen de holdings:', error);
    // Es importante no exponer detalles del error en producción si no es necesario
    const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor';
    res.status(500).json({ message: 'Error al obtener resumen de holdings', error: errorMessage });
  }
};

// Crear un cliente nuevo
exports.create = async (req, res) => {
  // Siempre creamos nuestra propia transacción para este controlador
  let t = null;
  
  try {
    console.log('=== INICIO DE CREACIÓN DE CLIENTE ===');
    console.log('Datos recibidos del cliente:', JSON.stringify(req.body, null, 2));
    
    // Iniciar transacción
    t = await sequelize.transaction({
      isolationLevel: 'READ COMMITTED' // Nivel de aislamiento más bajo para evitar bloqueos
    });
    
    console.log('Nueva transacción creada para crear cliente');
    
    // Convertir campos de camelCase a snake_case si es necesario
    const { 
      // Permitir ambos formatos (camelCase y snake_case)
      razon_social = req.body.razonSocial, 
      rut = req.body.rut, 
      giro = req.body.giro, 
      direccion = req.body.direccion, 
      comuna = req.body.comuna, 
      ciudad = req.body.ciudad, 
      telefono = req.body.telefono, 
      email = req.body.email, 
      sitio_web = req.body.sitioWeb, 
      contacto_nombre = req.body.contactoNombre, 
      contacto_cargo = req.body.contactoCargo, 
      contacto_email = req.body.contactoEmail, 
      contacto_telefono = req.body.contactoTelefono, 
      estado = req.body.estado, 
      notas = req.body.notas,
      holding = req.body.holding,
      contactos = req.body.contactos || [],
      owner: ownerFromBody = req.body.owner // Nuevo: permitir owner explícito
    } = req.body;
    
    // Log para diagnóstico
    console.log('Datos procesados para crear cliente:');
    console.log({ razon_social, rut, email, telefono });
    
    // Validaciones básicas
    if (!razon_social || !rut) {
      console.log('Error: Falta información obligatoria (razón social o RUT)');
      await t.rollback();
      return res.status(400).json({ message: 'La razón social y el RUT son obligatorios' });
    }
    
    // Verificar si ya existe un cliente con el mismo RUT
    const clienteExistente = await Cliente.findOne({ 
      where: { rut },
      transaction: t
    });
    
    if (clienteExistente) {
      console.log(`Cliente con RUT ${rut} ya existe, ID: ${clienteExistente.id}`);
      await t.rollback();
      return res.status(400).json({ message: 'Ya existe un cliente con este RUT' });
    }
    
    // Determinar el owner
    let owner = req.usuario.id;
    if (req.usuario.rol === 'administrador' && ownerFromBody) {
      owner = ownerFromBody;
    }
    
    // Crear el cliente
    console.log('Creando nuevo cliente en la base de datos...');
    const nuevoCliente = await Cliente.create({
      razon_social, 
      rut, 
      giro, 
      direccion, 
      comuna, 
      ciudad, 
      telefono, 
      email, 
      sitio_web, 
      contacto_nombre, 
      contacto_cargo, 
      contacto_email, 
      contacto_telefono, 
      estado: estado || 'activo', 
      notas,
      holding,
      owner
    }, { transaction: t });
    
    console.log(`Cliente creado con ID: ${nuevoCliente.id}`);
    
    // Crear contactos adicionales si se proporcionaron
    if (contactos && contactos.length > 0) {
      console.log(`Creando ${contactos.length} contactos adicionales...`);
      for (const contacto of contactos) {
        await Contacto.create({
          ...contacto,
          cliente_id: nuevoCliente.id
        }, { transaction: t });
      }
    } else if (contacto_nombre) {
      // Si no hay contactos adicionales pero se proporcionó un contacto principal en los datos del cliente
      console.log('Creando contacto principal a partir de los datos del cliente');
      await Contacto.create({
        cliente_id: nuevoCliente.id,
        nombre: contacto_nombre,
        cargo: contacto_cargo,
        email: contacto_email,
        telefono_directo: contacto_telefono,
        es_principal: true
      }, { transaction: t });
    }
    
    // Confirmar la transacción
    console.log('Confirmando transacción...');
    await t.commit();
    console.log('Transacción confirmada exitosamente');
    
    // Obtener el cliente con sus contactos
    // Usamos una nueva consulta, fuera de la transacción
    let clienteCreado = null;
    try {
      clienteCreado = await Cliente.findByPk(nuevoCliente.id, {
        include: [
          {
            model: Contacto,
            as: 'Contactos'
          }
        ]
      });
      
      if (!clienteCreado) {
        console.error(`ERROR CRÍTICO: No se pudo recuperar el cliente recién creado con ID ${nuevoCliente.id}`);
      } else {
        console.log(`Cliente recuperado exitosamente con ${clienteCreado.Contactos?.length || 0} contactos`);
      }
    } catch (findError) {
      console.error('Error al recuperar cliente creado:', findError);
      // Continuamos con la respuesta aunque no podamos recuperar los detalles completos
    }
    
    console.log('=== FIN DE CREACIÓN DE CLIENTE ===');
    
    res.status(201).json({
      message: 'Cliente creado exitosamente',
      cliente: clienteCreado || nuevoCliente,
      id: clienteCreado?.id || nuevoCliente.id
    });
  } catch (error) {
    // Rollback de la transacción en caso de error
    if (t) {
      try {
        console.log('Haciendo rollback de la transacción debido a error...');
        await t.rollback();
      } catch (rollbackError) {
        console.error('Error adicional al hacer rollback:', rollbackError);
      }
    }
    console.error('Error al crear cliente:', error);
    console.error('Stack de error:', error.stack);
    res.status(500).json({ 
      message: 'Error al crear cliente', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Actualizar un cliente existente
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      razon_social, 
      rut, 
      giro, 
      direccion, 
      comuna, 
      ciudad, 
      telefono, 
      email, 
      sitio_web, 
      contacto_nombre, 
      contacto_cargo, 
      contacto_email, 
      contacto_telefono, 
      estado, 
      notas,
      holding,
      fecha_ultimo_contacto,
      contactos,
      owner: ownerFromBody = undefined // Nuevo: permitir owner explícito solo para admin
    } = req.body;
    
    const clienteId = req.params.id;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.findByPk(clienteId, { transaction: t });
    
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Verificar que el RUT no esté en uso por otro cliente
    if (rut && rut !== cliente.rut) {
      const clienteExistente = await Cliente.findOne({ 
        where: { 
          rut,
          id: { [Op.ne]: clienteId }
        },
        transaction: t
      });
      
      if (clienteExistente) {
        await t.rollback();
        return res.status(400).json({ message: 'El RUT ya está en uso por otro cliente' });
      }
    }
    
    // Actualizar el cliente
    const updateData = {
      ...(razon_social && { razon_social }),
      ...(rut && { rut }),
      ...(giro && { giro }),
      ...(direccion && { direccion }),
      ...(comuna && { comuna }),
      ...(ciudad && { ciudad }),
      ...(telefono && { telefono }),
      ...(email && { email }),
      ...(sitio_web && { sitio_web }),
      ...(contacto_nombre && { contacto_nombre }),
      ...(contacto_cargo && { contacto_cargo }),
      ...(contacto_email && { contacto_email }),
      ...(contacto_telefono && { contacto_telefono }),
      ...(estado && { estado }),
      ...(notas !== undefined && { notas }),
      ...(holding !== undefined && { holding }),
      ...(fecha_ultimo_contacto !== undefined && { fecha_ultimo_contacto })
    };
    // Solo los administradores pueden cambiar el owner
    if (req.usuario.rol === 'administrador' && ownerFromBody) {
      updateData.owner = ownerFromBody;
    }
    await cliente.update(updateData, { transaction: t });
    
    // Si se actualizó la información del contacto principal, también actualizar en la tabla de contactos
    if (contacto_nombre || contacto_cargo || contacto_email || contacto_telefono) {
      const contactoPrincipal = await Contacto.findOne({
        where: { 
          cliente_id: clienteId,
          es_principal: true
        },
        transaction: t
      });
      
      if (contactoPrincipal) {
        await contactoPrincipal.update({
          ...(contacto_nombre && { nombre: contacto_nombre }),
          ...(contacto_cargo && { cargo: contacto_cargo }),
          ...(contacto_email && { email: contacto_email }),
          ...(contacto_telefono && { telefono_directo: contacto_telefono })
        }, { transaction: t });
      } else if (contacto_nombre) {
        // Si no existe un contacto principal pero se proporcionaron datos, crearlo
        await Contacto.create({
          cliente_id: clienteId,
          nombre: contacto_nombre,
          cargo: contacto_cargo,
          email: contacto_email,
          telefono_directo: contacto_telefono,
          es_principal: true
        }, { transaction: t });
      }
    }
    
    await t.commit();
    
    // Obtener el cliente actualizado con sus contactos
    const clienteActualizado = await Cliente.findByPk(clienteId, {
      include: [
        {
          model: Contacto,
          as: 'Contactos'
        }
      ]
    });
    
    res.status(200).json({
      message: 'Cliente actualizado exitosamente',
      cliente: clienteActualizado
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error al actualizar cliente', error: error.message });
  }
};

// Eliminar un cliente (cambiar estado a inactivo)
exports.delete = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const clienteId = req.params.id;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.findByPk(clienteId, { transaction: t });
    
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Cambiar el estado a inactivo en lugar de eliminar
    await cliente.update({ estado: 'inactivo' }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({ message: 'Cliente desactivado exitosamente' });
  } catch (error) {
    await t.rollback();
    console.error('Error al desactivar cliente:', error);
    res.status(500).json({ message: 'Error al desactivar cliente', error: error.message });
  }
};

// Eliminar permanentemente un cliente (solo para administradores)
exports.hardDelete = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const clienteId = req.params.id;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.findByPk(clienteId, { transaction: t });
    
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Verificar si el usuario tiene permisos de administrador
    if (req.usuario.rol !== 'administrador') {
      await t.rollback();
      return res.status(403).json({ message: 'No tiene permisos para eliminar permanentemente un cliente' });
    }
    
    // Eliminar los contactos asociados al cliente
    await Contacto.destroy({
      where: { cliente_id: clienteId },
      transaction: t
    });
    
    // Eliminar los seguimientos asociados al cliente
    await SeguimientoCliente.destroy({
      where: { cliente_id: clienteId },
      transaction: t
    });
    
    // Eliminar el cliente
    await cliente.destroy({ transaction: t });
    
    await t.commit();
    
    res.status(200).json({ message: 'Cliente eliminado permanentemente' });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ message: 'Error al eliminar cliente', error: error.message });
  }
};

// Obtener el Dashboard de clientes (estadísticas)
exports.getDashboard = async (req, res) => {
  try {
    // Total de clientes por estado
    const clientesPorEstado = await Cliente.findAll({
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['estado']
    });
    
    // Clientes nuevos en el último mes
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    
    const clientesNuevos = await Cliente.count({
      where: {
        createdAt: {
          [Op.gte]: fechaInicio
        }
      }
    });
    
    // Clientes sin actividad en los últimos 3 meses
    const fechaUltimaActividad = new Date();
    fechaUltimaActividad.setMonth(fechaUltimaActividad.getMonth() - 3);
    
    const clientesInactivos = await Cliente.count({
      where: {
        [Op.or]: [
          { fecha_ultimo_contacto: { [Op.lt]: fechaUltimaActividad } },
          { fecha_ultimo_contacto: null }
        ],
        estado: 'activo'
      }
    });
    
    // Actividades pendientes
    const actividadesPendientes = await SeguimientoCliente.count({
      where: {
        estado: 'pendiente'
      }
    });
    
    // TOP 5 clientes con más actividades
    const clientesConMasActividades = await SeguimientoCliente.findAll({
      attributes: [
        'cliente_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_actividades']
      ],
      include: [
        {
          model: Cliente,
          attributes: ['razon_social', 'rut'],
          where: { estado: 'activo' }
        }
      ],
      group: ['cliente_id', 'Cliente.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 5
    });
    
    res.status(200).json({
      clientesPorEstado,
      clientesNuevos,
      clientesInactivos,
      actividadesPendientes,
      clientesConMasActividades
    });
  } catch (error) {
    console.error('Error al obtener dashboard de clientes:', error);
    res.status(500).json({ message: 'Error al obtener dashboard', error: error.message });
  }
};

// Generar informe de clientes
exports.generarInforme = async (req, res) => {
  try {
    const { tipo, estado, fechaInicio, fechaFin } = req.query;
    
    let whereCondition = {};
    
    if (estado) {
      whereCondition.estado = estado;
    }
    
    // Si se proporciona un rango de fechas, filtrar por fecha de creación
    if (fechaInicio && fechaFin) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    } else if (fechaInicio) {
      whereCondition.createdAt = {
        [Op.gte]: new Date(fechaInicio)
      };
    } else if (fechaFin) {
      whereCondition.createdAt = {
        [Op.lte]: new Date(fechaFin)
      };
    }
    
    let informe;
    
    switch (tipo) {
      case 'basico':
        // Informe básico: solo datos de cliente
        informe = await Cliente.findAll({
          where: whereCondition,
          attributes: [
            'id', 'razon_social', 'rut', 'giro', 'estado', 
            'email', 'telefono', 'ciudad', 'createdAt'
          ],
          order: [['razon_social', 'ASC']]
        });
        break;
        
      case 'completo':
        // Informe completo: datos de cliente y contactos
        informe = await Cliente.findAll({
          where: whereCondition,
          include: [
            {
              model: Contacto,
              attributes: ['nombre', 'cargo', 'email', 'telefono_directo', 'es_principal']
            }
          ],
          order: [['razon_social', 'ASC']]
        });
        break;
        
      case 'actividades':
        // Informe de actividades: clientes y sus actividades en el periodo
        informe = await Cliente.findAll({
          where: whereCondition,
          include: [
            {
              model: SeguimientoCliente,
              where: fechaInicio || fechaFin ? {
                fecha: {
                  ...(fechaInicio && { [Op.gte]: new Date(fechaInicio) }),
                  ...(fechaFin && { [Op.lte]: new Date(fechaFin) })
                }
              } : {},
              required: true
            }
          ],
          order: [['razon_social', 'ASC']]
        });
        break;
        
      default:
        return res.status(400).json({ message: 'Tipo de informe no válido' });
    }
    
    res.status(200).json({
      informe,
      parametros: {
        tipo,
        estado,
        fechaInicio,
        fechaFin
      }
    });
  } catch (error) {
    console.error('Error al generar informe de clientes:', error);
    res.status(500).json({ message: 'Error al generar informe', error: error.message });
  }
};

// Cambiar estado del cliente (activo/inactivo)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ message: 'Estado no válido. Debe ser "activo" o "inactivo"' });
    }
    
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    cliente.estado = estado;
    await cliente.save();
    
    res.status(200).json({ 
      message: `Estado del cliente actualizado a ${estado}`,
      cliente 
    });
  } catch (error) {
    console.error('Error al actualizar estado del cliente:', error);
    res.status(500).json({ 
      message: 'Error al actualizar estado del cliente', 
      error: error.message 
    });
  }
};

// Obtener contactos de un cliente
exports.getContactos = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    const contactos = await Contacto.findAll({
      where: { cliente_id: id },
      order: [['es_principal', 'DESC'], ['created_at', 'DESC']]
    });
    
    res.status(200).json(contactos);
  } catch (error) {
    console.error('Error al obtener contactos del cliente:', error);
    res.status(500).json({ 
      message: 'Error al obtener contactos del cliente', 
      error: error.message 
    });
  }
};

// Obtener actividades de un cliente
exports.getActividades = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    const actividades = await SeguimientoCliente.findAll({
      where: { cliente_id: id },
      order: [['fecha', 'DESC']]
    });
    
    res.status(200).json(actividades);
  } catch (error) {
    console.error('Error al obtener actividades del cliente:', error);
    res.status(500).json({ 
      message: 'Error al obtener actividades del cliente', 
      error: error.message 
    });
  }
};

// Obtener ventas de un cliente
exports.getVentas = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Obtener las ventas del cliente desde la base de datos
    const Venta = sequelize.models.Venta;
    if (!Venta) {
      return res.status(500).json({ message: 'Error al acceder al modelo de Venta' });
    }
    
    const ventas = await Venta.findAll({
      where: { cliente_id: id },
      order: [['fecha_venta', 'DESC']],
      attributes: [
        'id',
        'titulo',
        'fecha_venta',
        'monto_total',
        'estado',
        'metodo_pago',
        'proyecto_id',
        'factura_id'
      ]
    });
    
    // Formatear los datos para la tabla en el frontend
    const formattedVentas = ventas.map(venta => ({
      id: venta.id,
      numero: `V-${venta.id.toString().padStart(4, '0')}`,
      fecha: venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleDateString() : 'N/A',
      titulo: venta.titulo,
      total: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(venta.monto_total),
      estado: venta.estado,
      metodo_pago: venta.metodo_pago || 'No especificado',
      proyecto_id: venta.proyecto_id,
      factura_id: venta.factura_id
    }));
    
    res.status(200).json(formattedVentas);
  } catch (error) {
    console.error('Error al obtener ventas del cliente:', error);
    res.status(500).json({ 
      message: 'Error al obtener ventas del cliente', 
      error: error.message 
    });
  }
};

// Obtener detalle de ventas por empresa y proyecto para un holding
exports.getHoldingSalesDetails = async (req, res) => {
  try {
    const { nombreHolding } = req.params;
    if (!nombreHolding) {
      return res.status(400).json({ message: 'Debe especificar el nombre del holding' });
    }
    // Si el usuario no es admin, pasar su id para filtrar
    const userId = req.usuario.rol !== 'administrador' ? req.usuario.id : null;
    const detalle = await HoldingService.getHoldingSalesDetails(nombreHolding, userId);
    res.status(200).json(detalle);
  } catch (error) {
    console.error('Error al obtener detalle de ventas del holding:', error);
    res.status(500).json({ message: 'Error al obtener detalle de ventas del holding', error: error.message });
  }
};

