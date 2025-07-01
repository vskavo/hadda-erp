const { CuentaBancaria, Ingreso, Egreso, sequelize } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las cuentas bancarias con paginación y filtros
exports.findAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      banco, 
      estado,
      search,
      sortBy = 'nombre', 
      sortOrder = 'ASC' 
    } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const whereConditions = {};
    
    if (banco) {
      whereConditions.banco = banco;
    }
    
    if (estado) {
      whereConditions.estado = estado;
    }
    
    if (search) {
      whereConditions[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { banco: { [Op.like]: `%${search}%` } },
        { numero_cuenta: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Ejecutar la consulta
    const { count, rows: cuentas } = await CuentaBancaria.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]]
    });
    
    res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      cuentas
    });
  } catch (error) {
    console.error('Error al obtener cuentas bancarias:', error);
    res.status(500).json({ message: 'Error al obtener cuentas bancarias', error: error.message });
  }
};

// Obtener una cuenta bancaria por ID
exports.findOne = async (req, res) => {
  try {
    const cuenta = await CuentaBancaria.findByPk(req.params.id);
    
    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });
    }
    
    res.status(200).json(cuenta);
  } catch (error) {
    console.error('Error al obtener cuenta bancaria:', error);
    res.status(500).json({ message: 'Error al obtener cuenta bancaria', error: error.message });
  }
};

// Crear una nueva cuenta bancaria
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      nombre, 
      banco, 
      tipo_cuenta,
      numero_cuenta, 
      titular, 
      rut_titular,
      saldo_inicial,
      descripcion,
      moneda
    } = req.body;
    
    // Validaciones
    if (!nombre || !banco || !numero_cuenta || !titular) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'Los campos nombre, banco, número de cuenta y titular son obligatorios' 
      });
    }
    
    // Verificar si ya existe una cuenta con el mismo número
    const cuentaExistente = await CuentaBancaria.findOne({
      where: {
        [Op.and]: [
          { banco },
          { numero_cuenta }
        ]
      }
    });
    
    if (cuentaExistente) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'Ya existe una cuenta bancaria con ese número en el mismo banco' 
      });
    }
    
    // Crear la cuenta bancaria
    const cuenta = await CuentaBancaria.create({
      nombre,
      banco,
      tipo_cuenta: tipo_cuenta || 'corriente',
      numero_cuenta,
      titular,
      rut_titular,
      saldo_inicial: saldo_inicial || 0,
      saldo_actual: saldo_inicial || 0,
      saldo_contable: saldo_inicial || 0,
      descripcion,
      moneda: moneda || 'CLP',
      estado: 'activa',
      fecha_apertura: new Date(),
      usuario_id: req.usuario.id // Usuario que crea la cuenta
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).json({
      message: 'Cuenta bancaria creada exitosamente',
      cuenta
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear cuenta bancaria:', error);
    res.status(500).json({ message: 'Error al crear cuenta bancaria', error: error.message });
  }
};

// Actualizar una cuenta bancaria
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      nombre, 
      banco, 
      tipo_cuenta,
      numero_cuenta, 
      titular, 
      rut_titular,
      descripcion,
      moneda,
      estado
    } = req.body;
    
    // Verificar que la cuenta existe
    const cuenta = await CuentaBancaria.findByPk(id);
    if (!cuenta) {
      await t.rollback();
      return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });
    }
    
    // Verificar si ya existe otra cuenta con el mismo número (excluyendo esta)
    if (banco && numero_cuenta) {
      const cuentaExistente = await CuentaBancaria.findOne({
        where: {
          [Op.and]: [
            { banco },
            { numero_cuenta },
            { id: { [Op.ne]: id } }
          ]
        }
      });
      
      if (cuentaExistente) {
        await t.rollback();
        return res.status(400).json({ 
          message: 'Ya existe otra cuenta bancaria con ese número en el mismo banco' 
        });
      }
    }
    
    // Actualizar la cuenta
    await cuenta.update({
      nombre: nombre || cuenta.nombre,
      banco: banco || cuenta.banco,
      tipo_cuenta: tipo_cuenta || cuenta.tipo_cuenta,
      numero_cuenta: numero_cuenta || cuenta.numero_cuenta,
      titular: titular || cuenta.titular,
      rut_titular: rut_titular !== undefined ? rut_titular : cuenta.rut_titular,
      descripcion: descripcion !== undefined ? descripcion : cuenta.descripcion,
      moneda: moneda || cuenta.moneda,
      estado: estado || cuenta.estado
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Cuenta bancaria actualizada exitosamente',
      cuenta
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar cuenta bancaria:', error);
    res.status(500).json({ message: 'Error al actualizar cuenta bancaria', error: error.message });
  }
};

