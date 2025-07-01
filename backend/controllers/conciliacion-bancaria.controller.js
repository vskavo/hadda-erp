const { 
  ConciliacionBancaria, 
  MovimientoConciliacion, 
  CuentaBancaria, 
  Ingreso, 
  Egreso, 
  Usuario, 
  sequelize 
} = require('../models');
const { Op } = require('sequelize');

// Obtener todas las conciliaciones bancarias con paginación y filtros
exports.findAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      estado, 
      cuenta_bancaria_id,
      desde,
      hasta,
      sortBy = 'fecha_creacion', 
      sortOrder = 'DESC' 
    } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const whereConditions = {};
    
    if (estado) {
      whereConditions.estado = estado;
    }
    
    if (cuenta_bancaria_id) {
      whereConditions.cuenta_bancaria_id = cuenta_bancaria_id;
    }
    
    if (desde && hasta) {
      whereConditions.fecha_creacion = {
        [Op.between]: [new Date(desde), new Date(hasta)]
      };
    } else if (desde) {
      whereConditions.fecha_creacion = {
        [Op.gte]: new Date(desde)
      };
    } else if (hasta) {
      whereConditions.fecha_creacion = {
        [Op.lte]: new Date(hasta)
      };
    }
    
    // Ejecutar la consulta
    const { count, rows: conciliaciones } = await ConciliacionBancaria.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: CuentaBancaria,
          as: 'CuentaBancaria',
          attributes: ['id', 'nombre', 'banco', 'numero_cuenta', 'saldo_actual']
        },
        {
          model: Usuario,
          as: 'Usuario',
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });
    
    res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      conciliaciones
    });
  } catch (error) {
    console.error('Error al obtener conciliaciones bancarias:', error);
    res.status(500).json({ message: 'Error al obtener conciliaciones bancarias', error: error.message });
  }
};

// Obtener una conciliación bancaria por ID
exports.findOne = async (req, res) => {
  try {
    const conciliacion = await ConciliacionBancaria.findByPk(req.params.id, {
      include: [
        {
          model: CuentaBancaria,
          as: 'CuentaBancaria',
          attributes: ['id', 'nombre', 'banco', 'numero_cuenta', 'saldo_actual', 'saldo_contable']
        },
        {
          model: Usuario,
          as: 'Usuario',
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: MovimientoConciliacion,
          as: 'Movimientos',
          separate: true,
          order: [['fecha', 'ASC']]
        }
      ]
    });
    
    if (!conciliacion) {
      return res.status(404).json({ message: 'Conciliación bancaria no encontrada' });
    }
    
    res.status(200).json(conciliacion);
  } catch (error) {
    console.error('Error al obtener conciliación bancaria:', error);
    res.status(500).json({ message: 'Error al obtener conciliación bancaria', error: error.message });
  }
};

