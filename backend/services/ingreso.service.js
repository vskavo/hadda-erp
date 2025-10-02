const { Ingreso, Cliente, Proyecto, Factura, CuentaBancaria, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');
const { EntityNotFoundError, validarExistenciaEntidad } = require('../utils/dbUtils'); // Importar desde dbUtils

// Definiciones de inclusiones para obtener el ingreso completo después de la creación/actualización
// Estas son específicas de cómo queremos que se vea el ingreso devuelto.
const includesForCreateUpdate = [
  {
    model: Cliente,
    as: 'Cliente',
    attributes: ['id', 'razon_social', 'rut'],
    required: false
  },
  {
    model: Proyecto,
    as: 'Proyecto',
    attributes: ['id', 'nombre'],
    required: false
  },
  {
    model: Factura,
    as: 'Factura',
    attributes: ['id', 'numero_factura', 'fecha_emision'], // Generalmente FacturaGeneral
    required: false
  },
  {
    model: CuentaBancaria,
    as: 'CuentaBancaria',
    attributes: ['id', 'banco', 'tipo_cuenta', 'numero_cuenta'], // Generalmente CuentaBancariaDetalle
    required: false
  }
  // Usuario no se incluía originalmente aquí al obtener el ingreso completo post-creación/actualización.
  // Si se necesita, se puede agregar aquí.
];

// Es buena idea tener las definiciones de include cerca de donde se usan o en una sección dedicada si son muchas.
// Para findOne, podríamos querer un conjunto diferente de atributos o relaciones.
const includesForFindOne = [
  {
    model: Cliente,
    as: 'Cliente',
    attributes: ['id', 'razon_social', 'rut'],
    required: false
  },
  {
    model: Proyecto,
    as: 'Proyecto',
    attributes: ['id', 'nombre'],
    required: false
  },
  {
    model: Factura,
    as: 'Factura',
    // Podríamos querer más detalles para findOne, por ejemplo, monto_total
    attributes: ['id', 'numero_factura', 'fecha_emision', 'monto_total'],
    required: false
  },
  {
    model: CuentaBancaria,
    as: 'CuentaBancaria',
    attributes: ['id', 'banco', 'tipo_cuenta', 'numero_cuenta'], 
    required: false
  },
  {
    model: Usuario,
    as: 'Usuario',
    attributes: ['id', 'nombre', 'apellido', 'email'],
    required: false
  }
];

// Definiciones de includes para findAll (ahora en el servicio)
const includeClienteComun = {
  model: Cliente,
  as: 'Cliente',
  attributes: ['id', 'razon_social', 'rut'],
  required: false
};

const includeProyectoComun = {
  model: Proyecto,
  as: 'Proyecto',
  attributes: ['id', 'nombre'],
  required: false
};

const includeFacturaGeneral = { 
  model: Factura,
  as: 'Factura',
  attributes: ['id', 'numero_factura', 'fecha_emision'],
  required: false
};

const includeCuentaBancariaFindAll = {
  model: CuentaBancaria,
  as: 'CuentaBancaria',
  attributes: ['id', 'banco', 'tipo_cuenta', 'numero_cuenta'],
  required: false
};
const includeUsuarioFindAll = {
  model: Usuario,
  as: 'Usuario',
  attributes: ['id', 'nombre', 'apellido'],
  required: false
};

const includesForFindAll = [
  includeClienteComun,
  includeProyectoComun,
  includeFacturaGeneral,
  includeCuentaBancariaFindAll,
  includeUsuarioFindAll
];

// Función auxiliar para construir las condiciones de búsqueda para ingresos (ahora en el servicio)
const buildWhereConditionsIngresos = (queryParams) => {
  const {
    search = '',
    estado,
    desde,
    hasta,
    cliente_id,
    proyecto_id,
    tipo_ingreso,
    categoria,
    conciliado,
    cuenta_bancaria_id
  } = queryParams;

  const whereConditions = {};

  if (search) {
    whereConditions[Op.or] = [
      { descripcion: { [Op.iLike]: `%${search}%` } },
      { numero_documento: { [Op.iLike]: `%${search}%` } },
      { observaciones: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  if (estado) {
    whereConditions.estado = estado;
  }
  
  if (desde && hasta) {
    whereConditions.fecha = {
      [Op.between]: [new Date(desde), new Date(hasta)]
    };
  } else if (desde) {
    whereConditions.fecha = {
      [Op.gte]: new Date(desde)
    };
  } else if (hasta) {
    whereConditions.fecha = {
      [Op.lte]: new Date(hasta)
    };
  }
  
  if (cliente_id) {
    whereConditions.cliente_id = cliente_id;
  }
  
  if (proyecto_id) {
    whereConditions.proyecto_id = proyecto_id;
  }
  
  if (tipo_ingreso) {
    whereConditions.tipo_ingreso = tipo_ingreso;
  }
  
  if (categoria) {
    whereConditions.categoria = categoria;
  }
  
  if (conciliado !== undefined) {
    // Asegurarse que el string 'true'/'false' se convierte a booleano
    whereConditions.conciliado = String(conciliado).toLowerCase() === 'true';
  }
  
  if (cuenta_bancaria_id) {
    whereConditions.cuenta_bancaria_id = cuenta_bancaria_id;
  }

  return whereConditions;
};

class IngresoService {
  static async crearIngreso(datosIngreso, usuarioSolicitanteId = null) {
    const t = await sequelize.transaction();
    try {
      const {
        descripcion,
        monto,
        fecha,
        proyecto_id,
        factura_id,
        cliente_id,
        tipo_ingreso,
        categoria,
        estado, // estado por defecto 'pendiente' se maneja abajo
        cuenta_bancaria_id,
        numero_documento,
        fecha_documento,
        observaciones,
        usuario_id, // ID de usuario que registra, puede venir en el body
        conciliado, // por defecto false
        archivo_respaldo
      } = datosIngreso;

      // 1. Validaciones específicas de lógica de negocio
      if (tipo_ingreso === 'factura' && !factura_id) {
        // Es mejor lanzar un error específico que el controlador pueda interpretar
        throw { name: 'BusinessRuleError', statusCode: 400, message: 'El ID de factura es requerido para ingresos de tipo factura.' };
      }

      // 2. Validar existencia de entidades relacionadas
      // La función validarExistenciaEntidad ahora puede tomar la transacción
      await validarExistenciaEntidad(Proyecto, proyecto_id, 'Proyecto', t);
      await validarExistenciaEntidad(Cliente, cliente_id, 'Cliente', t);
      if (factura_id) { // Solo validar factura si se provee factura_id
          await validarExistenciaEntidad(Factura, factura_id, 'Factura', t);
      }
      await validarExistenciaEntidad(CuentaBancaria, cuenta_bancaria_id, 'Cuenta Bancaria', t);

      // Determinar el ID de usuario final a registrar
      // Prioridad: usuario_id del body, luego el usuario de la sesión/token (usuarioSolicitanteId)
      const idUsuarioFinal = usuario_id || usuarioSolicitanteId;
      if (idUsuarioFinal) {
        await validarExistenciaEntidad(Usuario, idUsuarioFinal, 'Usuario', t);
      }

      // 3. Crear el ingreso
      const nuevoIngreso = await Ingreso.create({
        descripcion,
        monto,
        fecha: fecha || new Date(),
        proyecto_id,
        factura_id,
        cliente_id,
        tipo_ingreso,
        categoria,
        estado: estado || 'pendiente', // Estado por defecto si no se provee
        fecha_confirmacion: (estado || 'pendiente') === 'confirmado' ? new Date() : null,
        cuenta_bancaria_id,
        numero_documento,
        fecha_documento,
        observaciones,
        usuario_id: idUsuarioFinal,
        conciliado: conciliado || false,
        fecha_conciliacion: (conciliado || false) ? new Date() : null,
        archivo_respaldo
      }, { transaction: t });

      // 4. Lógica de negocio post-creación: Si el ingreso está asociado a una factura y su estado es 'confirmado', actualizar la factura
      // Esto considera el estado final del ingreso, ya sea provisto o por defecto.
      if (factura_id && nuevoIngreso.estado === 'confirmado') {
        const factura = await Factura.findByPk(factura_id, { transaction: t }); // Usar la transacción
        if (factura && factura.estado !== 'pagada') {
          await factura.update({
            estado: 'pagada',
            fecha_pago: new Date() // O usar nuevoIngreso.fecha_confirmacion
          }, { transaction: t });
        }
      }

      await t.commit();

      // 5. Devolver el ingreso creado con sus relaciones según 'includesForCreateUpdate'
      // findByPk fuera de la transacción original si ya se hizo commit.
      const ingresoCompleto = await Ingreso.findByPk(nuevoIngreso.id, {
        include: includesForCreateUpdate // Usar los includes definidos
      });
      return ingresoCompleto;

    } catch (error) {
      await t.rollback();
      // Re-lanzar el error para que el controlador lo maneje o lo transforme
      // Si es EntityNotFoundError o BusinessRuleError, ya tienen statusCode
      if (error instanceof EntityNotFoundError || error.name === 'BusinessRuleError') {
          throw error;
      }
      // Para otros errores, podría ser bueno loggearlos aquí también.
      console.error('Error en IngresoService.crearIngreso:', error);
      // Lanzar un error genérico o el original
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al crear el ingreso.' };
    }
  }

  static async actualizarIngreso(idIngreso, datosActualizacion, usuarioSolicitanteId = null) {
    const t = await sequelize.transaction();
    try {
      const ingreso = await Ingreso.findByPk(idIngreso, { transaction: t });
      if (!ingreso) {
        throw new EntityNotFoundError('Ingreso', idIngreso);
      }

      const {
        descripcion,
        monto,
        fecha,
        proyecto_id,
        factura_id,
        cliente_id,
        tipo_ingreso,
        categoria,
        estado,
        cuenta_bancaria_id,
        numero_documento,
        fecha_documento,
        observaciones,
        usuario_id, // ID de usuario que registra, puede venir en el body
        conciliado,
        archivo_respaldo
      } = datosActualizacion;

      // Validaciones específicas de lógica de negocio para la actualización
      const tipoIngresoFinal = tipo_ingreso || ingreso.tipo_ingreso;
      const facturaIdFinal = factura_id !== undefined ? factura_id : ingreso.factura_id;
      if (tipoIngresoFinal === 'factura' && !facturaIdFinal) {
        throw { name: 'BusinessRuleError', statusCode: 400, message: 'El ID de factura es requerido para ingresos de tipo factura.' };
      }

      // Validar relaciones si se modifican y el nuevo ID no es nulo
      if (proyecto_id !== undefined && proyecto_id !== ingreso.proyecto_id) {
        await validarExistenciaEntidad(Proyecto, proyecto_id, 'Proyecto', t);
      }
      if (cliente_id !== undefined && cliente_id !== ingreso.cliente_id) {
        await validarExistenciaEntidad(Cliente, cliente_id, 'Cliente', t);
      }
      if (factura_id !== undefined && factura_id !== ingreso.factura_id && factura_id !== null) {
        await validarExistenciaEntidad(Factura, factura_id, 'Factura', t);
      }
      if (cuenta_bancaria_id !== undefined && cuenta_bancaria_id !== ingreso.cuenta_bancaria_id && cuenta_bancaria_id !== null) {
        await validarExistenciaEntidad(CuentaBancaria, cuenta_bancaria_id, 'Cuenta Bancaria', t);
      }
      
      // Determinar el ID de usuario final a registrar
      const idUsuarioActualizador = usuario_id || usuarioSolicitanteId; // Podría ser el usuario que realiza la acción
      // Si en tu lógica de negocio 'usuario_id' es un campo que se puede actualizar explícitamente en el ingreso:
      const idUsuarioCampoIngreso = usuario_id !== undefined ? usuario_id : ingreso.usuario_id;
      if (idUsuarioCampoIngreso && idUsuarioCampoIngreso !== ingreso.usuario_id) { // Validar solo si cambia y no es nulo
          await validarExistenciaEntidad(Usuario, idUsuarioCampoIngreso, 'Usuario', t);
      }

      // Preparar datos para la actualización
      const datosParaActualizar = {};
      if (descripcion !== undefined) datosParaActualizar.descripcion = descripcion;
      if (monto !== undefined) datosParaActualizar.monto = monto;
      if (fecha !== undefined) datosParaActualizar.fecha = fecha;
      if (proyecto_id !== undefined) datosParaActualizar.proyecto_id = proyecto_id;
      if (factura_id !== undefined) datosParaActualizar.factura_id = factura_id;
      if (cliente_id !== undefined) datosParaActualizar.cliente_id = cliente_id;
      if (tipo_ingreso !== undefined) datosParaActualizar.tipo_ingreso = tipo_ingreso;
      if (categoria !== undefined) datosParaActualizar.categoria = categoria;
      if (estado !== undefined) datosParaActualizar.estado = estado;
      if (cuenta_bancaria_id !== undefined) datosParaActualizar.cuenta_bancaria_id = cuenta_bancaria_id;
      if (numero_documento !== undefined) datosParaActualizar.numero_documento = numero_documento;
      if (fecha_documento !== undefined) datosParaActualizar.fecha_documento = fecha_documento;
      if (observaciones !== undefined) datosParaActualizar.observaciones = observaciones;
      if (archivo_respaldo !== undefined) datosParaActualizar.archivo_respaldo = archivo_respaldo;
      // Actualizar usuario_id si se proveyó explícitamente
      if (usuario_id !== undefined) datosParaActualizar.usuario_id = usuario_id; 

      // Lógica para fechas de confirmación y conciliación
      const estaConfirmando = estado === 'confirmado' && ingreso.estado !== 'confirmado';
      if (estaConfirmando) {
        datosParaActualizar.fecha_confirmacion = new Date();
      } else if (estado !== undefined && estado !== 'confirmado' && ingreso.estado === 'confirmado') {
        // Si se cambia de 'confirmado' a otro estado, opcionalmente limpiar fecha_confirmacion
        // datosParaActualizar.fecha_confirmacion = null; // Descomentar si es la lógica deseada
      }

      if (conciliado === true && !ingreso.conciliado) {
        datosParaActualizar.conciliado = true;
        datosParaActualizar.fecha_conciliacion = new Date();
      } else if (conciliado === false && ingreso.conciliado) {
        datosParaActualizar.conciliado = false;
        datosParaActualizar.fecha_conciliacion = null;
      }
      
      await ingreso.update(datosParaActualizar, { transaction: t });

      // Lógica de negocio post-actualización: Si el ingreso se confirma y está asociado a una factura
      if (estaConfirmando && (ingreso.factura_id || datosParaActualizar.factura_id)) {
        const idFacturaAfectada = datosParaActualizar.factura_id !== undefined ? datosParaActualizar.factura_id : ingreso.factura_id;
        if (idFacturaAfectada) { // Asegurarse que hay una factura asociada
            const factura = await Factura.findByPk(idFacturaAfectada, { transaction: t });
            if (factura && factura.estado !== 'pagada') {
            await factura.update({ estado: 'pagada', fecha_pago: datosParaActualizar.fecha_confirmacion || new Date() }, { transaction: t });
            }
        }
      }
      // Considerar lógica si una factura pagada se des-confirma (estado del ingreso cambia de confirmado a otro)
      // Esto no estaba en el código original pero podría ser necesario.

      await t.commit();

      const ingresoActualizado = await Ingreso.findByPk(idIngreso, {
        include: includesForCreateUpdate // Usar la misma estructura que para crear, o definir una específica
      });
      return ingresoActualizado;

    } catch (error) {
      await t.rollback();
      if (error instanceof EntityNotFoundError || error.name === 'BusinessRuleError') {
        throw error;
      }
      console.error('Error en IngresoService.actualizarIngreso:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al actualizar el ingreso.' };
    }
  }

  static async anularIngreso(idIngreso, motivoAnulacion) {
    const t = await sequelize.transaction();
    try {
      const ingreso = await Ingreso.findByPk(idIngreso, { transaction: t });
      if (!ingreso) {
        throw new EntityNotFoundError('Ingreso', idIngreso);
      }

      if (ingreso.estado === 'anulado') {
        throw { name: 'BusinessRuleError', statusCode: 400, message: 'Este ingreso ya está anulado.' };
      }

      // Si el ingreso estaba confirmado y asociado a una factura, lógica para la factura
      if (ingreso.estado === 'confirmado' && ingreso.factura_id) {
        const factura = await Factura.findByPk(ingreso.factura_id, { transaction: t });
        if (factura && factura.estado === 'pagada') {
          // Contar otros ingresos confirmados para esta factura (excluyendo el actual)
          const otrosIngresosConfirmados = await Ingreso.count({
            where: {
              factura_id: ingreso.factura_id,
              estado: 'confirmado',
              id: { [Op.ne]: idIngreso } // Op.ne necesita ser importado de sequelize
            },
            transaction: t
          });

          if (otrosIngresosConfirmados === 0) {
            // Si no hay otros ingresos confirmados, la factura vuelve a 'emitida' (o el estado anterior apropiado)
            await factura.update({
              estado: 'emitida', // O el estado previo que corresponda
              fecha_pago: null
            }, { transaction: t });
          }
        }
      }

      // Actualizar el ingreso a anulado
      const observacionesAnulacion = motivoAnulacion
        ? `${ingreso.observaciones ? ingreso.observaciones + ' - ' : ''}Anulado: ${motivoAnulacion}`
        : `${ingreso.observaciones ? ingreso.observaciones + ' - ' : ''}Anulado el ${new Date().toISOString()}`;
      
      await ingreso.update({
        estado: 'anulado',
        observaciones: observacionesAnulacion
        // Considerar limpiar fecha_confirmacion, fecha_conciliacion si aplica a la lógica de negocio.
        // fecha_confirmacion: null,
        // fecha_conciliacion: null,
        // conciliado: false,
      }, { transaction: t });

      await t.commit();
      return { id: idIngreso, message: 'Ingreso anulado exitosamente.' }; // Devolver un objeto simple o el ingreso actualizado

    } catch (error) {
      await t.rollback();
      if (error instanceof EntityNotFoundError || error.name === 'BusinessRuleError') {
        throw error;
      }
      console.error('Error en IngresoService.anularIngreso:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al anular el ingreso.' };
    }
  }

  static async confirmarIngreso(idIngreso, datosConfirmacion) {
    const t = await sequelize.transaction();
    try {
      const ingreso = await Ingreso.findByPk(idIngreso, { transaction: t });
      if (!ingreso) {
        throw new EntityNotFoundError('Ingreso', idIngreso);
      }

      if (ingreso.estado !== 'pendiente') {
        throw { name: 'BusinessRuleError', statusCode: 400, message: `No se puede confirmar un ingreso en estado "${ingreso.estado}".` };
      }

      const { fecha_confirmacion, cuenta_bancaria_id } = datosConfirmacion;

      if (cuenta_bancaria_id) {
        await validarExistenciaEntidad(CuentaBancaria, cuenta_bancaria_id, 'Cuenta Bancaria', t);
      }

      const datosParaActualizar = {
        estado: 'confirmado',
        fecha_confirmacion: fecha_confirmacion || new Date(),
      };
      if (cuenta_bancaria_id !== undefined) { // Solo actualizar si se proveyó explícitamente
        datosParaActualizar.cuenta_bancaria_id = cuenta_bancaria_id;
      }

      await ingreso.update(datosParaActualizar, { transaction: t });

      // Si el ingreso está asociado a una factura, actualizar la factura
      if (ingreso.factura_id) {
        const factura = await Factura.findByPk(ingreso.factura_id, { transaction: t });
        if (factura && factura.estado !== 'pagada') {
          await factura.update({
            estado: 'pagada',
            fecha_pago: datosParaActualizar.fecha_confirmacion // Usar la misma fecha de confirmación
          }, { transaction: t });
        }
      }

      await t.commit();

      // Devolver el ingreso actualizado con sus relaciones (usar includesForFindOne o uno específico para confirmación)
      const ingresoConfirmado = await Ingreso.findByPk(idIngreso, {
        include: includesForFindOne // O definir includesForConfirmar si es diferente
      });
      return ingresoConfirmado;

    } catch (error) {
      await t.rollback();
      if (error instanceof EntityNotFoundError || error.name === 'BusinessRuleError') {
        throw error;
      }
      console.error('Error en IngresoService.confirmarIngreso:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al confirmar el ingreso.' };
    }
  }

  static async conciliarIngreso(idIngreso) {
    const t = await sequelize.transaction();
    try {
      const ingreso = await Ingreso.findByPk(idIngreso, { transaction: t });
      if (!ingreso) {
        throw new EntityNotFoundError('Ingreso', idIngreso);
      }

      if (ingreso.estado !== 'confirmado') {
        throw { name: 'BusinessRuleError', statusCode: 400, message: 'Solo se pueden conciliar ingresos confirmados.' };
      }

      if (ingreso.conciliado) {
        throw { name: 'BusinessRuleError', statusCode: 400, message: 'Este ingreso ya está conciliado.' };
      }

      const fechaConciliacion = new Date();
      await ingreso.update({
        conciliado: true,
        fecha_conciliacion: fechaConciliacion
      }, { transaction: t });

      await t.commit();

      return { 
        id: idIngreso, 
        conciliado: true,
        fecha_conciliacion: fechaConciliacion, // Devolver la fecha de conciliación
        message: 'Ingreso conciliado exitosamente.' 
      };

    } catch (error) {
      await t.rollback();
      if (error instanceof EntityNotFoundError || error.name === 'BusinessRuleError') {
        throw error;
      }
      console.error('Error en IngresoService.conciliarIngreso:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al conciliar el ingreso.' };
    }
  }

  static async getIngresoById(idIngreso) {
    try {
      const ingreso = await Ingreso.findByPk(idIngreso, {
        include: includesForFindOne // Usar la definición de includes para findOne
      });

      if (!ingreso) {
        throw new EntityNotFoundError('Ingreso', idIngreso);
      }
      return ingreso;

    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw error;
      }
      console.error('Error en IngresoService.getIngresoById:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al obtener el ingreso.' };
    }
  }

  static async getAllIngresos(queryParams) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'fecha',
        sortOrder = 'DESC'
      } = queryParams;

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      
      const whereConditions = buildWhereConditionsIngresos(queryParams);
      
      const { count, rows: ingresos } = await Ingreso.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit, 10),
        offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: includesForFindAll
      });
      
      return {
        total: count,
        totalPages: Math.ceil(count / parseInt(limit, 10)),
        currentPage: parseInt(page, 10),
        ingresos
      };

    } catch (error) {
      console.error('Error en IngresoService.getAllIngresos:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al obtener los ingresos.' };
    }
  }

  static async getEstadisticasIngresos(queryParams) {
    try {
      const { desde, hasta } = queryParams;
      
      const fechaDesde = desde ? new Date(desde) : new Date(new Date().getFullYear(), 0, 1); // Default inicio del año actual
      const fechaHasta = hasta ? new Date(hasta) : new Date(); // Default hoy

      // Estadísticas por estado
      const estadisticasPorEstado = await Ingreso.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        where: {
          fecha: {
            [Op.between]: [fechaDesde, fechaHasta]
          }
        },
        group: ['estado']
      });
      
      // Total de ingresos por mes (excluyendo anulados)
      const ingresosPorMes = await Ingreso.findAll({
        attributes: [
          [sequelize.fn('date_trunc', 'month', sequelize.col('fecha')), 'mes'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        where: {
          fecha: {
            [Op.between]: [fechaDesde, fechaHasta]
          },
          estado: {
            [Op.ne]: 'anulado' // Excluir anulados de esta suma
          }
        },
        group: [sequelize.fn('date_trunc', 'month', sequelize.col('fecha'))],
        order: [[sequelize.fn('date_trunc', 'month', sequelize.col('fecha')), 'ASC']]
      });
      
      // Ingresos por tipo (excluyendo anulados)
      const ingresosPorTipo = await Ingreso.findAll({
        attributes: [
          'tipo_ingreso',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        where: {
          fecha: {
            [Op.between]: [fechaDesde, fechaHasta]
          },
          estado: {
            [Op.ne]: 'anulado'
          }
        },
        group: ['tipo_ingreso']
      });
      
      // Ingresos por categoría (excluyendo anulados y categorías nulas)
      const ingresosPorCategoria = await Ingreso.findAll({
        attributes: [
          'categoria',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        where: {
          fecha: {
            [Op.between]: [fechaDesde, fechaHasta]
          },
          estado: {
            [Op.ne]: 'anulado'
          },
          categoria: {
            [Op.ne]: null // Solo categorías no nulas
          }
        },
        group: ['categoria']
      });
      
      // Top clientes por ingresos (excluyendo anulados y clientes nulos)
      const topClientes = await Ingreso.findAll({
        attributes: [
          'cliente_id',
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad_ingresos']
        ],
        where: {
          fecha: {
            [Op.between]: [fechaDesde, fechaHasta]
          },
          estado: {
            [Op.ne]: 'anulado'
          },
          cliente_id: {
            [Op.ne]: null // Solo clientes no nulos
          }
        },
        include: [
          {
            model: Cliente,
            as: 'Cliente',
            attributes: ['razon_social', 'rut'] // No es necesario 'id' aquí ya que agrupamos por cliente_id
          }
        ],
        group: ['cliente_id', 'Cliente.id', 'Cliente.razon_social', 'Cliente.rut'], // Agrupar por todos los atributos del cliente para que funcione con PostgreSQL
        order: [[sequelize.fn('SUM', sequelize.col('monto')), 'DESC']],
        limit: 10
      });

      return {
        estadisticasPorEstado,
        ingresosPorMes,
        ingresosPorTipo,
        ingresosPorCategoria,
        topClientes
      };

    } catch (error) {
      console.error('Error en IngresoService.getEstadisticasIngresos:', error);
      throw { name: 'ServiceError', statusCode: 500, message: error.message || 'Error interno del servidor al obtener estadísticas de ingresos.' };
    }
  }
}

module.exports = IngresoService; 