// Actualizar el saldo de una cuenta bancaria
exports.actualizarSaldo = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { saldo_actual, motivo } = req.body;
    
    // Verificar que la cuenta existe
    const cuenta = await CuentaBancaria.findByPk(id);
    if (!cuenta) {
      await t.rollback();
      return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });
    }
    
    // Validaciones
    if (saldo_actual === undefined) {
      await t.rollback();
      return res.status(400).json({ message: 'El saldo actual es obligatorio' });
    }
    
    // Registrar el ajuste como un movimiento
    const diferenciaAjuste = parseFloat(saldo_actual) - parseFloat(cuenta.saldo_actual);
    
    if (diferenciaAjuste !== 0) {
      // Registrar ajuste como ingreso o egreso según corresponda
      const descripcionAjuste = `Ajuste de saldo${motivo ? `: ${motivo}` : ''}`;
      
      if (diferenciaAjuste > 0) {
        // Es un ingreso (ajuste positivo)
        await Ingreso.create({
          monto: Math.abs(diferenciaAjuste),
          descripcion: descripcionAjuste,
          fecha: new Date(),
          tipo: 'ajuste',
          cuenta_bancaria_id: id,
          estado: 'confirmado',
          usuario_id: req.usuario.id
        }, { transaction: t });
      } else {
        // Es un egreso (ajuste negativo)
        await Egreso.create({
          monto: Math.abs(diferenciaAjuste),
          descripcion: descripcionAjuste,
          fecha: new Date(),
          tipo: 'ajuste',
          cuenta_bancaria_id: id,
          estado: 'pagado',
          usuario_id: req.usuario.id
        }, { transaction: t });
      }
    }
    
    // Actualizar el saldo
    await cuenta.update({
      saldo_actual,
      fecha_ultimo_movimiento: new Date()
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Saldo de cuenta bancaria actualizado exitosamente',
      cuenta
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar saldo de cuenta bancaria:', error);
    res.status(500).json({ message: 'Error al actualizar saldo', error: error.message });
  }
};

// Desactivar una cuenta bancaria
exports.desactivar = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    // Verificar que la cuenta existe
    const cuenta = await CuentaBancaria.findByPk(id);
    if (!cuenta) {
      await t.rollback();
      return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });
    }
    
    // Verificar que no esté ya desactivada
    if (cuenta.estado === 'inactiva') {
      await t.rollback();
      return res.status(400).json({ message: 'La cuenta ya está desactivada' });
    }
    
    // Actualizar la cuenta
    await cuenta.update({
      estado: 'inactiva',
      fecha_cierre: new Date(),
      descripcion: motivo 
        ? `${cuenta.descripcion ? cuenta.descripcion + ' - ' : ''}Motivo cierre: ${motivo}`
        : cuenta.descripcion
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Cuenta bancaria desactivada exitosamente',
      cuenta
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al desactivar cuenta bancaria:', error);
    res.status(500).json({ message: 'Error al desactivar cuenta bancaria', error: error.message });
  }
};