// Iniciar una nueva conciliación bancaria
exports.iniciar = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      cuenta_bancaria_id, 
      fecha_inicio, 
      fecha_fin, 
      saldo_inicial, 
      saldo_banco, 
      observaciones 
    } = req.body;
    
    // Verificar que la cuenta bancaria exista
    const cuentaBancaria = await CuentaBancaria.findByPk(cuenta_bancaria_id);
    if (!cuentaBancaria) {
      await t.rollback();
      return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });
    }
    
    // Verificar si hay una conciliación en progreso para esta cuenta
    const conciliacionActiva = await ConciliacionBancaria.findOne({
      where: {
        cuenta_bancaria_id,
        estado: 'en_progreso'
      }
    });
    
    if (conciliacionActiva) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'Ya existe una conciliación en progreso para esta cuenta bancaria',
        conciliacion_id: conciliacionActiva.id
      });
    }
    
    // Usar el saldo de la última conciliación finalizada como saldo inicial (si existe)
    let saldoInicial = saldo_inicial || 0;
    const ultimaConciliacion = await ConciliacionBancaria.findOne({
      where: {
        cuenta_bancaria_id,
        estado: 'finalizada'
      },
      order: [['fecha_fin', 'DESC']]
    });
    
    if (ultimaConciliacion && !saldo_inicial) {
      saldoInicial = parseFloat(ultimaConciliacion.saldo_final);
    }
    
    // Crear la conciliación
    const conciliacion = await ConciliacionBancaria.create({
      cuenta_bancaria_id,
      fecha_inicio: fecha_inicio || new Date(new Date().setDate(1)), // Primer día del mes actual
      fecha_fin: fecha_fin || new Date(), // Hoy
      saldo_inicial: saldoInicial,
      saldo_final: saldoInicial, // Inicialmente igual al saldo inicial
      saldo_banco: saldo_banco || saldoInicial,
      diferencia: saldo_banco ? parseFloat(saldo_banco) - saldoInicial : 0,
      estado: 'en_progreso',
      observaciones,
      usuario_id: req.usuario.id // El usuario que está creando la conciliación
    }, { transaction: t });
    
    // Obtener movimientos no conciliados dentro del rango de fechas para esta cuenta
    const ingresos = await Ingreso.findAll({
      where: {
        cuenta_bancaria_id,
        fecha: {
          [Op.between]: [
            conciliacion.fecha_inicio, 
            conciliacion.fecha_fin
          ]
        },
        conciliado: false,
        estado: {
          [Op.ne]: 'anulado'
        }
      }
    });
    
    const egresos = await Egreso.findAll({
      where: {
        cuenta_bancaria_id,
        fecha: {
          [Op.between]: [
            conciliacion.fecha_inicio, 
            conciliacion.fecha_fin
          ]
        },
        conciliado: false,
        estado: {
          [Op.ne]: 'anulado'
        }
      }
    });
    
    // Crear movimientos para la conciliación
    for (const ingreso of ingresos) {
      await MovimientoConciliacion.create({
        conciliacion_id: conciliacion.id,
        tipo_movimiento: 'ingreso',
        movimiento_id: ingreso.id,
        descripcion: ingreso.descripcion,
        monto: ingreso.monto,
        fecha: ingreso.fecha,
        conciliado: false
      }, { transaction: t });
    }
    
    for (const egreso of egresos) {
      await MovimientoConciliacion.create({
        conciliacion_id: conciliacion.id,
        tipo_movimiento: 'egreso',
        movimiento_id: egreso.id,
        descripcion: egreso.descripcion,
        monto: egreso.monto,
        fecha: egreso.fecha,
        conciliado: false
      }, { transaction: t });
    }
    
    await t.commit();
    
    // Obtener la conciliación con todos sus datos
    const conciliacionCompleta = await ConciliacionBancaria.findByPk(conciliacion.id, {
      include: [
        {
          model: CuentaBancaria,
          as: 'CuentaBancaria',
          attributes: ['id', 'nombre', 'banco', 'numero_cuenta', 'saldo_actual']
        },
        {
          model: MovimientoConciliacion,
          as: 'Movimientos',
          separate: true,
          order: [['fecha', 'ASC']]
        }
      ]
    });
    
    res.status(201).json({
      message: 'Conciliación bancaria iniciada exitosamente',
      conciliacion: conciliacionCompleta
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al iniciar conciliación bancaria:', error);
    res.status(500).json({ message: 'Error al iniciar conciliación bancaria', error: error.message });
  }
};

// Actualizar una conciliación bancaria
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      fecha_inicio, 
      fecha_fin, 
      saldo_inicial, 
      saldo_banco, 
      observaciones 
    } = req.body;
    
    // Verificar que la conciliación exista
    const conciliacion = await ConciliacionBancaria.findByPk(id);
    if (!conciliacion) {
      await t.rollback();
      return res.status(404).json({ message: 'Conciliación bancaria no encontrada' });
    }
    
    // Verificar que la conciliación esté en progreso
    if (conciliacion.estado !== 'en_progreso') {
      await t.rollback();
      return res.status(400).json({ message: `No se puede actualizar una conciliación en estado "${conciliacion.estado}"` });
    }
    
    // Actualizar los datos
    await conciliacion.update({
      fecha_inicio: fecha_inicio || conciliacion.fecha_inicio,
      fecha_fin: fecha_fin || conciliacion.fecha_fin,
      saldo_inicial: saldo_inicial !== undefined ? saldo_inicial : conciliacion.saldo_inicial,
      saldo_banco: saldo_banco !== undefined ? saldo_banco : conciliacion.saldo_banco,
      observaciones: observaciones !== undefined ? observaciones : conciliacion.observaciones
    }, { transaction: t });
    
    // Recalcular saldo final
    const movimientos = await MovimientoConciliacion.findAll({
      where: {
        conciliacion_id: id,
        conciliado: true
      }
    });
    
    let saldoFinal = parseFloat(conciliacion.saldo_inicial);
    
    for (const movimiento of movimientos) {
      if (movimiento.tipo_movimiento === 'ingreso') {
        saldoFinal += parseFloat(movimiento.monto);
      } else if (movimiento.tipo_movimiento === 'egreso') {
        saldoFinal -= parseFloat(movimiento.monto);
      } else if (movimiento.tipo_movimiento === 'ajuste') {
        saldoFinal += parseFloat(movimiento.monto); // Los ajustes pueden ser positivos o negativos
      }
    }
    
    // Actualizar el saldo final y la diferencia
    await conciliacion.update({
      saldo_final: saldoFinal,
      diferencia: parseFloat(conciliacion.saldo_banco) - saldoFinal
    }, { transaction: t });
    
    await t.commit();
    
    const conciliacionActualizada = await ConciliacionBancaria.findByPk(id, {
      include: [
        {
          model: CuentaBancaria,
          as: 'CuentaBancaria',
          attributes: ['id', 'nombre', 'banco', 'numero_cuenta']
        },
        {
          model: MovimientoConciliacion,
          as: 'Movimientos',
          separate: true,
          order: [['fecha', 'ASC']]
        }
      ]
    });
    
    res.status(200).json({
      message: 'Conciliación bancaria actualizada exitosamente',
      conciliacion: conciliacionActualizada
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar conciliación bancaria:', error);
    res.status(500).json({ message: 'Error al actualizar conciliación bancaria', error: error.message });
  }
};

