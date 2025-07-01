const { Curso, Participante, DeclaracionJurada, Usuario, Proyecto, Cliente } = require('../models');
const { Op } = require('sequelize');
const { sincronizarConSence } = require('../utils/senceSync');
const axios = require('axios');

/**
 * Obtener todos los cursos con paginación y filtros desde el servicio
 */
const getAllCursos = async (queryParams, userId, userRol) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    estado,
    modalidad,
    fecha_inicio,
    fecha_fin,
    codigo_sence,
    estado_sence,
    tipo_de_contrato,
    estado_pre_contrato
  } = queryParams;

  const offset = (Number(page) - 1) * Number(limit);
  const whereConditions = {};

  if (search) {
    whereConditions[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { codigo_sence: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (estado) whereConditions.estado = estado;
  if (modalidad) whereConditions.modalidad = modalidad;
  if (codigo_sence) whereConditions.codigo_sence = codigo_sence;
  if (estado_sence) whereConditions.estado_sence = estado_sence;
  if (tipo_de_contrato) whereConditions.tipo_de_contrato = tipo_de_contrato;
  if (estado_pre_contrato) whereConditions.estado_pre_contrato = estado_pre_contrato;
  
  if (fecha_inicio) {
    whereConditions.fecha_inicio = { [Op.gte]: new Date(fecha_inicio) };
  }
  if (fecha_fin) {
    whereConditions.fecha_fin = { [Op.lte]: new Date(fecha_fin) };
  }

  // Filtrado por owner del curso si no es admin
  if (userRol !== 'administrador') {
    whereConditions.owner = userId;
  }

  // Incluir Proyecto y Cliente
  const include = [
    {
      model: Proyecto,
      as: 'Proyecto',
      attributes: ['id', 'nombre', 'cliente_id'],
      include: [
        {
          model: Cliente,
          attributes: ['id', 'razon_social', 'owner']
        }
      ]
    }
  ];

  const { count, rows: cursos } = await Curso.findAndCountAll({
    where: whereConditions,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['fecha_creacion', 'DESC']]
  });

  return {
    total: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    cursos
  };
};

/**
 * Crear un nuevo curso desde el servicio
 */
const addNewCurso = async (cursoData) => {
  const {
    nombre, codigo_sence, id_sence, duracion_horas, valor_hora, valor_total,
    modalidad, descripcion, objetivos, contenidos, requisitos, materiales,
    nro_participantes, fecha_inicio, fecha_fin, estado, estado_sence,
    tipo_de_contrato, estado_pre_contrato, proyecto_id, valor_participante,
    owner_operaciones
  } = cursoData;

  if (!nombre || !duracion_horas || !valor_hora || !valor_total) {
    const error = new Error('Faltan campos obligatorios: nombre, duracion_horas, valor_hora, valor_total');
    error.statusCode = 400;
    throw error;
  }

  if (codigo_sence) {
    const cursoExistente = await Curso.findOne({ where: { codigo_sence } });
    if (cursoExistente) {
      const error = new Error('Ya existe un curso con el mismo código SENCE');
      error.statusCode = 400;
      throw error;
    }
  }

  if (estado_sence) {
    const estadosSenceValidos = ['pendiente', 'aprobado', 'rechazado', 'en_revision'];
    if (!estadosSenceValidos.includes(estado_sence)) {
      const error = new Error('Estado SENCE no válido. Los estados permitidos son: pendiente, aprobado, rechazado, en_revision');
      error.statusCode = 400;
      throw error;
    }
  }

  const nuevoCurso = await Curso.create({
    nombre,
    codigo_sence,
    id_sence,
    duracion_horas,
    valor_hora,
    valor_total,
    valor_participante,
    modalidad,
    descripcion,
    objetivos,
    contenidos,
    requisitos,
    materiales,
    nro_participantes,
    fecha_inicio,
    fecha_fin,
    estado: estado || 'activo',
    estado_sence: estado_sence || 'pendiente',
    tipo_de_contrato,
    estado_pre_contrato,
    proyecto_id,
    owner_operaciones
  });

  return nuevoCurso;
};

/**
 * Obtener un curso por ID desde el servicio
 */
const getCursoById = async (id) => {
  const curso = await Curso.findByPk(id, {
    include: [
      {
        model: Proyecto,
        as: 'Proyecto',
        attributes: ['id', 'nombre', 'presupuesto', 'estado', 'responsable_id', 'cliente_id', 'proyect_id'],
        include: [
          {
            model: Cliente,
            attributes: ['id', 'razon_social', 'rut', 'contacto_email', 'contacto_nombre', 'contacto_telefono']
          },
          {
            model: Usuario,
            as: 'Responsable',
            attributes: ['id', 'nombre', 'apellido', 'email']
          }
        ]
      },
      {
        model: Participante,
        attributes: ['id', 'nombre', 'apellido', 'rut', 'email', 'empresa', 'estado', 'porcentaje_asistencia', 'nota_final', 'tramo_sence', 'certificado'],
        required: false,
        separate: false
      },
      {
        model: Usuario,
        as: 'ResponsableOperaciones',
        attributes: ['id', 'nombre', 'apellido', 'email']
      }
    ],
    attributes: {
      include: ['id', 'nombre', 'codigo_sence', 'id_sence', 'duracion_horas', 'valor_hora', 'valor_total',
                'modalidad', 'descripcion', 'objetivos', 'contenidos', 'requisitos', 'materiales',
                'nro_participantes', 'fecha_inicio', 'fecha_fin', 'participantes_aprobados',
                'participantes_reprobados', 'participantes_eliminados', 'estado',
                'estado_sence', 'tipo_de_contrato', 'estado_pre_contrato',
                'proyecto_id', 'fecha_creacion', 'fecha_actualizacion']
    }
  });

  if (!curso) {
    const error = new Error('Curso no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const cursoData = curso.toJSON();
  cursoData.DeclaracionJuradas = [];

  if (curso.id_sence) {
    const declaracionesJuradas = await DeclaracionJurada.findAll({
      where: { id_sence: curso.id_sence },
      attributes: ['id', 'id_sence', 'estado', 'rut', 'nombre', 'sesiones']
    });
    cursoData.DeclaracionJuradas = declaracionesJuradas;
  }

  if (curso.ResponsableOperaciones) {
    cursoData.owner_operaciones = curso.ResponsableOperaciones.id;
    cursoData.owner_operaciones_nombre = curso.ResponsableOperaciones.nombre + ' ' + curso.ResponsableOperaciones.apellido;
    cursoData.owner_operaciones_email = curso.ResponsableOperaciones.email;
  }

  return cursoData;
};

/**
 * Actualizar un curso existente desde el servicio
 */
const updateExistingCurso = async (id, cursoData, userRol, userId) => {
  const curso = await Curso.findByPk(id);
  if (!curso) {
    const error = new Error('Curso no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const {
    nombre, codigo_sence, id_sence, duracion_horas, valor_hora, valor_total, valor_participante,
    modalidad, descripcion, objetivos, contenidos, requisitos, materiales,
    nro_participantes, fecha_inicio, fecha_fin, participantes_aprobados,
    participantes_reprobados, participantes_eliminados, estado, estado_sence,
    tipo_de_contrato, estado_pre_contrato, proyecto_id, owner, owner_operaciones
  } = cursoData;

  if (codigo_sence && codigo_sence !== curso.codigo_sence) {
    const cursoExistente = await Curso.findOne({
      where: {
        codigo_sence,
        id: { [Op.ne]: id }
      }
    });
    if (cursoExistente) {
      const error = new Error('Ya existe otro curso con el mismo código SENCE');
      error.statusCode = 400;
      throw error;
    }
  }

  if (estado_sence) {
    const estadosSenceValidos = ['pendiente', 'aprobado', 'rechazado', 'en_revision'];
    if (!estadosSenceValidos.includes(estado_sence)) {
      const error = new Error('Estado SENCE no válido. Los estados permitidos son: pendiente, aprobado, rechazado, en_revision');
      error.statusCode = 400;
      throw error;
    }
  }

  const idSenceAnterior = curso.id_sence;
  const updateFields = {
    nombre: nombre || curso.nombre,
    codigo_sence: codigo_sence || curso.codigo_sence,
    id_sence: id_sence || curso.id_sence,
    duracion_horas: duracion_horas || curso.duracion_horas,
    valor_hora: valor_hora || curso.valor_hora,
    valor_total: valor_total || curso.valor_total,
    valor_participante: valor_participante || curso.valor_participante,
    modalidad: modalidad || curso.modalidad,
    descripcion: descripcion || curso.descripcion,
    objetivos: objetivos || curso.objetivos,
    contenidos: contenidos || curso.contenidos,
    requisitos: requisitos || curso.requisitos,
    materiales: materiales || curso.materiales,
    nro_participantes: nro_participantes || curso.nro_participantes,
    fecha_inicio: fecha_inicio || curso.fecha_inicio,
    fecha_fin: fecha_fin || curso.fecha_fin,
    participantes_aprobados: participantes_aprobados || curso.participantes_aprobados,
    participantes_reprobados: participantes_reprobados || curso.participantes_reprobados,
    participantes_eliminados: participantes_eliminados || curso.participantes_eliminados,
    estado: estado || curso.estado,
    estado_sence: estado_sence || curso.estado_sence,
    tipo_de_contrato: tipo_de_contrato || curso.tipo_de_contrato,
    estado_pre_contrato: estado_pre_contrato || curso.estado_pre_contrato,
    proyecto_id: proyecto_id || curso.proyecto_id,
    fecha_actualizacion: new Date(),
    owner_operaciones: owner_operaciones !== undefined ? owner_operaciones : curso.owner_operaciones
  };
  // Solo los administradores pueden cambiar el owner
  if (userRol === 'administrador' && owner) {
    updateFields.owner = owner;
  }
  await curso.update(updateFields);

  let senceSyncResult = null;
  if (id_sence && id_sence !== idSenceAnterior) {
    try {
      const response = await axios.post('https://sencecursossync.azurewebsites.net/api/extracciondatossence', {
        acc_cap: id_sence
      });
      senceSyncResult = {
        success: true,
        message: 'Sincronización con SENCE exitosa',
        senceResponse: response.data
      };
    } catch (err) {
      if (err.response && err.response.data && typeof err.response.data === 'string' && err.response.data.includes('duplicate key value violates unique constraint')) {
        senceSyncResult = {
          success: false,
          message: 'Error: El curso ya existe en SENCE (duplicado)',
          senceResponse: err.response.data
        };
      } else {
        senceSyncResult = {
          success: false,
          message: 'Error al sincronizar con SENCE',
          senceResponse: err.response ? err.response.data : err.message
        };
      }
    }
  }
  return { curso, senceSyncResult };
};

/**
 * Eliminar un curso desde el servicio
 */
const removeCurso = async (id) => {
  const curso = await Curso.findByPk(Number(id), {
    include: [{ model: Proyecto, as: 'Proyecto', attributes: ['id', 'presupuesto'] }]
  });

  if (!curso) {
    const error = new Error('Curso no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const participantes = await Participante.findAll({ where: { curso_id: Number(id) } });
  if (participantes && participantes.length > 0) {
    const error = new Error('No se puede eliminar el curso porque tiene participantes asociados');
    error.statusCode = 400;
    throw error;
  }

  if (curso.id_sence) {
    const declaracionesJuradas = await DeclaracionJurada.findAll({ where: { id_sence: curso.id_sence } });
    if (declaracionesJuradas && declaracionesJuradas.length > 0) {
      const error = new Error('No se puede eliminar el curso porque tiene declaraciones juradas asociadas');
      error.statusCode = 400;
      throw error;
    }
  }

  if (curso.proyecto_id && curso.Proyecto) {
    const valorCurso = parseFloat(curso.valor_total) || 0;
    const presupuestoActual = parseFloat(curso.Proyecto.presupuesto) || 0;
    const nuevoPresupuesto = Math.max(0, presupuestoActual - valorCurso);
    await Proyecto.update(
      { presupuesto: nuevoPresupuesto },
      { where: { id: curso.proyecto_id } }
    );
  }

  await curso.destroy();
  return { message: 'Curso eliminado exitosamente' };
};

/**
 * Cambiar el estado de un curso desde el servicio
 */
const changeCursoEstado = async (id, estado) => {
  const estadosValidos = ['activo', 'inactivo', 'en_revision', 'finalizado'];
  if (!estadosValidos.includes(estado)) {
    const error = new Error('Estado no válido. Los estados permitidos son: activo, inactivo, en_revision, finalizado');
    error.statusCode = 400;
    throw error;
  }

  const curso = await Curso.findByPk(id);
  if (!curso) {
    const error = new Error('Curso no encontrado');
    error.statusCode = 404;
    throw error;
  }

  await curso.update({ estado, fecha_actualizacion: new Date() });
  return curso;
};

/**
 * Obtener estadísticas de cursos desde el servicio
 */
const getCursoEstadisticas = async () => {
  const cursosPorEstado = await Curso.findAll({
    attributes: ['estado', [Curso.sequelize.fn('COUNT', Curso.sequelize.col('id')), 'total']],
    group: ['estado']
  });
  const cursosPorModalidad = await Curso.findAll({
    attributes: ['modalidad', [Curso.sequelize.fn('COUNT', Curso.sequelize.col('id')), 'total']],
    group: ['modalidad']
  });

  const fechaActual = new Date();
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + 30);
  const cursosProximosAIniciar = await Curso.findAll({
    where: {
      fecha_inicio: { [Op.between]: [fechaActual, fechaLimite] },
      estado: 'activo'
    },
    attributes: ['id', 'nombre', 'codigo_sence', 'fecha_inicio', 'nro_participantes']
  });

  const fechaAnterior = new Date();
  fechaAnterior.setDate(fechaAnterior.getDate() - 30);
  const cursosFinalizadosRecientemente = await Curso.findAll({
    where: {
      fecha_fin: { [Op.between]: [fechaAnterior, fechaActual] },
      estado: 'finalizado'
    },
    attributes: ['id', 'nombre', 'codigo_sence', 'fecha_fin', 'participantes_aprobados', 'participantes_reprobados']
  });

  return {
    cursosPorEstado,
    cursosPorModalidad,
    cursosProximosAIniciar,
    cursosFinalizadosRecientemente,
    totalCursos: await Curso.count()
  };
};

/**
 * Buscar cursos por código SENCE desde el servicio
 */
const findCursosBySenceCode = async (codigo) => {
  return await Curso.findAll({
    where: { codigo_sence: { [Op.iLike]: `%${codigo}%` } }
  });
};

/**
 * Obtener resumen de participantes por curso desde el servicio
 */
const getParticipantesResumen = async (cursoId) => {
  const curso = await Curso.findByPk(cursoId);
  if (!curso) {
    const error = new Error('Curso no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const participantesPorEstado = await Participante.findAll({
    attributes: ['estado', [Participante.sequelize.fn('COUNT', Participante.sequelize.col('id')), 'total']],
    where: { curso_id: cursoId },
    group: ['estado']
  });

  const promedios = await Participante.findAll({
    attributes: [
      [Participante.sequelize.fn('AVG', Participante.sequelize.col('porcentaje_asistencia')), 'promedio_asistencia'],
      [Participante.sequelize.fn('AVG', Participante.sequelize.col('nota_final')), 'promedio_nota']
    ],
    where: {
      curso_id: cursoId,
      porcentaje_asistencia: { [Op.not]: null },
      nota_final: { [Op.not]: null }
    }
  });

  return {
    total_participantes: curso.nro_participantes,
    aprobados: curso.participantes_aprobados,
    reprobados: curso.participantes_reprobados,
    eliminados: curso.participantes_eliminados,
    por_estado: participantesPorEstado,
    promedios: promedios[0] || { promedio_asistencia: 0, promedio_nota: 0 } // Manejar caso sin promedios
  };
};

/**
 * Actualizar estado de múltiples participantes desde el servicio
 */
const updateMultipleParticipantes = async (cursoId, data) => {
  const { participantes_ids, estado, nota_final, porcentaje_asistencia } = data;

  if (!participantes_ids || !Array.isArray(participantes_ids) || participantes_ids.length === 0) {
    const error = new Error('Debe proporcionar un array de IDs de participantes');
    error.statusCode = 400;
    throw error;
  }

  if (estado) {
    const estadosValidos = ['inscrito', 'confirmado', 'asistiendo', 'aprobado', 'reprobado', 'retirado'];
    if (!estadosValidos.includes(estado)) {
      const error = new Error('Estado no válido. Los estados permitidos son: inscrito, confirmado, asistiendo, aprobado, reprobado, retirado');
      error.statusCode = 400;
      throw error;
    }
  }

  const curso = await Curso.findByPk(cursoId);
  if (!curso) {
    const error = new Error('Curso no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const participantes = await Participante.findAll({
    where: { id: { [Op.in]: participantes_ids }, curso_id: cursoId }
  });

  if (participantes.length === 0) {
    const error = new Error('No se encontraron participantes válidos para actualizar');
    error.statusCode = 404; // O 400 si se considera error de cliente por IDs no válidos
    throw error;
  }

  let nuevosAprobados = 0, nuevosReprobados = 0, nuevosEliminados = 0;
  let anteriorAprobados = 0, anteriorReprobados = 0, anteriorEliminados = 0;

  for (const participante of participantes) {
    if (participante.estado === 'aprobado') anteriorAprobados++;
    else if (participante.estado === 'reprobado') anteriorReprobados++;
    else if (participante.estado === 'retirado') anteriorEliminados++;

    const datosActualizacion = {};
    if (estado) datosActualizacion.estado = estado;
    if (nota_final !== undefined) datosActualizacion.nota_final = nota_final;
    if (porcentaje_asistencia !== undefined) datosActualizacion.porcentaje_asistencia = porcentaje_asistencia;

    await participante.update(datosActualizacion);

    if (estado) {
      if (estado === 'aprobado') nuevosAprobados++;
      else if (estado === 'reprobado') nuevosReprobados++;
      else if (estado === 'retirado') nuevosEliminados++;
    }
  }

  if (estado) {
    await curso.update({
      participantes_aprobados: (curso.participantes_aprobados || 0) - anteriorAprobados + nuevosAprobados,
      participantes_reprobados: (curso.participantes_reprobados || 0) - anteriorReprobados + nuevosReprobados,
      participantes_eliminados: (curso.participantes_eliminados || 0) - anteriorEliminados + nuevosEliminados,
      fecha_actualizacion: new Date()
    });
  }

  return {
    actualizados: participantes.length,
    total_solicitados: participantes_ids.length
  };
};

/**
 * Obtener declaraciones juradas de un curso desde el servicio
 */
const getDeclaracionesJuradasByCurso = async (cursoId) => {
  const curso = await Curso.findByPk(cursoId);
  if (!curso) {
    const error = new Error('Curso no encontrado');
    error.statusCode = 404;
    throw error;
  }
  if (!curso.id_sence) {
    const error = new Error('El curso no tiene ID SENCE asignado');
    error.statusCode = 400; // O 404 si se considera que no es un error del cliente
    throw error;
  }

  return await DeclaracionJurada.findAll({
    where: { id_sence: curso.id_sence },
    include: [{ model: Usuario, attributes: ['id', 'nombre', 'apellido', 'email'] }],
    order: [['createdAt', 'DESC']]
  });
};

/**
 * Obtener información sincronizada de cursos con datos relacionados desde el servicio
 */
const getCursosSincronizadosConDetalles = async (userId = null, userRol = null) => {
  const where = {};
  if (userRol && userRol !== 'administrador') {
    where.owner = userId;
  }
  const cursos = await Curso.findAll({
    where,
    attributes: ['id', 'nombre', 'codigo_sence', 'id_sence', 'modalidad', 'nro_participantes', 'fecha_inicio', 'fecha_fin', 'estado', 'proyecto_id', 'estado_sence', 'tipo_de_contrato', 'estado_pre_contrato', 'valor_total', 'valor_participante', 'owner_operaciones'],
    include: [
      {
        model: Proyecto,
        as: 'Proyecto',
        attributes: ['id', 'nombre', 'cliente_id', 'responsable_id', 'proyect_id'],
        include: [
          { model: Usuario, as: 'Responsable', attributes: ['id', 'nombre', 'apellido'] },
          { model: Cliente, as: 'Cliente', attributes: ['id', 'razon_social'] }
        ]
      },
      {
        model: Usuario,
        as: 'ResponsableOperaciones',
        attributes: ['id', 'nombre', 'apellido', 'email']
      }
    ]
  });

  return cursos.map(curso => {
    const data = {
      id: curso.id,
      nombre: curso.nombre,
      codigo_sence: curso.codigo_sence,
      id_sence: curso.id_sence,
      modalidad: curso.modalidad,
      nro_participantes: curso.nro_participantes,
      valor_total: curso.valor_total,
      valor_participante: curso.valor_participante,
      fecha_inicio: curso.fecha_inicio,
      fecha_fin: curso.fecha_fin,
      estado: curso.estado,
      estado_sence: curso.estado_sence,
      tipo_de_contrato: curso.tipo_de_contrato,
      estado_pre_contrato: curso.estado_pre_contrato,
      proyect_id: curso.Proyecto ? curso.Proyecto.proyect_id : null
    };
    if (curso.Proyecto) {
      data.proyecto_id = curso.Proyecto.id;
      data.proyecto_nombre = curso.Proyecto.nombre;
      data.cliente_id = curso.Proyecto.cliente_id;
      if (curso.Proyecto.Responsable) {
        data.responsable_id = curso.Proyecto.responsable_id;
        data.responsable_nombre = curso.Proyecto.Responsable.nombre;
        data.responsable_apellido = curso.Proyecto.Responsable.apellido;
      }
      if (curso.Proyecto.Cliente) {
        data.cliente_razon_social = curso.Proyecto.Cliente.razon_social;
      }
    }
    if (curso.ResponsableOperaciones) {
      data.owner_operaciones = curso.ResponsableOperaciones.id;
      data.owner_operaciones_nombre = curso.ResponsableOperaciones.nombre + ' ' + curso.ResponsableOperaciones.apellido;
      data.owner_operaciones_email = curso.ResponsableOperaciones.email;
    }
    return data;
  });
};

/**
 * Cambiar el estado SENCE de un curso desde el servicio
 */
const changeCursoSenceEstado = async (id, estadoSence) => {
  const estadosSenceValidos = ['pendiente', 'aprobado', 'rechazado', 'en_revision'];
  if (!estadosSenceValidos.includes(estadoSence)) {
    const error = new Error('Estado SENCE no válido. Los estados permitidos son: pendiente, aprobado, rechazado, en_revision');
    error.statusCode = 400;
    throw error;
  }

  const curso = await Curso.findByPk(id);
  if (!curso) {
    const error = new Error('Curso no encontrado');
    error.statusCode = 404;
    throw error;
  }

  await curso.update({ estado_sence: estadoSence, fecha_actualizacion: new Date() });
  return { id: curso.id, estado_sence: curso.estado_sence };
};

/**
 * Sincronización manual con SENCE para un curso desde el servicio
 */
const manualSenceSync = async (cursoId) => {
  const curso = await Curso.findByPk(cursoId);
  if (!curso) {
    const error = new Error('Curso no encontrado');
    error.statusCode = 404;
    throw error;
  }
  if (!curso.id_sence) {
    const error = new Error('El curso no tiene ID SENCE asignado');
    error.statusCode = 400;
    throw error;
  }
  return await sincronizarConSence(curso.id_sence);
};

/**
 * Actualizar el campo 'certificado' de todos los participantes activos de un curso
 */
const updateCertificadosParticipantes = async (cursoId, certificado) => {
  const curso = await Curso.findByPk(cursoId);
  if (!curso) {
    const error = new Error('Curso no encontrado');
    error.statusCode = 404;
    throw error;
  }
  // Solo participantes activos (no retirados)
  const [updatedCount] = await Participante.update(
    { certificado },
    { where: { curso_id: cursoId, estado: { [Op.ne]: 'retirado' } } }
  );
  return { actualizados: updatedCount };
};

module.exports = {
  getAllCursos,
  addNewCurso,
  getCursoById,
  updateExistingCurso,
  removeCurso,
  changeCursoEstado,
  getCursoEstadisticas,
  findCursosBySenceCode,
  getParticipantesResumen,
  updateMultipleParticipantes,
  getDeclaracionesJuradasByCurso,
  getCursosSincronizadosConDetalles,
  changeCursoSenceEstado,
  manualSenceSync,
  updateCertificadosParticipantes,
}; 