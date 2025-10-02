const { Factura, Cliente, Proyecto, UsuarioSii, OtecData, sequelize } = require('../models');
const axios = require('axios');
const { Op } = require('sequelize');

// Función auxiliar para procesar RUT
const procesarRut = (rut) => {
  // Eliminar puntos y espacios
  const rutLimpio = rut.replace(/\./g, '').replace(/\s/g, '');

  // Separar dígito verificador
  const partes = rutLimpio.split('-');
  if (partes.length === 2) {
    return {
      rut: partes[0],
      dv: partes[1]
    };
  }

  // Si no tiene guión, asumir que el último carácter es el DV
  const rutSinDV = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  return {
    rut: rutSinDV,
    dv: dv
  };
};

// Obtener todas las facturas con paginación y filtros
exports.findAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      estado, 
      desde,
      hasta,
      cliente_id,
      proyecto_id,
      sortBy = 'fecha_emision', 
      sortOrder = 'DESC' 
    } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { numero_factura: { [Op.iLike]: `%${search}%` } },
        { folio_sii: { [Op.iLike]: `%${search}%` } },
        { observaciones: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (estado) {
      whereConditions.estado = estado;
    }
    
    if (desde && hasta) {
      whereConditions.fecha_emision = {
        [Op.between]: [new Date(desde), new Date(hasta)]
      };
    } else if (desde) {
      whereConditions.fecha_emision = {
        [Op.gte]: new Date(desde)
      };
    } else if (hasta) {
      whereConditions.fecha_emision = {
        [Op.lte]: new Date(hasta)
      };
    }
    
    if (cliente_id) {
      whereConditions.cliente_id = cliente_id;
    }
    
    if (proyecto_id) {
      whereConditions.proyecto_id = proyecto_id;
    }
    
    // Ejecutar la consulta
    const { count, rows: facturas } = await Factura.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social', 'rut']
        },
        {
          model: Proyecto,
          as: 'Proyecto',
          attributes: ['id', 'nombre', 'proyect_id'],
          required: false
        }
      ]
    });
    
    res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      facturas
    });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ message: 'Error al obtener facturas', error: error.message });
  }
};

// Obtener una factura por ID
exports.findOne = async (req, res) => {
  try {
    const factura = await Factura.findByPk(req.params.id, {
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social', 'rut', 'direccion', 'comuna', 'ciudad', 'giro']
        },
        {
          model: Proyecto,
          as: 'Proyecto',
          attributes: ['id', 'nombre', 'proyect_id'],
          required: false
        }
      ]
    });
    
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    res.status(200).json(factura);
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ message: 'Error al obtener factura', error: error.message });
  }
};

// Crear una factura nueva
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const {
      cliente_id,
      numero_factura,
      fecha_emision,
      fecha_vencimiento,
      monto_neto,
      iva,
      monto_total,
      estado,
      metodo_pago,
      observaciones,
      proyecto_id,
      ciudad_emision,
      ciudad_receptor,
      productos
    } = req.body;
    
    // Validar que el cliente exista
    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Validar que el proyecto exista si se proporciona un proyecto_id
    if (proyecto_id) {
      const proyecto = await Proyecto.findByPk(proyecto_id);
      if (!proyecto) {
        await t.rollback();
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }
    }
    
    // Obtener datos del SII para emitir la boleta
    let usuarioSii, otecData;

    try {
      // Obtener credenciales del SII
      usuarioSii = await UsuarioSii.findOne();
      if (!usuarioSii) {
        await t.rollback();
        return res.status(400).json({
          message: 'No se encontraron credenciales del SII configuradas'
        });
      }

      // Obtener datos del emisor (OTEC)
      otecData = await OtecData.findOne();
      if (!otecData) {
        await t.rollback();
        return res.status(400).json({
          message: 'No se encontraron datos de la OTEC configurados'
        });
      }
    } catch (error) {
      console.error('Error al obtener datos del SII:', error);
      await t.rollback();
      return res.status(500).json({
        message: 'Error al obtener datos del SII'
      });
    }

    // Procesar RUT del emisor (eliminar puntos y guión)
    const rutEmisorLimpio = otecData.rut.replace(/\./g, '').replace(/-/g, '');

    // Procesar RUT del receptor
    const rutReceptorProcesado = procesarRut(cliente.rut);

    // Preparar payload para el SII
    const payloadSII = {
      credenciales: {
        rut_usuario: usuarioSii.rut,
        clave: usuarioSii.clave_unica
      },
      emisor: {
        rut: rutEmisorLimpio,
        ciudad: ciudad_emision
      },
      receptor: {
        rut: rutReceptorProcesado.rut,
        dv: rutReceptorProcesado.dv,
        ciudad: ciudad_receptor
      },
      productos: productos && productos.length > 0 ? productos.map(producto => ({
        nombre_producto: producto.descripcion || producto.nombre_producto || 'Producto',
        cantidad: parseFloat(producto.cantidad || 1),
        precio_unitario: parseFloat(producto.precio_unitario || producto.monto || 0),
        monto: parseFloat(producto.precio_unitario || producto.monto || 0)
      })) : [{
        nombre_producto: 'Servicio',
        cantidad: 1,
        precio_unitario: parseFloat(monto_total),
        monto: parseFloat(monto_total)
      }]
    };

    try {
      // Emitir boleta en el SII
      const response = await axios.post(
        'https://emisor-facturas-sii-773544359782.southamerica-west1.run.app/emitir-boleta',
        payloadSII,
        {
          timeout: 60000, // 60 segundos máximo
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        // Solo crear la factura si el SII respondió exitosamente
        const factura = await Factura.create({
          cliente_id,
          numero_factura,
          fecha_emision: fecha_emision || new Date(),
          fecha_vencimiento,
          monto_neto,
          iva,
          monto_total,
          estado: estado || 'borrador',
          metodo_pago,
          observaciones,
          proyecto_id,
          ciudad_emision,
          ciudad_receptor
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
          message: 'Factura creada y emitida en el Servicio de Impuestos Internos correctamente como borrador',
          success: true,
          factura,
          sii_response: {
            message: response.data.message,
            detalles: response.data.detalles,
            url_borradores: 'https://www4.sii.cl/mipymeinternetui/#!/borradores'
          }
        });
      } else {
        await t.rollback();
        return res.status(400).json({
          message: 'La boleta no pudo ser emitida en el SII',
          error: response.data
        });
      }
    } catch (siiError) {
      console.error('Error al emitir boleta en SII:', siiError);
      await t.rollback();

      return res.status(500).json({
        message: 'Error al emitir la boleta en el Servicio de Impuestos Internos. La factura no fue guardada.',
        error: siiError.response?.data || siiError.message,
        details: 'Por favor, intenta nuevamente. Si el problema persiste, contacta al administrador.'
      });
    }
  } catch (error) {
    await t.rollback();
    console.error('Error al crear factura:', error);
    res.status(500).json({ message: 'Error al crear factura', error: error.message });
  }
};