// Añadir un movimiento a la conciliación
exports.addMovimiento = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      tipo_movimiento, 
      descripcion, 
      monto, 
      fecha, 
      referencia_banco, 
      observaciones,
      conciliado 
    } = req.body;
    
    // Verificar que la conciliación exista
    const conciliacion = await ConciliacionBancaria.findByPk(id);
    if (!conciliacion) {
      await t.rollback();
      return res.status(404).json({ message: 'Conciliación bancaria no encontrada' });
    }
    
    // Verificar que la conciliación esté en progreso
    if (conciliacion.estado !== 'en_progreso') {
      await t.rollback();
      return res.status(400).json({ message: `No se puede añadir movimientos a una conciliación en estado "${conciliacion.estado}"` });
    }
    
    // Validar datos
    if (!tipo_movimiento || !monto || !fecha) {
      await t.rollback();
      return res.status(400).json({ message: 'El tipo de movimiento, monto y fecha son obligatorios' });
    }
    
    if (!['ingreso', 'egreso', 'ajuste'].includes(tipo_movimiento)) {
      await t.rollback();
      return res.status(400).json({ message: 'Tipo de movimiento inválido. Debe ser "ingreso", "egreso" o "ajuste"' });
    }
    
    // Crear el movimiento
    const movimiento = await MovimientoConciliacion.create({
      conciliacion_id: id,
      tipo_movimiento,
      descripcion,
      monto,
      fecha: new Date(fecha),
      referencia_banco,
      observaciones,
      conciliado: conciliado || false
    }, { transaction: t });
    
    // Si el movimiento está conciliado, actualizar el saldo final
    if (conciliado) {
      let saldoFinal = parseFloat(conciliacion.saldo_final);
      
      if (tipo_movimiento === 'ingreso') {
        saldoFinal += parseFloat(monto);
      } else if (tipo_movimiento === 'egreso') {
        saldoFinal -= parseFloat(monto);
      } else if (tipo_movimiento === 'ajuste') {
        saldoFinal += parseFloat(monto);
      }
      
      await conciliacion.update({
        saldo_final: saldoFinal,
        diferencia: parseFloat(conciliacion.saldo_banco) - saldoFinal
      }, { transaction: t });
    }
    
    await t.commit();
    
    res.status(201).json({
      message: 'Movimiento añadido exitosamente',
      movimiento
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al añadir movimiento:', error);
    res.status(500).json({ message: 'Error al añadir movimiento', error: error.message });
  }
};

