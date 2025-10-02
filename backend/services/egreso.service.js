const { Egreso, Proyecto, CuentaBancaria, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');
const { EntityNotFoundError, validarExistenciaEntidad } = require('../utils/dbUtils'); // Importar desde dbUtils

// Definiciones de includes para findAll en Egresos
const includesForEgresosFindAll = [
  {
    model: Proyecto,
    as: 'Proyecto',
    attributes: ['id', 'nombre'],
    required: false
  },
  {
    model: CuentaBancaria,
    as: 'CuentaBancariaEgreso', // Alias específico para egresos
    attributes: ['id', 'banco', 'tipo_cuenta', 'numero_cuenta'],
    required: false
  },
  {
    model: Usuario,
    as: 'Usuario',
    attributes: ['id', 'nombre', 'apellido'],
    required: false
  }
];

// Función auxiliar para construir las condiciones de búsqueda para Egresos
const buildWhereConditionsEgresos = (queryParams) => {
  const {
    search = '',
    estado,
    desde,
    hasta,
    proyecto_id,
    tipo_documento,
    categoria,
    subcategoria,
    conciliado,
    cuenta_bancaria_id,
    proveedor_rut
  } = queryParams;

  const whereConditions = {};

  if (search) {
    whereConditions[Op.or] = [
      { descripcion: { [Op.iLike]: `%${search}%` } },
      { numero_documento: { [Op.iLike]: `%${search}%` } },
      { proveedor_nombre: { [Op.iLike]: `%${search}%` } },
      { proveedor_rut: { [Op.iLike]: `%${search}%` } },
      { observaciones: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (estado) whereConditions.estado = estado;
  if (desde && hasta) {
    whereConditions.fecha = { [Op.between]: [new Date(desde), new Date(hasta)] };
  } else if (desde) {
    whereConditions.fecha = { [Op.gte]: new Date(desde) };
  } else if (hasta) {
    whereConditions.fecha = { [Op.lte]: new Date(hasta) };
  }
  if (proyecto_id) whereConditions.proyecto_id = proyecto_id;
  if (tipo_documento) whereConditions.tipo_documento = tipo_documento;
  if (categoria) whereConditions.categoria = categoria;
  if (subcategoria) whereConditions.subcategoria = subcategoria;
  if (conciliado !== undefined) whereConditions.conciliado = String(conciliado).toLowerCase() === 'true';
  if (cuenta_bancaria_id) whereConditions.cuenta_bancaria_id = cuenta_bancaria_id;
  if (proveedor_rut) whereConditions.proveedor_rut = proveedor_rut;

  return whereConditions;
};

// Definiciones de includes para findOne en Egresos
const includesForEgresosFindOne = [
  {
    model: Proyecto,
    as: 'Proyecto',
    attributes: ['id', 'nombre'],
    required: false
  },
  {
    model: CuentaBancaria,
    as: 'CuentaBancariaEgreso',
    attributes: ['id', 'banco', 'tipo_cuenta', 'numero_cuenta'], // Podría ser más detallado si es necesario
    required: false
  },
  {
    model: Usuario,
    as: 'Usuario',
    attributes: ['id', 'nombre', 'apellido', 'email'], // Email podría ser útil para findOne
    required: false
  }
];

// Definiciones de includes para el egreso devuelto tras crear/actualizar
const includesForEgresoDetails = [
  {
    model: Proyecto,
    as: 'Proyecto',
    attributes: ['id', 'nombre'],
    required: false
  },
  {
    model: CuentaBancaria,
    as: 'CuentaBancariaEgreso',
    attributes: ['id', 'banco', 'tipo_cuenta', 'numero_cuenta'],
    required: false
  }
  // Podríamos añadir Usuario aquí si quisiéramos devolverlo siempre
];

class EgresoService {
  static async getAllEgresos(queryParams) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'fecha',
        sortOrder = 'DESC'
      } = queryParams;

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const whereConditions = buildWhereConditionsEgresos(queryParams);

      const { count, rows: egresos } = await Egreso.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit, 10),
        offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: includesForEgresosFindAll
      });

      return {
        total: count,
        totalPages: Math.ceil(count / parseInt(limit, 10)),
        currentPage: parseInt(page, 10),
        egresos
      };
    } catch (error) {
      console.error('Error en EgresoService.getAllEgresos:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al obtener egresos.' };
    }
  }

  static async getEgresoById(idEgreso) {
    try {
      const egreso = await Egreso.findByPk(idEgreso, {
        include: includesForEgresosFindOne
      });

      if (!egreso) {
        throw new EntityNotFoundError('Egreso', idEgreso);
      }
      return egreso;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw error;
      }
      console.error(`Error en EgresoService.getEgresoById para ID ${idEgreso}:`, error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al obtener el egreso.' };
    }
  }

  static async crearEgreso(datosEgreso, usuarioSolicitanteId) {
    const t = await sequelize.transaction();
    try {
      const {
        descripcion,
        monto,
        monto_neto,
        iva,
        retencion_impuesto,
        fecha,
        proyecto_id,
        proveedor_nombre,
        proveedor_rut,
        tipo_documento,
        numero_documento,
        fecha_documento,
        categoria,
        subcategoria,
        estado,
        fecha_pago,
        cuenta_bancaria_id,
        metodo_pago,
        observaciones,
        usuario_id, // ID del usuario que registra (puede venir del body)
        conciliado,
        archivo_respaldo
      } = datosEgreso;

      if (!descripcion || monto === undefined || monto === null) {
        throw { name: 'ValidationError', statusCode: 400, message: 'La descripción y el monto son obligatorios.' };
      }

      await validarExistenciaEntidad(Proyecto, proyecto_id, 'Proyecto', t);
      await validarExistenciaEntidad(CuentaBancaria, cuenta_bancaria_id, 'Cuenta Bancaria', t);
      
      const idUsuarioFinal = usuario_id || usuarioSolicitanteId;
      if (idUsuarioFinal) {
          await validarExistenciaEntidad(Usuario, idUsuarioFinal, 'Usuario', t);
      } else {
          // Considerar si un egreso siempre debe tener un usuario asociado.
          // Si req.usuario.id no está disponible y usuario_id no viene en el body, esto podría ser un problema.
          // Por ahora, se asume que uno de los dos estará presente si es mandatorio.
      }

      let calculoIva = iva;
      let calculoMontoNeto = monto_neto;
      let calculoRetencion = retencion_impuesto || 0;

      if (tipo_documento === 'factura' && monto && (monto_neto === undefined || iva === undefined)) {
        calculoMontoNeto = parseFloat((parseFloat(monto) / 1.19).toFixed(2));
        calculoIva = parseFloat((parseFloat(monto) - calculoMontoNeto).toFixed(2));
      }

      const nuevoEgreso = await Egreso.create({
        descripcion,
        monto: parseFloat(monto),
        monto_neto: calculoMontoNeto,
        iva: calculoIva,
        retencion_impuesto: calculoRetencion,
        fecha: fecha || new Date(),
        proyecto_id,
        proveedor_nombre,
        proveedor_rut,
        tipo_documento,
        numero_documento,
        fecha_documento,
        categoria,
        subcategoria,
        estado: estado || 'pendiente',
        fecha_pago: (estado || 'pendiente') === 'pagado' ? (fecha_pago || new Date()) : null,
        cuenta_bancaria_id,
        metodo_pago,
        observaciones,
        usuario_id: idUsuarioFinal,
        conciliado: conciliado || false,
        fecha_conciliacion: (conciliado || false) ? new Date() : null,
        archivo_respaldo
      }, { transaction: t });

      await t.commit();

      return Egreso.findByPk(nuevoEgreso.id, { include: includesForEgresoDetails });

    } catch (error) {
      await t.rollback();
      if (error.name === 'ValidationError' || error instanceof EntityNotFoundError) {
        throw error;
      }
      console.error('Error en EgresoService.crearEgreso:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al crear el egreso.' };
    }
  }

  static async actualizarEgreso(idEgreso, datosActualizacion, usuarioSolicitanteId) {
    const t = await sequelize.transaction();
    try {
      const egreso = await Egreso.findByPk(idEgreso, { transaction: t });
      if (!egreso) {
        throw new EntityNotFoundError('Egreso', idEgreso);
      }

      const {
        descripcion,
        monto,
        monto_neto,
        iva,
        retencion_impuesto,
        fecha,
        proyecto_id,
        proveedor_nombre,
        proveedor_rut,
        tipo_documento,
        numero_documento,
        fecha_documento,
        categoria,
        subcategoria,
        estado,
        fecha_pago,
        cuenta_bancaria_id,
        metodo_pago,
        observaciones,
        usuario_id, // ID del usuario (puede venir del body)
        conciliado,
        archivo_respaldo
      } = datosActualizacion;

      // Validar relaciones si se modifican
      if (proyecto_id !== undefined && proyecto_id !== egreso.proyecto_id) {
        await validarExistenciaEntidad(Proyecto, proyecto_id, 'Proyecto', t);
      }
      if (cuenta_bancaria_id !== undefined && cuenta_bancaria_id !== egreso.cuenta_bancaria_id) {
        await validarExistenciaEntidad(CuentaBancaria, cuenta_bancaria_id, 'Cuenta Bancaria', t);
      }
      // Validar usuario si se cambia explícitamente
      if (usuario_id !== undefined && usuario_id !== egreso.usuario_id) {
          await validarExistenciaEntidad(Usuario, usuario_id, 'Usuario', t);
      }

      // Preparar datos para la actualización, similar al controlador original pero más limpio
      const updateData = {};
      
      // Asignar campos si se proporcionan en datosActualizacion
      Object.keys(datosActualizacion).forEach(key => {
        if (datosActualizacion[key] !== undefined) {
          updateData[key] = datosActualizacion[key];
        }
      });

      // Recalcular IVA y monto neto si es necesario
      let montoActual = monto !== undefined ? parseFloat(monto) : egreso.monto;
      let tipoDocumentoActual = tipo_documento !== undefined ? tipo_documento : egreso.tipo_documento;
      
      if (tipoDocumentoActual === 'factura' && 
          (monto !== undefined || tipo_documento !== undefined) && // Si cambia monto o tipo de doc
          (monto_neto === undefined && iva === undefined)) { // Y no se proveen neto/iva
        updateData.monto_neto = parseFloat((montoActual / 1.19).toFixed(2));
        updateData.iva = parseFloat((montoActual - updateData.monto_neto).toFixed(2));
      } else {
        if (monto_neto !== undefined) updateData.monto_neto = monto_neto;
        if (iva !== undefined) updateData.iva = iva;
      }
      if (monto !== undefined) updateData.monto = montoActual; // Asegurar que el monto se actualice
      if (retencion_impuesto !== undefined) updateData.retencion_impuesto = retencion_impuesto;

      // Lógica de fechas de pago y conciliación
      const estaPagando = updateData.estado === 'pagado' && egreso.estado !== 'pagado';
      if (estaPagando) {
        updateData.fecha_pago = fecha_pago || new Date();
      } else if (updateData.estado === 'pendiente') {
        updateData.fecha_pago = null; // Limpiar fecha si vuelve a pendiente
      } else if (fecha_pago !== undefined) { // Si se provee fecha_pago explícitamente
        updateData.fecha_pago = fecha_pago;
      }

      if (conciliado === true && !egreso.conciliado) {
        updateData.conciliado = true;
        updateData.fecha_conciliacion = new Date();
      } else if (conciliado === false && egreso.conciliado) {
        updateData.conciliado = false;
        updateData.fecha_conciliacion = null;
      }
      
      // Asegurar que el usuario_id se actualice si no vino en datosActualizacion pero sí en el token
      // Esta lógica puede variar: ¿el usuario_id se actualiza solo si viene en el body o también por el token?
      // El controlador original usaba: usuario_id: usuario_id (del body) || egreso.usuario_id.
      // Si queremos que el usuarioSolicitanteId (del token) pueda actualizarlo si no viene en el body, se añadiría aquí.
      // Por ahora, se mantiene la lógica original donde usuario_id en el body tiene precedencia.
      if (usuario_id === undefined && egreso.usuario_id === null && usuarioSolicitanteId) {
        // updateData.usuario_id = usuarioSolicitanteId; // Opcional: si se quiere asignar el usuario del token si no hay uno
      }

      await egreso.update(updateData, { transaction: t });
      await t.commit();

      return Egreso.findByPk(idEgreso, { include: includesForEgresoDetails });

    } catch (error) {
      await t.rollback();
      if (error.name === 'ValidationError' || error instanceof EntityNotFoundError) {
        throw error;
      }
      console.error('Error en EgresoService.actualizarEgreso:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al actualizar el egreso.' };
    }
  }

  static async anularEgreso(idEgreso, motivoAnulacion) {
    const t = await sequelize.transaction();
    try {
      const egreso = await Egreso.findByPk(idEgreso, { transaction: t });
      if (!egreso) {
        throw new EntityNotFoundError('Egreso', idEgreso);
      }

      if (egreso.estado === 'anulado') {
        throw { name: 'BusinessRuleError', statusCode: 400, message: 'Este egreso ya está anulado.' };
      }

      // A diferencia de ingresos, la anulación de egresos no parece afectar otras entidades (como facturas) en el código original.
      // Si hubiera lógica adicional (ej. revertir stock, etc.), iría aquí.

      const observacionesAnulacion = motivoAnulacion
        ? `${egreso.observaciones ? egreso.observaciones + ' - ' : ''}Anulado: ${motivoAnulacion}`
        : `${egreso.observaciones ? egreso.observaciones + ' - ' : ''}Anulado el ${new Date().toISOString()}`;

      await egreso.update({
        estado: 'anulado',
        observaciones: observacionesAnulacion,
        // Considerar si se deben limpiar fecha_pago, fecha_conciliacion, etc.
        // fecha_pago: null,
        // fecha_conciliacion: null,
        // conciliado: false
      }, { transaction: t });

      await t.commit();
      return { id: idEgreso, message: 'Egreso anulado exitosamente.' };

    } catch (error) {
      await t.rollback();
      if (error instanceof EntityNotFoundError || error.name === 'BusinessRuleError') {
        throw error;
      }
      console.error('Error en EgresoService.anularEgreso:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al anular el egreso.' };
    }
  }

  static async pagarEgreso(idEgreso, datosPago) {
    const t = await sequelize.transaction();
    try {
      const egreso = await Egreso.findByPk(idEgreso, { transaction: t });
      if (!egreso) {
        throw new EntityNotFoundError('Egreso', idEgreso);
      }

      if (egreso.estado !== 'pendiente') {
        throw { name: 'BusinessRuleError', statusCode: 400, message: `No se puede pagar un egreso en estado "${egreso.estado}".` };
      }

      const { fecha_pago, cuenta_bancaria_id, metodo_pago } = datosPago;

      if (cuenta_bancaria_id) { // Validar solo si se proporciona explícitamente
        await validarExistenciaEntidad(CuentaBancaria, cuenta_bancaria_id, 'Cuenta Bancaria', t);
      }

      const updateData = {
        estado: 'pagado',
        fecha_pago: fecha_pago || new Date(),
      };
      // Solo actualizar si se proporcionan en datosPago, para no blanquear campos existentes si no vienen.
      if (cuenta_bancaria_id !== undefined) updateData.cuenta_bancaria_id = cuenta_bancaria_id;
      if (metodo_pago !== undefined) updateData.metodo_pago = metodo_pago;

      await egreso.update(updateData, { transaction: t });
      await t.commit();

      return Egreso.findByPk(idEgreso, { include: includesForEgresoDetails }); // Reutilizar includes de creación/actualización

    } catch (error) {
      await t.rollback();
      if (error instanceof EntityNotFoundError || error.name === 'BusinessRuleError') {
        throw error;
      }
      console.error('Error en EgresoService.pagarEgreso:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al pagar el egreso.' };
    }
  }

  static async conciliarEgreso(idEgreso) {
    const t = await sequelize.transaction();
    try {
      const egreso = await Egreso.findByPk(idEgreso, { transaction: t });
      if (!egreso) {
        throw new EntityNotFoundError('Egreso', idEgreso);
      }

      if (egreso.estado !== 'pagado') {
        throw { name: 'BusinessRuleError', statusCode: 400, message: 'Solo se pueden conciliar egresos pagados.' };
      }

      if (egreso.conciliado) {
        throw { name: 'BusinessRuleError', statusCode: 400, message: 'Este egreso ya está conciliado.' };
      }

      const fechaConciliacion = new Date();
      await egreso.update({
        conciliado: true,
        fecha_conciliacion: fechaConciliacion
      }, { transaction: t });

      await t.commit();

      return {
        id: idEgreso,
        conciliado: true,
        fecha_conciliacion: fechaConciliacion,
        message: 'Egreso conciliado exitosamente.'
      };

    } catch (error) {
      await t.rollback();
      if (error instanceof EntityNotFoundError || error.name === 'BusinessRuleError') {
        throw error;
      }
      console.error('Error en EgresoService.conciliarEgreso:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al conciliar el egreso.' };
    }
  }

  static async getEstadisticasEgresos(queryParams) {
    try {
      const { desde, hasta } = queryParams;
      const fechaDesde = desde ? new Date(desde) : new Date(new Date().getFullYear(), 0, 1);
      const fechaHasta = hasta ? new Date(hasta) : new Date();

      const estadisticasPorEstado = await Egreso.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        where: { fecha: { [Op.between]: [fechaDesde, fechaHasta] } },
        group: ['estado']
      });

      const egresosPorMes = await Egreso.findAll({
        attributes: [
          [sequelize.fn('date_trunc', 'month', sequelize.col('fecha')), 'mes'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        where: {
          fecha: { [Op.between]: [fechaDesde, fechaHasta] },
          estado: { [Op.ne]: 'anulado' }
        },
        group: [sequelize.fn('date_trunc', 'month', sequelize.col('fecha'))],
        order: [[sequelize.fn('date_trunc', 'month', sequelize.col('fecha')), 'ASC']]
      });

      const egresosPorTipo = await Egreso.findAll({
        attributes: [
          'tipo_documento',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        where: {
          fecha: { [Op.between]: [fechaDesde, fechaHasta] },
          estado: { [Op.ne]: 'anulado' }
        },
        group: ['tipo_documento']
      });

      const egresosPorCategoria = await Egreso.findAll({
        attributes: [
          'categoria',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        where: {
          fecha: { [Op.between]: [fechaDesde, fechaHasta] },
          estado: { [Op.ne]: 'anulado' },
          categoria: { [Op.ne]: null }
        },
        group: ['categoria']
      });

      const topProveedores = await Egreso.findAll({
        attributes: [
          'proveedor_nombre',
          'proveedor_rut',
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad_egresos']
        ],
        where: {
          fecha: { [Op.between]: [fechaDesde, fechaHasta] },
          estado: { [Op.ne]: 'anulado' },
          proveedor_nombre: { [Op.ne]: null }
        },
        group: ['proveedor_nombre', 'proveedor_rut'],
        order: [[sequelize.fn('SUM', sequelize.col('monto')), 'DESC']],
        limit: 10
      });

      const egresosPendientesRaw = await Egreso.findAll({
        where: {
          estado: 'pendiente',
          fecha_documento: { [Op.lt]: new Date() } // Documentos con fecha anterior a hoy
        },
        order: [['fecha_documento', 'ASC']],
        // limit: 100 // El limit original puede ser parametrizable o revisado
      });
      
      const egresosPendientes = {
          total: egresosPendientesRaw.length,
          monto_total: egresosPendientesRaw.reduce((acc, curr) => acc + parseFloat(curr.monto), 0),
          egresos: egresosPendientesRaw
      };

      return {
        estadisticasPorEstado,
        egresosPorMes,
        egresosPorTipo,
        egresosPorCategoria,
        topProveedores,
        egresosPendientes
      };

    } catch (error) {
      console.error('Error en EgresoService.getEstadisticasEgresos:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al obtener estadísticas de egresos.' };
    }
  }
}

module.exports = EgresoService; 