// Actualizar una factura existente
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      cliente_id, 
      numero_factura, 
      fecha_emision, 
      fecha_vencimiento, 
      monto_neto, 
      iva, 
      monto_total, 
      estado, 
      fecha_pago,
      metodo_pago, 
      observaciones,
      url_pdf,
      url_xml,
      folio_sii,
      proyecto_id
    } = req.body;
    
    // Verificar que la factura exista
    const factura = await Factura.findByPk(id);
    if (!factura) {
      await t.rollback();
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    // Validar que el cliente exista si se proporciona un cliente_id
    if (cliente_id) {
      const cliente = await Cliente.findByPk(cliente_id);
      if (!cliente) {
        await t.rollback();
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
    }
    
    // Validar que el proyecto exista si se proporciona un proyecto_id
    if (proyecto_id) {
      const proyecto = await Proyecto.findByPk(proyecto_id);
      if (!proyecto) {
        await t.rollback();
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }
    }
    
    // Verificar que el nuevo número de factura no esté en uso por otra factura
    if (numero_factura && numero_factura !== factura.numero_factura) {
      const facturaExistente = await Factura.findOne({
        where: { 
          numero_factura,
          id: { [Op.ne]: id }
        }
      });
      
      if (facturaExistente) {
        await t.rollback();
        return res.status(400).json({ message: 'Ya existe otra factura con este número' });
      }
    }
    
    // Actualizar la factura
    await factura.update({
      cliente_id: cliente_id || factura.cliente_id,
      numero_factura: numero_factura || factura.numero_factura,
      fecha_emision: fecha_emision || factura.fecha_emision,
      fecha_vencimiento: fecha_vencimiento || factura.fecha_vencimiento,
      monto_neto: monto_neto || factura.monto_neto,
      iva: iva || factura.iva,
      monto_total: monto_total || factura.monto_total,
      estado: estado || factura.estado,
      fecha_pago: fecha_pago || factura.fecha_pago,
      metodo_pago: metodo_pago || factura.metodo_pago,
      observaciones: observaciones !== undefined ? observaciones : factura.observaciones,
      url_pdf: url_pdf || factura.url_pdf,
      url_xml: url_xml || factura.url_xml,
      folio_sii: folio_sii || factura.folio_sii,
      proyecto_id: proyecto_id || factura.proyecto_id
    }, { transaction: t });
    
    await t.commit();
    
    // Obtener la factura actualizada con las relaciones
    const facturaActualizada = await Factura.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social', 'rut']
        },
        {
          model: Proyecto,
          as: 'Proyecto',
          attributes: ['id', 'nombre', 'proyect_id'],
          required: false
        }
      ]
    });
    
    res.status(200).json({
      message: 'Factura actualizada exitosamente',
      factura: facturaActualizada
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar factura:', error);
    res.status(500).json({ message: 'Error al actualizar factura', error: error.message });
  }
};

