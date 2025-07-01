/**
 * Controlador Base de Proyectos - Operaciones CRUD
 */
const { models, Op, verificarPermisosVisualizacion } = require('./proyecto.utils');
const { Proyecto, Cliente, Usuario, CostoProyecto, sequelize, Curso } = models;
const { sincronizarConSence } = require('../../utils/senceSync');
const emailService = require('../../services/email.service');

// Obtener todos los proyectos con paginación y filtros
exports.findAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      estado, 
      clienteId, 
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = req.query;
    const offset = (page - 1) * limit;
    
    // --- Lógica de Permisos --- 
    const userId = req.usuario.id;
    const puedeVerTodos = await verificarPermisosVisualizacion(req);
    
    // Construir condiciones de búsqueda
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    if (estado) {
      whereConditions.estado = estado;
    }

    if (clienteId) {
      whereConditions.cliente_id = clienteId;
    }

    // --- Aplicar filtro por responsable SI NO puede ver todos ---
    if (!puedeVerTodos) {
      whereConditions.responsable_id = userId;
    }
    
    // Ejecutar la consulta
    const { count, rows: proyectos } = await Proyecto.findAndCountAll({
      where: whereConditions,
      include: [
        { model: Cliente, attributes: ['id', 'razon_social'] },
        { 
          model: Usuario, 
          as: 'Responsable',
          attributes: ['id', 'nombre', 'apellido']
        } 
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      distinct: true // Necesario si el include genera duplicados
    });
    
    res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      proyectos
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ message: 'Error al obtener proyectos', error: error.message });
  }
};

// Obtener un proyecto por ID
exports.findOne = async (req, res) => {
  try {
    const proyecto = await Proyecto.findByPk(req.params.id, {
      attributes: { exclude: [] },
      include: [
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social', 'rut', 'giro', 'direccion', 'email', 'telefono']
        },
        {
          model: Usuario,
          as: 'Responsable',
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono']
        },
        {
          model: CostoProyecto,
          as: 'CostoProyectos',
          attributes: [
            'id', 
            'proyecto_id', 
            'concepto', 
            'tipo_costo', 
            'monto', 
            'fecha', 
            'estado', 
            'proveedor', 
            'aprobado', 
            'aprobado_por',
            'aplica_iva',
            'aplica_honorarios'
          ]
        },
        {
          model: Curso,
          as: 'Cursos',
          attributes: ['id', 'nombre', 'codigo_sence', 'duracion_horas', 'valor_total', 'nro_participantes', 'modalidad', 'estado_sence', 'tipo_de_contrato', 'estado_pre_contrato']
        }
      ]
    });
    
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    res.status(200).json(proyecto);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ message: 'Error al obtener proyecto', error: error.message });
  }
};