// Obtener el historial de movimientos de una cuenta bancaria
exports.getMovimientos = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      desde, 
      hasta, 
      tipo, 
      conciliado,
      page = 1, 
      limit = 20
    } = req.query;
    const offset = (page - 1) * limit;
    
    // Verificar que la cuenta existe
    const cuenta = await CuentaBancaria.findByPk(id);
    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });
    }
    
    // Condiciones de búsqueda
    const baseConditions = {
      cuenta_bancaria_id: id
    };
    
    // Filtro por fecha
    if (desde || hasta) {
      baseConditions.fecha = {};
      if (desde) baseConditions.fecha[Op.gte] = new Date(desde);
      if (hasta) baseConditions.fecha[Op.lte] = new Date(hasta);
    }
    
    // Filtro por estado de conciliación
    if (conciliado !== undefined) {
      baseConditions.conciliado = conciliado === 'true';
    }
    
    // Consultas separadas para ingresos y egresos
    let ingresos = [];
    let egresos = [];
    let totalIngresos = 0;
    let totalEgresos = 0;
    
    if (!tipo || tipo === 'ingreso') {
      const ingresosResult = await Ingreso.findAndCountAll({
        where: {
          ...baseConditions,
          estado: { [Op.ne]: 'anulado' }
        },
        order: [['fecha', 'DESC']],
        limit: parseInt(limit),
        offset
      });
      
      ingresos = ingresosResult.rows.map(ingreso => ({
        ...ingreso.toJSON(),
        tipo_movimiento: 'ingreso'
      }));
      
      totalIngresos = ingresosResult.count;
    }
    
    if (!tipo || tipo === 'egreso') {
      const egresosResult = await Egreso.findAndCountAll({
        where: {
          ...baseConditions,
          estado: { [Op.ne]: 'anulado' }
        },
        order: [['fecha', 'DESC']],
        limit: parseInt(limit),
        offset
      });
      
      egresos = egresosResult.rows.map(egreso => ({
        ...egreso.toJSON(),
        tipo_movimiento: 'egreso'
      }));
      
      totalEgresos = egresosResult.count;
    }
    
    // Combinar y ordenar resultados
    const movimientos = [...ingresos, ...egresos].sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    }).slice(0, limit);
    
    const total = totalIngresos + totalEgresos;
    
    res.status(200).json({
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      movimientos
    });
  } catch (error) {
    console.error('Error al obtener movimientos de cuenta bancaria:', error);
    res.status(500).json({ message: 'Error al obtener movimientos', error: error.message });
  }
};