// Eliminar una factura (soft delete - cambiar estado a 'anulada')
exports.delete = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Verificar que la factura exista
    const factura = await Factura.findByPk(id);
    if (!factura) {
      await t.rollback();
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    // Cambiar estado a 'anulada'
    await factura.update({
      estado: 'anulada',
      observaciones: factura.observaciones 
        ? `${factura.observaciones} - Anulada: ${new Date().toISOString()}`
        : `Anulada: ${new Date().toISOString()}`
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Factura anulada exitosamente',
      id
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al anular factura:', error);
    res.status(500).json({ message: 'Error al anular factura', error: error.message });
  }
};

// Cambiar estado de factura
exports.cambiarEstado = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { estado, fecha_pago, metodo_pago } = req.body;
    
    // Verificar que la factura exista
    const factura = await Factura.findByPk(id);
    if (!factura) {
      await t.rollback();
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    // Validar el estado
    const estadosValidos = ['emitida', 'pagada', 'anulada', 'vencida'];
    if (!estadosValidos.includes(estado)) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'Estado no válido', 
        estadosValidos 
      });
    }
    
    // Si el estado es 'pagada', la fecha_pago es requerida
    if (estado === 'pagada' && !fecha_pago) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'La fecha de pago es requerida cuando el estado es "pagada"'
      });
    }
    
    // Actualizar el estado de la factura
    const actualizacion = {
      estado,
      fecha_pago: estado === 'pagada' ? (fecha_pago || new Date()) : factura.fecha_pago
    };
    
    if (metodo_pago && estado === 'pagada') {
      actualizacion.metodo_pago = metodo_pago;
    }
    
    await factura.update(actualizacion, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: `Factura actualizada a estado "${estado}" exitosamente`,
      factura: await Factura.findByPk(id)
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al cambiar estado de factura:', error);
    res.status(500).json({ message: 'Error al cambiar estado de factura', error: error.message });
  }
};

// Emitir factura electrónica en SII
exports.emitirFacturaElectronica = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la factura exista
    const factura = await Factura.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social', 'rut', 'direccion', 'comuna', 'ciudad', 'giro']
        }
      ]
    });
    
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    // Verificar que la factura no esté ya emitida electrónicamente
    if (factura.folio_sii) {
      return res.status(400).json({ 
        message: 'Esta factura ya ha sido emitida electrónicamente',
        folio_sii: factura.folio_sii
      });
    }
    
    // Aquí iría la integración con el servicio del SII
    // Por ahora simulamos la respuesta
    const folioSimulado = `F${Math.floor(Math.random() * 1000000)}`;
    const urlPdfSimulada = `/storage/facturas/pdf/${folioSimulado}.pdf`;
    const urlXmlSimulada = `/storage/facturas/xml/${folioSimulado}.xml`;
    
    // Actualizar la factura con la información de la emisión electrónica
    await factura.update({
      folio_sii: folioSimulado,
      url_pdf: urlPdfSimulada,
      url_xml: urlXmlSimulada
    });
    
    res.status(200).json({
      message: 'Factura emitida electrónicamente con éxito',
      folio_sii: folioSimulado,
      url_pdf: urlPdfSimulada,
      url_xml: urlXmlSimulada
    });
  } catch (error) {
    console.error('Error al emitir factura electrónica:', error);
    res.status(500).json({ message: 'Error al emitir factura electrónica', error: error.message });
  }
};

// Obtener estadísticas de facturación
exports.getEstadisticas = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    
    // Definir el rango de fechas
    const fechaDesde = desde ? new Date(desde) : new Date(new Date().getFullYear(), 0, 1);
    const fechaHasta = hasta ? new Date(hasta) : new Date();
    
    // Estadísticas por estado
    const estadisticasPorEstado = await Factura.findAll({
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total']
      ],
      where: {
        fecha_emision: {
          [Op.between]: [fechaDesde, fechaHasta]
        }
      },
      group: ['estado']
    });
    
    // Total facturado por mes
    const facturacionPorMes = await Factura.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('fecha_emision')), 'mes'],
        [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total']
      ],
      where: {
        fecha_emision: {
          [Op.between]: [fechaDesde, fechaHasta]
        },
        estado: {
          [Op.ne]: 'anulada'
        }
      },
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('fecha_emision'))],
      order: [sequelize.fn('date_trunc', 'month', sequelize.col('fecha_emision'))]
    });
    
    // Top clientes por facturación
    const topClientes = await Factura.findAll({
      attributes: [
        'cliente_id',
        [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad_facturas']
      ],
      where: {
        fecha_emision: {
          [Op.between]: [fechaDesde, fechaHasta]
        },
        estado: {
          [Op.ne]: 'anulada'
        }
      },
      group: ['cliente_id'],
      order: [[sequelize.fn('SUM', sequelize.col('monto_total')), 'DESC']],
      limit: 10,
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['razon_social', 'rut']
        }
      ]
    });
    
    // Facturas pendientes de pago (vencidas)
    const facturasPendientes = await Factura.findAll({
      where: {
        estado: 'emitida',
        fecha_vencimiento: {
          [Op.lt]: new Date()
        }
      },
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social', 'rut']
        }
      ],
      order: [['fecha_vencimiento', 'ASC']]
    });
    
    res.status(200).json({
      estadisticasPorEstado,
      facturacionPorMes,
      topClientes,
      facturasPendientes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de facturación:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
}; 