// Crear un proyecto nuevo
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  let committed = false;
  
  try {
    // Desestructurar los nuevos campos del body
    const { 
      nombre, 
      descripcion, 
      cliente_id, 
      fecha_inicio, 
      fecha_fin, 
      presupuesto, 
      costo_real,
      estado, 
      responsable_id,
      observaciones,
      prioridad,
      porcentaje_avance,
      // Datos para los cursos
      cursos = [],
      aprobado = false,
      comision_proyecto = 0,
      porcentaje_comision = 0,
      usar_comision_manual = false,
      comision_manual = null
    } = req.body;
    
    // Validar cliente_id
    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) {
      await t.rollback();
      return res.status(400).json({ message: 'El cliente especificado no existe' });
    }
    
    // Validar responsable_id si se proporciona
    if (responsable_id) {
      const responsable = await Usuario.findByPk(responsable_id);
      if (!responsable) {
        await t.rollback();
        return res.status(400).json({ message: 'El responsable especificado no existe' });
      }
    }
    
    // Generar el proyect_id: año+mes+dia+hora+idusuario
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const proyect_id = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${req.usuario.id}`;
    
    // Crear el proyecto
    const proyecto = await Proyecto.create({
      nombre,
      descripcion,
      cliente_id,
      fecha_inicio,
      fecha_fin,
      presupuesto,
      costo_real: costo_real || 0,
      estado,
      responsable_id,
      observaciones,
      prioridad,
      porcentaje_avance,
      comision_proyecto,
      porcentaje_comision,
      usuario_creacion_id: req.usuario.id,
      aprobado,
      proyect_id,
      usar_comision_manual: req.usuario.rol === 'administrador' ? usar_comision_manual : false,
      comision_manual: req.usuario.rol === 'administrador' ? comision_manual : null
    }, { transaction: t });
    
    // Notificar a los administradores si el proyecto NO está aprobado
    if (!aprobado) {
      // Buscar todos los usuarios con rol administrador
      const admins = await Usuario.findAll({
        include: [{
          association: Usuario.associations.Rol || 'Rol',
          where: { nombre: 'administrador' },
          required: true
        }],
        where: { activo: true },
        attributes: ['email', 'nombre', 'apellido']
      });
      const adminEmails = admins.map(a => a.email).filter(Boolean);
      if (adminEmails.length > 0) {
        await emailService.enviarCorreo({
          to: adminEmails,
          subject: 'Nuevo proyecto pendiente de aprobación',
          text: `Se ha creado un nuevo proyecto que requiere revisión y aprobación.\n\nNombre: ${nombre}\nDescripción: ${descripcion || ''}`,
          html: `<p>Se ha creado un nuevo proyecto que requiere revisión y aprobación.</p><ul><li><strong>Nombre:</strong> ${nombre}</li><li><strong>Descripción:</strong> ${descripcion || ''}</li></ul>`
        });
      }
    }
    
    // Obtener el owner del cliente
    const ownerCliente = cliente.owner || req.usuario.id;
    
    // Crear venta automáticamente si el estado es "En curso", "Liquidado" o "Facturado"
    if (['En curso', 'Liquidado', 'Facturado'].includes(estado)) {
      try {
        // Crear registro de venta
        const Venta = sequelize.models.Venta;
        
        if (!Venta) {
          console.error('Error: Modelo de Venta no encontrado');
        } else {
          // Definir solo los campos que existen en la tabla real
          const ventaData = {
            cliente_id,
            proyecto_id: proyecto.id,
            titulo: `Venta de proyecto: ${nombre}`,
            descripcion,
            fecha_venta: new Date(),
            monto_neto: presupuesto,
            iva: presupuesto * 0.19, // IVA 19%
            monto_total: presupuesto * 1.19,
            estado: 'en_proceso',
            usuario_id: req.usuario.id
          };
          
          // Especificar exactamente los campos existentes en la tabla
          await Venta.create(ventaData, { 
            transaction: t,
            fields: [
              'cliente_id',
              'proyecto_id',
              'titulo',
              'descripcion',
              'fecha_venta',
              'monto_neto',
              'iva',
              'monto_total',
              'estado',
              'usuario_id'
            ]
          });
          
          console.log(`Proyecto ${proyecto.id} creado con venta automática por estado ${estado}`);
        }
      } catch (ventaError) {
        console.error('Error al crear venta automática para el nuevo proyecto:', ventaError);
        // No hacemos rollback para permitir que el proyecto se cree incluso si hay errores al crear la venta
      }
    }
    
    // Si se proporcionaron cursos, crear los cursos asociados
    if (cursos && cursos.length > 0) {
      try {
        // Crear cada curso asociado al proyecto
        for (const cursoData of cursos) {
          const nuevoCurso = await Curso.create({
            nombre: cursoData.nombre_curso || nombre,
            codigo_sence: cursoData.codigo_sence || '',
            id_sence: cursoData.id_sence ? cursoData.id_sence : null,
            duracion_horas: parseInt(cursoData.horas_curso) || 0,
            valor_total: parseFloat(cursoData.valor_total) || 0,
            valor_participante: parseFloat(cursoData.valor_participante) || 0,
            nro_participantes: parseInt(cursoData.cantidad_participantes) || 0,
            fecha_creacion: new Date(),
            fecha_actualizacion: new Date(),
            fecha_inicio: fecha_inicio,
            fecha_fin: fecha_fin,
            modalidad: cursoData.modalidad || 'presencial',
            valor_hora: cursoData.horas_curso > 0 ? parseFloat(cursoData.valor_por_persona) / parseInt(cursoData.horas_curso) : 0,
            proyecto_id: proyecto.id,
            estado_sence: cursoData.estado_sence || 'pendiente',
            tipo_de_contrato: cursoData.tipo_de_contrato || 'Normal',
            estado_pre_contrato: cursoData.estado_pre_contrato || 'No Aplica',
            aprobado: cursoData.aprobado || false,
            owner: ownerCliente
          }, { transaction: t });

          // Sincronizar con SENCE si el id_sence no está vacío
          if (cursoData.id_sence) {
            await sincronizarConSence(cursoData.id_sence);
          }
        }
      } catch (cursoError) {
        console.error('Error al crear cursos asociados:', cursoError);
        // No hacemos rollback aquí para permitir que el proyecto se cree incluso si hay errores con los cursos
      }
    }
    
    // -- INICIO: Modificación para crear costos desde el array (si viene)
    // Verificar si req.body.costos existe y es un array
    if (req.body.costos && Array.isArray(req.body.costos)) {
      for (const costoData of req.body.costos) {
        // Validar campos obligatorios del costo
        if (!costoData.concepto || !costoData.monto) {
          throw new Error('El concepto y monto son obligatorios para cada costo.');
        }
        // Crear el costo asociado
        let aplicaIvaFinal = costoData.aplica_iva !== undefined ? costoData.aplica_iva : true;
        if (costoData.aplica_honorarios === true) {
          aplicaIvaFinal = false; // Forzar IVA a false si honorarios es true
        }
        await CostoProyecto.create({
          proyecto_id: proyecto.id,
          concepto: costoData.concepto,
          tipo_costo: costoData.tipo_costo || 'recursos_humanos',
          monto: parseFloat(costoData.monto),
          fecha: costoData.fecha || new Date(),
          proveedor: costoData.proveedor,
          estado: costoData.estado || 'ejecutado',
          aprobado: costoData.aprobado || false,
          aprobado_por: costoData.aprobado_por,
          tipo_documento: costoData.tipo_documento || 'factura',
          incluido_rentabilidad: costoData.incluido_rentabilidad !== undefined ? costoData.incluido_rentabilidad : true,
          aplica_iva: aplicaIvaFinal,
          aplica_honorarios: costoData.aplica_honorarios || false
        }, { transaction: t });
      }
    }
    // -- FIN: Modificación para crear costos desde el array
    
    await t.commit();
    committed = true;
    
    res.status(201).json({
      message: 'Proyecto creado exitosamente',
      proyecto
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Error al hacer rollback de la transacción:', rollbackError);
      }
    }
    res.status(500).json({ message: 'Error al crear proyecto', error: error.message });
  }
};

// Actualizar un proyecto
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  let committed = false;

  try {
    // Desestructurar los nuevos campos del body
    const { 
      nombre, 
      descripcion, 
      fecha_inicio, 
      fecha_fin, 
      presupuesto, 
      estado, 
      prioridad,
      cliente_id,
      responsable_id,
      porcentaje_avance,
      cursos,
      aprobado,
      comision_proyecto = 0,
      porcentaje_comision = 0,
      usar_comision_manual = false,
      comision_manual = null
    } = req.body;
    
    const usuario_modificacion_id = req.usuario.id;

    // Validar que el proyecto existe
    const proyecto = await Proyecto.findByPk(req.params.id, { transaction: t });
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // BLOQUEO DE EDICIÓN SI APROBADO
    if (proyecto.aprobado === true && !(aprobado === false && req.body.hasOwnProperty('aprobado') && Object.keys(req.body).length === 1)) {
      await t.rollback();
      return res.status(403).json({ message: 'No se puede editar un proyecto aprobado. Debe desaprobarlo antes de realizar cambios.' });
    }

    // Obtener el cliente asociado al proyecto (nuevo o actual)
    let clienteProyecto = null;
    if (cliente_id) {
      clienteProyecto = await Cliente.findByPk(cliente_id, { transaction: t });
    } else {
      clienteProyecto = await Cliente.findByPk(proyecto.cliente_id, { transaction: t });
    }
    const ownerCliente = clienteProyecto?.owner || req.usuario.id;

    // Validar que el responsable existe si se proporciona responsable_id
    if (responsable_id) {
        const responsable = await Usuario.findByPk(responsable_id, { transaction: t });
        if (!responsable) {
            await t.rollback();
            return res.status(404).json({ message: 'Responsable no encontrado' });
        }
    }

    // Guardar estado anterior para lógica posterior
    const estadoAnterior = proyecto.estado;
    const presupuestoAnterior = proyecto.presupuesto;

    // Actualizar los datos del proyecto
    await proyecto.update({
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      presupuesto,
      estado,
      prioridad: prioridad || proyecto.prioridad,
      porcentaje_avance: porcentaje_avance === undefined ? proyecto.porcentaje_avance : porcentaje_avance,
      usuario_modificacion_id,
      fecha_actualizacion: new Date(),
      aprobado: aprobado === undefined ? proyecto.aprobado : aprobado,
      comision_proyecto: comision_proyecto === undefined ? proyecto.comision_proyecto : comision_proyecto,
      porcentaje_comision: porcentaje_comision === undefined ? proyecto.porcentaje_comision : porcentaje_comision,
      usar_comision_manual: req.usuario.rol === 'administrador' ? usar_comision_manual : proyecto.usar_comision_manual,
      comision_manual: req.usuario.rol === 'administrador' ? comision_manual : proyecto.comision_manual
    }, { transaction: t });

    // Notificar a los administradores si el proyecto sigue sin estar aprobado
    const aprobadoActual = aprobado === undefined ? proyecto.aprobado : aprobado;
    if (!aprobadoActual) {
      const admins = await Usuario.findAll({
        include: [{
          association: Usuario.associations.Rol || 'Rol',
          where: { nombre: 'administrador' },
          required: true
        }],
        where: { activo: true },
        attributes: ['email', 'nombre', 'apellido']
      });
      const adminEmails = admins.map(a => a.email).filter(Boolean);
      if (adminEmails.length > 0) {
        await emailService.enviarCorreo({
          to: adminEmails,
          subject: 'Nuevo proyecto pendiente de aprobación',
          text: `Se ha editado un proyecto que sigue pendiente de revisión y aprobación.\n\nNombre: ${nombre}\nDescripción: ${descripcion || ''}`,
          html: `<p>Se ha editado un proyecto que sigue pendiente de revisión y aprobación.</p><ul><li><strong>Nombre:</strong> ${nombre}</li><li><strong>Descripción:</strong> ${descripcion || ''}</li></ul>`
        });
      }
    }

    // --- Sincronizar ingreso si el presupuesto cambió y el proyecto está aprobado ---
    if (proyecto.aprobado && presupuesto !== undefined && presupuesto !== presupuestoAnterior) {
      // Buscar ingreso asociado
      const ingreso = await models.Ingreso.findOne({
        where: { proyecto_id: proyecto.id },
        transaction: t
      });
      if (ingreso) {
        await ingreso.update({
          monto: presupuesto,
          descripcion: `Ingreso por aprobación del proyecto: ${proyecto.nombre}`
        }, { transaction: t });
      }
    }

    // --- Sincronizar egresos con costos ejecutados si el proyecto está aprobado ---
    if (proyecto.aprobado) {
      // Obtener todos los costos ejecutados del proyecto
      const costosEjecutados = await CostoProyecto.findAll({
        where: { proyecto_id: proyecto.id, estado: 'ejecutado' },
        transaction: t
      });
      for (const costo of costosEjecutados) {
        // Preparar datos para el egreso
        const egresoData = {
          descripcion: costo.concepto || costo.descripcion || 'Costo de proyecto',
          monto: costo.monto,
          fecha: costo.fecha,
          proyecto_id: costo.proyecto_id,
          proveedor_nombre: costo.proveedor,
          tipo_documento: costo.tipo_documento || 'factura',
          numero_documento: costo.numero_documento,
          fecha_documento: costo.fecha_documento,
          observaciones: costo.observaciones,
          usuario_id: costo.usuario_id || req.usuario.id,
          estado: 'pendiente',
        };
        if (costo.egreso_id) {
          // Actualizar egreso existente
          await models.Egreso.update(egresoData, { where: { id: costo.egreso_id }, transaction: t });
        } else {
          // Crear nuevo egreso y asociar al costo
          const nuevoEgreso = await models.Egreso.create(egresoData, { transaction: t });
          await costo.update({ egreso_id: nuevoEgreso.id }, { transaction: t });
        }
      }
    }

    // --- Manejo de Cursos ---
    if (cursos && Array.isArray(cursos)) { // Verificar si se envió un array de cursos
        const cursosActuales = await Curso.findAll({
            where: { proyecto_id: req.params.id },
            attributes: ['id'], // Solo necesitamos los IDs
            transaction: t
        });
        const idsCursosActuales = cursosActuales.map(c => c.id);
        const idsCursosRequest = cursos.map(c => c.id).filter(id => id != null); // IDs de cursos en la solicitud (filtrando nulos/undefined)

        const idsParaEliminar = idsCursosActuales.filter(id => !idsCursosRequest.includes(id));
        const cursosParaAgregar = cursos.filter(c => c.id == null || !idsCursosActuales.includes(c.id));
        const cursosParaActualizar = cursos.filter(c => c.id != null && idsCursosActuales.includes(c.id));

        // 1. Eliminar cursos que ya no están en la lista
        if (idsParaEliminar.length > 0) {
            try {
                await Curso.destroy({
                    where: {
                        id: { [Op.in]: idsParaEliminar },
                        proyecto_id: req.params.id // Doble seguridad
                    },
                    transaction: t
                });
            } catch (deleteError) {
                // Si es un error de constraint (ej. por participantes), lanzamos un error claro
                if (deleteError instanceof models.Sequelize.ForeignKeyConstraintError) { 
                     console.error('Error de constraint al eliminar curso:', deleteError);
                     throw new Error(`No se puede eliminar uno o más cursos porque tienen participantes asociados. IDs: ${idsParaEliminar.join(', ')}`);
                }
                 console.error('Error al eliminar cursos:', deleteError);
                 throw new Error('Error al intentar eliminar cursos asociados.'); // Lanzar error para que el catch principal haga rollback
            }
        }

        // 2. Actualizar cursos existentes
        for (const cursoData of cursosParaActualizar) {
           const valorTotalParsed = cursoData.valor_total !== undefined && cursoData.valor_total !== null ? parseFloat(cursoData.valor_total) : undefined;
           const valorParticipanteParsed = cursoData.valor_participante !== undefined && cursoData.valor_participante !== null ? parseFloat(cursoData.valor_participante) : undefined;
           const nroParticipantesParsed = cursoData.cantidad_participantes !== undefined && cursoData.cantidad_participantes !== null ? parseInt(cursoData.cantidad_participantes) : undefined;
           const duracionHorasParsed = cursoData.horas_curso !== undefined && cursoData.horas_curso !== null ? parseInt(cursoData.horas_curso) : undefined;
           const valorHoraCalculado = (duracionHorasParsed && duracionHorasParsed > 0 && valorParticipanteParsed !== undefined) ? valorParticipanteParsed / duracionHorasParsed : undefined;

            // Obtener el curso actual para comparar el id_sence
            const cursoActual = await Curso.findByPk(cursoData.id, { transaction: t });
            const idSenceAnterior = cursoActual ? cursoActual.id_sence : null;

            await Curso.update({
                 nombre: cursoData.nombre || nombre,
                 codigo_sence: cursoData.codigo_sence,
                 id_sence: (typeof cursoData.id_sence === 'string' && cursoData.id_sence.trim() === '') ? null : cursoData.id_sence,
                 duracion_horas: duracionHorasParsed,
                 ...(valorTotalParsed !== undefined && { valor_total: valorTotalParsed }),
                 valor_participante: valorParticipanteParsed,
                 nro_participantes: nroParticipantesParsed,
                 fecha_actualizacion: new Date(),
                 fecha_inicio: fecha_inicio,
                 fecha_fin: fecha_fin,
                 modalidad: cursoData.modalidad,
                 ...(valorHoraCalculado !== undefined && { valor_hora: valorHoraCalculado }),
                 estado_sence: cursoData.estado_sence,
                 tipo_de_contrato: cursoData.tipo_de_contrato,
                 estado_pre_contrato: cursoData.estado_pre_contrato,
                 owner: ownerCliente
             }, {
                 where: { id: cursoData.id, proyecto_id: req.params.id },
                 transaction: t
             });

            // Sincronizar con SENCE si el id_sence no está vacío y es nuevo o cambió
            if (cursoData.id_sence && cursoData.id_sence !== idSenceAnterior) {
              await sincronizarConSence(cursoData.id_sence);
            }
         }

        // 3. Agregar nuevos cursos
        for (const cursoData of cursosParaAgregar) {
             const valorTotalParsed = parseFloat(cursoData.valor_total) || 0;
             const valorParticipanteParsed = parseFloat(cursoData.valor_participante) || 0;
             const nroParticipantesParsed = parseInt(cursoData.cantidad_participantes) || 0;
             const duracionHorasParsed = parseInt(cursoData.horas_curso) || 0;
             const valorHoraCalculado = (duracionHorasParsed > 0 && valorParticipanteParsed) ? valorParticipanteParsed / duracionHorasParsed : 0;

            const nuevoCurso = await Curso.create({
                nombre: cursoData.nombre || nombre,
                codigo_sence: cursoData.codigo_sence || '',
                id_sence: cursoData.id_sence ? cursoData.id_sence : null,
                duracion_horas: duracionHorasParsed,
                valor_total: valorTotalParsed,
                valor_participante: valorParticipanteParsed,
                nro_participantes: nroParticipantesParsed,
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date(),
                fecha_inicio: fecha_inicio,
                fecha_fin: fecha_fin,
                modalidad: cursoData.modalidad || 'presencial',
                valor_hora: valorHoraCalculado,
                proyecto_id: req.params.id,
                estado_sence: cursoData.estado_sence || 'pendiente',
                tipo_de_contrato: cursoData.tipo_de_contrato || 'Normal',
                estado_pre_contrato: cursoData.estado_pre_contrato || 'No Aplica',
                aprobado: cursoData.aprobado || false,
                owner: ownerCliente
            }, { transaction: t });

            // Sincronizar con SENCE si el id_sence no está vacío
            if (cursoData.id_sence) {
              await sincronizarConSence(cursoData.id_sence);
            }
        }
    }

    // --- INICIO: Manejo de Costos (similar a create) ---
    // Verificar si req.body.costos existe (para actualizar/agregar/eliminar costos)
    if (req.body.costos && Array.isArray(req.body.costos)) {
      const costosRequest = req.body.costos;
      const costosActuales = await CostoProyecto.findAll({
        where: { proyecto_id: req.params.id },
        attributes: ['id'],
        transaction: t
      });
      const idsCostosActuales = costosActuales.map(c => c.id);
      const idsCostosRequest = costosRequest.map(c => c.id).filter(id => id != null);

      const idsParaEliminar = idsCostosActuales.filter(id => !idsCostosRequest.includes(id));
      const costosParaAgregar = costosRequest.filter(c => c.id == null);
      const costosParaActualizar = costosRequest.filter(c => c.id != null && idsCostosActuales.includes(c.id));

      // 1. Eliminar costos que ya no están
      if (idsParaEliminar.length > 0) {
        await CostoProyecto.destroy({
          where: { id: { [Op.in]: idsParaEliminar }, proyecto_id: req.params.id },
          transaction: t
        });
      }

      // 2. Actualizar costos existentes
      for (const costoData of costosParaActualizar) {
        if (!costoData.concepto || !costoData.monto) {
           throw new Error('El concepto y monto son obligatorios para cada costo.');
        }
        let aplicaIvaFinalUpdate = costoData.aplica_iva !== undefined ? costoData.aplica_iva : true;
        if (costoData.aplica_honorarios === true) {
          aplicaIvaFinalUpdate = false; // Forzar IVA a false si honorarios es true
        }
        await CostoProyecto.update({
            concepto: costoData.concepto,
            tipo_costo: costoData.tipo_costo || 'recursos_humanos',
            monto: parseFloat(costoData.monto),
            fecha: costoData.fecha || new Date(),
            proveedor: costoData.proveedor,
            estado: costoData.estado || 'ejecutado',
            aprobado: costoData.aprobado || false,
            aprobado_por: costoData.aprobado_por,
            tipo_documento: costoData.tipo_documento || 'factura',
            incluido_rentabilidad: costoData.incluido_rentabilidad !== undefined ? costoData.incluido_rentabilidad : true,
            aplica_iva: aplicaIvaFinalUpdate,
            aplica_honorarios: costoData.aplica_honorarios || false
          }, {
            where: { id: costoData.id, proyecto_id: req.params.id },
            transaction: t
          });
      }

      // 3. Agregar nuevos costos
      for (const costoData of costosParaAgregar) {
          if (!costoData.concepto || !costoData.monto) {
            throw new Error('El concepto y monto son obligatorios para cada costo.');
          }
          let aplicaIvaFinalAdd = costoData.aplica_iva !== undefined ? costoData.aplica_iva : true;
          if (costoData.aplica_honorarios === true) {
            aplicaIvaFinalAdd = false; // Forzar IVA a false si honorarios es true
          }
          await CostoProyecto.create({
            proyecto_id: req.params.id,
            concepto: costoData.concepto,
            tipo_costo: costoData.tipo_costo || 'recursos_humanos',
            monto: parseFloat(costoData.monto),
            fecha: costoData.fecha || new Date(),
            proveedor: costoData.proveedor,
            estado: costoData.estado || 'ejecutado',
            aprobado: costoData.aprobado || false,
            aprobado_por: costoData.aprobado_por,
            tipo_documento: costoData.tipo_documento || 'factura',
            incluido_rentabilidad: costoData.incluido_rentabilidad !== undefined ? costoData.incluido_rentabilidad : true,
            aplica_iva: aplicaIvaFinalAdd,
            aplica_honorarios: costoData.aplica_honorarios || false
          }, { transaction: t });
      }
    }
    // --- FIN: Manejo de Costos ---

    // Lógica para crear venta automática si el estado cambia a 'En curso'
    if (estado === 'En curso' && estadoAnterior !== 'En curso' && presupuesto > 0 && cliente_id) {
        try {
             // Placeholder: Lógica de creación de venta automática ejecutada.
        } catch (ventaError) {
            console.error('Error al crear venta automática para el proyecto:', ventaError);
            throw new Error('Error al crear la venta asociada al proyecto en curso.');
        }
    }

    // Si cambiaron las fechas del proyecto, actualizar también las fechas de los cursos asociados
    if ((!cursos || !Array.isArray(cursos)) && (fecha_inicio !== proyecto.fecha_inicio || fecha_fin !== proyecto.fecha_fin)) {
         try {
             await Curso.update(
                 { fecha_inicio: fecha_inicio, fecha_fin: fecha_fin, fecha_actualizacion: new Date() },
                 { where: { proyecto_id: req.params.id }, transaction: t }
             );
         } catch (error) {
             console.error('Error al actualizar fechas de cursos asociados (sin array cursos):', error);
              throw new Error('Error al actualizar las fechas de los cursos asociados.');
         }
    }

    // --- Commit Final ---
    await t.commit();
    committed = true;

    // Obtener el proyecto actualizado con sus relaciones para la respuesta
    const proyectoActualizado = await Proyecto.findByPk(req.params.id, {
      include: [
         { model: Cliente, as: 'Cliente', attributes: ['id', 'razon_social', 'rut', 'giro', 'direccion', 'email', 'telefono'] },
         { model: Usuario, as: 'Responsable', attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] },
         { model: CostoProyecto, as: 'CostoProyectos', attributes: ['id', 'proyecto_id', 'concepto', 'tipo_costo', 'monto', 'fecha', 'estado', 'proveedor', 'aprobado', 'aprobado_por'] },
         { model: Curso, as: 'Cursos', attributes: ['id', 'nombre', 'codigo_sence', 'id_sence', 'duracion_horas', 'valor_total', 'nro_participantes', 'modalidad', 'estado_sence', 'tipo_de_contrato', 'estado_pre_contrato'] }
      ]
    });

    res.status(200).json({
      message: 'Proyecto actualizado exitosamente',
      proyecto: proyectoActualizado
    });

  } catch (error) {
    console.error('Error detallado al actualizar proyecto:', error);
    if (!committed) {
      try {
        await t.rollback();
        console.log('Rollback de transacción realizado.');
      } catch (rollbackError) {
        console.error('Error al hacer rollback de la transacción:', rollbackError);
      }
    }
    res.status(500).json({ message: error.message || 'Error interno al actualizar proyecto' });
  }
};

// Eliminar un proyecto (soft delete)
exports.delete = async (req, res) => {
  const t = await sequelize.transaction();
  let committed = false;
  
  try {
    const proyecto = await Proyecto.findByPk(req.params.id);
    
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Verificar si ya tiene costos asociados
    const costos = await CostoProyecto.count({
      where: { proyecto_id: proyecto.id }
    });
    
    if (costos > 0) {
      // Cambiar estado a No iniciado en lugar de eliminar
      await proyecto.update({ 
        estado: 'No iniciado', // Cambiado de 'cancelado'
        usuario_modificacion_id: req.usuario.id
      }, { transaction: t });
      
      await t.commit();
      committed = true;
      return res.status(200).json({ 
        message: 'El estado del proyecto se cambió a "No iniciado". No se puede eliminar porque tiene costos asociados.' 
      });
    }
    
    // Eliminar proyecto (soft delete)
    await proyecto.destroy({ transaction: t });
    
    await t.commit();
    committed = true;
    
    res.status(200).json({ message: 'Proyecto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Error al hacer rollback de la transacción:', rollbackError);
      }
    }
    res.status(500).json({ message: 'Error al eliminar proyecto', error: error.message });
  }
};

// Eliminar un proyecto permanentemente (hard delete - solo admin)
exports.hardDelete = async (req, res) => {
  const t = await sequelize.transaction();
  let committed = false;
  
  try {
    const proyecto = await Proyecto.findByPk(req.params.id, { paranoid: false });
    
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Eliminar costos asociados
    await CostoProyecto.destroy({
      where: { proyecto_id: proyecto.id },
      force: true,
      transaction: t
    });
    
    // Eliminar proyecto permanentemente
    await proyecto.destroy({ force: true, transaction: t });
    
    await t.commit();
    committed = true;
    
    res.status(200).json({ message: 'Proyecto eliminado permanentemente' });
  } catch (error) {
    console.error('Error al eliminar permanentemente el proyecto:', error);
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Error al hacer rollback de la transacción:', rollbackError);
      }
    }
    res.status(500).json({ message: 'Error al eliminar permanentemente el proyecto', error: error.message });
  }
}; 