// Obtener resumen y estadísticas de la cuenta bancaria
exports.getResumen = async (req, res) => {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.query;
    
    // Verificar que la cuenta existe
    const cuenta = await CuentaBancaria.findByPk(id);
    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });
    }
    
    // Definir rango de fechas
    const fechaDesde = desde ? new Date(desde) : new Date(new Date().setDate(1)); // Primer día del mes actual
    const fechaHasta = hasta ? new Date(hasta) : new Date(); // Hoy
    
    // Condiciones de búsqueda
    const whereConditions = {
      cuenta_bancaria_id: id,
      fecha: {
        [Op.between]: [fechaDesde, fechaHasta]
      }
    };
    
    // Obtener total de ingresos en el período
    const totalIngresos = await Ingreso.sum('monto', {
      where: {
        ...whereConditions,
        estado: { [Op.ne]: 'anulado' }
      }
    }) || 0;
    
    // Obtener total de egresos en el período
    const totalEgresos = await Egreso.sum('monto', {
      where: {
        ...whereConditions,
        estado: { [Op.ne]: 'anulado' }
      }
    }) || 0;
    
    // Obtener ingresos pendientes de conciliación
    const ingresosPendientes = await Ingreso.sum('monto', {
      where: {
        cuenta_bancaria_id: id,
        conciliado: false,
        estado: { [Op.ne]: 'anulado' }
      }
    }) || 0;
    
    // Obtener egresos pendientes de conciliación
    const egresosPendientes = await Egreso.sum('monto', {
      where: {
        cuenta_bancaria_id: id,
        conciliado: false,
        estado: { [Op.ne]: 'anulado' }
      }
    }) || 0;
    
    // Obtener ingresos por tipo
    const ingresosPorTipo = await Ingreso.findAll({
      attributes: [
        'tipo',
        [sequelize.fn('SUM', sequelize.col('monto')), 'total']
      ],
      where: {
        ...whereConditions,
        estado: { [Op.ne]: 'anulado' }
      },
      group: ['tipo']
    });
    
    // Obtener egresos por tipo
    const egresosPorTipo = await Egreso.findAll({
      attributes: [
        'tipo',
        [sequelize.fn('SUM', sequelize.col('monto')), 'total']
      ],
      where: {
        ...whereConditions,
        estado: { [Op.ne]: 'anulado' }
      },
      group: ['tipo']
    });
    
    // Obtener últimos movimientos
    const ultimosIngresos = await Ingreso.findAll({
      where: {
        cuenta_bancaria_id: id,
        estado: { [Op.ne]: 'anulado' }
      },
      order: [['fecha', 'DESC']],
      limit: 5
    });
    
    const ultimosEgresos = await Egreso.findAll({
      where: {
        cuenta_bancaria_id: id,
        estado: { [Op.ne]: 'anulado' }
      },
      order: [['fecha', 'DESC']],
      limit: 5
    });
    
    res.status(200).json({
      cuenta: {
        id: cuenta.id,
        nombre: cuenta.nombre,
        banco: cuenta.banco,
        numero_cuenta: cuenta.numero_cuenta,
        saldo_actual: cuenta.saldo_actual,
        saldo_contable: cuenta.saldo_contable,
        diferencia: parseFloat(cuenta.saldo_actual) - parseFloat(cuenta.saldo_contable),
        fecha_ultimo_movimiento: cuenta.fecha_ultimo_movimiento,
        fecha_ultima_conciliacion: cuenta.fecha_ultima_conciliacion
      },
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta,
        totalIngresos,
        totalEgresos,
        balance: totalIngresos - totalEgresos
      },
      pendientes: {
        ingresosPendientes,
        egresosPendientes,
        diferencia: ingresosPendientes - egresosPendientes
      },
      detalles: {
        ingresosPorTipo,
        egresosPorTipo
      },
      ultimosMovimientos: {
        ingresos: ultimosIngresos,
        egresos: ultimosEgresos
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de cuenta bancaria:', error);
    res.status(500).json({ message: 'Error al obtener resumen', error: error.message });
  }
}; 

// backend/controllers/cuenta-bancaria.controller.js
exports.getEstadoScraping = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ultimoEstado = await EstadoScrapingBancario.findOne({
      where: { cuenta_bancaria_id: id },
      order: [['fecha_inicio', 'DESC']]
    });
    
    const estadisticas = await MovimientoBancarioRaw.findAll({
      attributes: [
        'estado_procesamiento',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('MIN', sequelize.col('fecha_scraping')), 'primera_fecha'],
        [sequelize.fn('MAX', sequelize.col('fecha_scraping')), 'ultima_fecha']
      ],
      where: { cuenta_bancaria_id: id },
      group: ['estado_procesamiento']
    });
    
    res.json({
      ultimo_estado: ultimoEstado,
      estadisticas: estadisticas,
      cuenta: await CuentaBancaria.findByPk(id, {
        attributes: ['id', 'numero', 'banco', 'saldo_actual', 'ultimo_scraping', 'estado_scraping']
      })
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estado de scraping', error: error.message });
  }
};

exports.reprocesarMovimientos = async (req, res) => {
  try {
    const { id } = req.params;
    
    await MovimientoBancarioRaw.update(
      { estado_procesamiento: 'pendiente', procesado_at: null },
      { where: { cuenta_bancaria_id: id, estado_procesamiento: 'error' } }
    );
    
    const total = await MovimientoBancarioRaw.count({
      where: { cuenta_bancaria_id: id, estado_procesamiento: 'pendiente' }
    });
    
    res.json({
      message: 'Movimientos marcados para reprocesamiento',
      pendientes: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al reprocesar movimientos', error: error.message });
  }
};