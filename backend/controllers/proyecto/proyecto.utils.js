/**
 * Utilidades para los controladores de Proyectos
 */
const { Proyecto, Cliente, Usuario, Rol, Permiso, CostoProyecto, sequelize, AvanceProyecto, HitoProyecto, Curso, Venta, DetalleVenta, Ingreso, Egreso, Comision } = require('../../models');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');

/**
 * Verifica si un usuario tiene permisos para ver todos los proyectos
 * @param {Object} req - Objeto request
 * @returns {Promise<boolean>} - Verdadero si puede ver todos, falso si solo puede ver sus proyectos
 */
exports.verificarPermisosVisualizacion = async (req) => {
  const userId = req.usuario.id;
  let puedeVerTodos = false;

  // 1. Verificar si es Admin
  if (req.usuario.rol === 'administrador') {
    puedeVerTodos = true;
    console.log(`[verificarPermisosVisualizacion] Usuario ${userId} es admin. Viendo todos.`);
  } else {
    // 2. Si no es admin, verificar permiso 'proyectos:read:all'
    console.log(`[verificarPermisosVisualizacion] Usuario ${userId} no es admin. Verificando permiso 'proyectos:read:all'...`);
    // Necesitamos cargar los permisos del rol del usuario
    const rolUsuario = await Rol.findOne({
      where: { nombre: req.usuario.rol },
      include: [{
        model: Permiso,
        as: 'permisos',
        attributes: ['codigo'],
        through: { attributes: [] }
      }]
    });
    
    const permisosUsuario = rolUsuario?.permisos?.map(p => p.codigo) || [];
    console.log(`[verificarPermisosVisualizacion] Permisos encontrados:`, permisosUsuario);
    
    if (permisosUsuario.includes('proyectos:read:all')) {
      puedeVerTodos = true;
      console.log(`[verificarPermisosVisualizacion] Usuario ${userId} tiene permiso 'proyectos:read:all'. Viendo todos.`);
    } else {
      console.log(`[verificarPermisosVisualizacion] Usuario ${userId} NO tiene permiso 'proyectos:read:all'. Filtrando por responsable.`);
    }
  }
  
  return puedeVerTodos;
};

/**
 * Exporta los modelos comúnmente usados por los controladores de proyectos
 */
exports.models = {
  Proyecto,
  Cliente,
  Usuario,
  Rol,
  Permiso,
  CostoProyecto,
  sequelize,
  AvanceProyecto,
  HitoProyecto,
  Curso,
  Venta,
  DetalleVenta,
  Ingreso,
  Egreso,
  Comision
};

/**
 * Exporta operadores de Sequelize
 */
exports.Op = Op;
exports.Sequelize = Sequelize; 