// Conciliar un movimiento
exports.conciliarMovimiento = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id, movimientoId } = req.params;
    const { conciliado, referencia_banco } = req.body;
    
    // Verificar que la conciliación exista
    const conciliacion = await ConciliacionBancaria.findByPk(id);
    if (!conciliacion) {
      await t.rollback();
      return res.status(404).json({ message: 'Conciliación bancaria no encontrada' });
    }
    
    // Verificar que la conciliación esté en progreso
    if (conciliacion.estado !== 'en_progreso') {
      await t.rollback();
      return res.status(400).json({ message: `No se pueden conciliar movimientos en una conciliación en estado "${conciliacion.estado}"` });
    }
    
    // Verificar que el movimiento exista
    const movimiento = await MovimientoConciliacion.findOne({
      where: {
        id: movimientoId,
        conciliacion_id: id
      }
    });
    
    if (!movimiento) {
      await t.rollback();
      return res.status(404).json({ message: 'Movimiento no encontrado en esta conciliación' });
    }
    
    // Determinar si se está conciliando o desconciliando
    const estaConciliando = conciliado && !movimiento.conciliado;
    const estaDesconciliando = conciliado === false && movimiento.conciliado;
    
    // Actualizar el movimiento
    await movimiento.update({
      conciliado: conciliado !== undefined ? conciliado : movimiento.conciliado,
      referencia_banco: referencia_banco || movimiento.referencia_banco
    }, { transaction: t });
    
    // Actualizar el saldo final si se cambia el estado de conciliación
    if (estaConciliando || estaDesconciliando) {
      let saldoFinal = parseFloat(conciliacion.saldo_final);
      
      if (estaConciliando) {
        // Si estamos conciliando, ajustar el saldo
        if (movimiento.tipo_movimiento === 'ingreso') {
          saldoFinal += parseFloat(movimiento.monto);
        } else if (movimiento.tipo_movimiento === 'egreso') {
          saldoFinal -= parseFloat(movimiento.monto);
        } else if (movimiento.tipo_movimiento === 'ajuste') {
          saldoFinal += parseFloat(movimiento.monto);
        }
      } else if (estaDesconciliando) {
        // Si estamos desconciliando, revertir el ajuste
        if (movimiento.tipo_movimiento === 'ingreso') {
          saldoFinal -= parseFloat(movimiento.monto);
        } else if (movimiento.tipo_movimiento === 'egreso') {
          saldoFinal += parseFloat(movimiento.monto);
        } else if (movimiento.tipo_movimiento === 'ajuste') {
          saldoFinal -= parseFloat(movimiento.monto);
        }
      }
      
      await conciliacion.update({
        saldo_final: saldoFinal,
        diferencia: parseFloat(conciliacion.saldo_banco) - saldoFinal
      }, { transaction: t });
    }
    
    // Si el movimiento corresponde a un ingreso o egreso real, actualizarlo también
    if (movimiento.movimiento_id) {
      if (movimiento.tipo_movimiento === 'ingreso') {
        await Ingreso.update({
          conciliado: movimiento.conciliado,
          fecha_conciliacion: movimiento.conciliado ? new Date() : null
        }, {
          where: { id: movimiento.movimiento_id },
          transaction: t
        });
      } else if (movimiento.tipo_movimiento === 'egreso') {
        await Egreso.update({
          conciliado: movimiento.conciliado,
          fecha_conciliacion: movimiento.conciliado ? new Date() : null
        }, {
          where: { id: movimiento.movimiento_id },
          transaction: t
        });
      }
    }
    
    await t.commit();
    
    res.status(200).json({
      message: `Movimiento ${movimiento.conciliado ? 'conciliado' : 'desconciliado'} exitosamente`,
      movimiento
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al conciliar movimiento:', error);
    res.status(500).json({ message: 'Error al conciliar movimiento', error: error.message });
  }
};

// Finalizar una conciliación bancaria
exports.finalizar = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Verificar que la conciliación exista
    const conciliacion = await ConciliacionBancaria.findByPk(id, {
      include: [
        {
          model: CuentaBancaria,
          as: 'CuentaBancaria'
        }
      ]
    });
    
    if (!conciliacion) {
      await t.rollback();
      return res.status(404).json({ message: 'Conciliación bancaria no encontrada' });
    }
    
    // Verificar que la conciliación esté en progreso
    if (conciliacion.estado !== 'en_progreso') {
      await t.rollback();
      return res.status(400).json({ message: `No se puede finalizar una conciliación en estado "${conciliacion.estado}"` });
    }
    
    // Verificar si la diferencia es cero
    if (parseFloat(conciliacion.diferencia) !== 0) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'No se puede finalizar la conciliación porque hay una diferencia entre el saldo calculado y el saldo del banco', 
        diferencia: conciliacion.diferencia 
      });
    }
    
    // Finalizar la conciliación
    await conciliacion.update({
      estado: 'finalizada',
      fecha_finalizacion: new Date()
    }, { transaction: t });
    
    // Actualizar el saldo contable de la cuenta bancaria
    await conciliacion.CuentaBancaria.update({
      saldo_contable: conciliacion.saldo_final,
      fecha_ultima_conciliacion: new Date()
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Conciliación bancaria finalizada exitosamente',
      id: conciliacion.id,
      saldo_final: conciliacion.saldo_final,
      fecha_finalizacion: conciliacion.fecha_finalizacion
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al finalizar conciliación bancaria:', error);
    res.status(500).json({ message: 'Error al finalizar conciliación bancaria', error: error.message });
  }
};

// Anular una conciliación bancaria
exports.anular = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    // Verificar que la conciliación exista
    const conciliacion = await ConciliacionBancaria.findByPk(id);
    if (!conciliacion) {
      await t.rollback();
      return res.status(404).json({ message: 'Conciliación bancaria no encontrada' });
    }
    
    // Verificar que la conciliación no esté ya anulada
    if (conciliacion.estado === 'anulada') {
      await t.rollback();
      return res.status(400).json({ message: 'Esta conciliación ya está anulada' });
    }
    
    // Si la conciliación está finalizada, no se puede anular
    if (conciliacion.estado === 'finalizada') {
      await t.rollback();
      return res.status(400).json({ message: 'No se puede anular una conciliación finalizada' });
    }
    
    // Anular la conciliación
    await conciliacion.update({
      estado: 'anulada',
      observaciones: motivo 
        ? `${conciliacion.observaciones ? conciliacion.observaciones + ' - ' : ''}Anulada: ${motivo}`
        : `${conciliacion.observaciones ? conciliacion.observaciones + ' - ' : ''}Anulada: ${new Date().toISOString()}`
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Conciliación bancaria anulada exitosamente',
      id
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al anular conciliación bancaria:', error);
    res.status(500).json({ message: 'Error al anular conciliación bancaria', error: error.message });
  }
};

// Obtener estadísticas de conciliaciones bancarias
exports.getEstadisticas = async (req, res) => {
  try {
    const { cuenta_bancaria_id, desde, hasta } = req.query;
    
    // Definir el rango de fechas
    const fechaDesde = desde ? new Date(desde) : new Date(new Date().getFullYear(), 0, 1);
    const fechaHasta = hasta ? new Date(hasta) : new Date();
    
    // Condiciones de búsqueda
    const whereConditions = {
      fecha_creacion: {
        [Op.between]: [fechaDesde, fechaHasta]
      }
    };
    
    if (cuenta_bancaria_id) {
      whereConditions.cuenta_bancaria_id = cuenta_bancaria_id;
    }
    
    // Estadísticas por estado
    const estadisticasPorEstado = await ConciliacionBancaria.findAll({
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      where: whereConditions,
      group: ['estado']
    });
    
    // Estadísticas por cuenta bancaria
    const estadisticasPorCuenta = await ConciliacionBancaria.findAll({
      attributes: [
        'cuenta_bancaria_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('MAX', sequelize.col('fecha_finalizacion')), 'ultima_conciliacion']
      ],
      where: {
        ...whereConditions,
        estado: 'finalizada'
      },
      group: ['cuenta_bancaria_id'],
      include: [
        {
          model: CuentaBancaria,
          as: 'CuentaBancaria',
          attributes: ['nombre', 'banco', 'numero_cuenta', 'saldo_actual', 'saldo_contable']
        }
      ]
    });
    
    // Últimas conciliaciones finalizadas
    const ultimasConciliaciones = await ConciliacionBancaria.findAll({
      where: {
        ...whereConditions,
        estado: 'finalizada'
      },
      order: [['fecha_finalizacion', 'DESC']],
      limit: 10,
      include: [
        {
          model: CuentaBancaria,
          as: 'CuentaBancaria',
          attributes: ['id', 'nombre', 'banco', 'numero_cuenta']
        },
        {
          model: Usuario,
          as: 'Usuario',
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });
    
    // Conciliaciones en progreso
    const conciliacionesEnProgreso = await ConciliacionBancaria.findAll({
      where: {
        estado: 'en_progreso'
      },
      include: [
        {
          model: CuentaBancaria,
          as: 'CuentaBancaria',
          attributes: ['id', 'nombre', 'banco', 'numero_cuenta']
        },
        {
          model: Usuario,
          as: 'Usuario',
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });
    
    res.status(200).json({
      estadisticasPorEstado,
      estadisticasPorCuenta,
      ultimasConciliaciones,
      conciliacionesEnProgreso
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de conciliaciones bancarias:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
}; 