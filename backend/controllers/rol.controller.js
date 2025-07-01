const { Rol, Permiso, RolPermiso, sequelize } = require('../models');

// Obtener todos los roles
exports.findAllRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      include: [{
        model: Permiso,
        as: 'permisos',
        through: { attributes: [] } // No incluir atributos de la tabla intermedia
      }]
    });
    
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ message: 'Error al obtener roles', error: error.message });
  }
};

// Obtener un rol por ID
exports.findRolById = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id, {
      include: [{
        model: Permiso,
        as: 'permisos',
        through: { attributes: [] }
      }]
    });
    
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    
    res.status(200).json(rol);
  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({ message: 'Error al obtener rol', error: error.message });
  }
};

// Crear un nuevo rol
exports.createRol = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { nombre, descripcion, permisos } = req.body;
    
    // Validar que el nombre es único
    const rolExistente = await Rol.findOne({ 
      where: { nombre },
      transaction: t
    });
    
    if (rolExistente) {
      await t.rollback();
      return res.status(400).json({ message: 'Ya existe un rol con este nombre' });
    }
    
    // Crear el rol
    const nuevoRol = await Rol.create({
      nombre,
      descripcion
    }, { transaction: t });
    
    // Asociar permisos si se proporcionaron
    if (permisos && permisos.length > 0) {
      // Verificar que todos los permisos existan
      const permisosExistentes = await Permiso.findAll({
        where: { id: permisos },
        transaction: t
      });
      
      if (permisosExistentes.length !== permisos.length) {
        await t.rollback();
        return res.status(404).json({ message: 'Uno o más permisos no existen' });
      }
      
      // Asociar permisos al rol
      await nuevoRol.addPermisos(permisosExistentes, { transaction: t });
    }
    
    await t.commit();
    
    // Obtener el rol con sus permisos
    const rolCreado = await Rol.findByPk(nuevoRol.id, {
      include: [{
        model: Permiso,
        as: 'permisos',
        through: { attributes: [] }
      }]
    });
    
    res.status(201).json({
      message: 'Rol creado exitosamente',
      rol: rolCreado
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear rol:', error);
    res.status(500).json({ message: 'Error al crear rol', error: error.message });
  }
};

// Actualizar un rol
exports.updateRol = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { nombre, descripcion, permisos } = req.body;
    const rolId = req.params.id;
    
    // Verificar que el rol exista
    const rol = await Rol.findByPk(rolId, { transaction: t });
    
    if (!rol) {
      await t.rollback();
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    
    // Verificar que el nombre sea único si se está actualizando
    if (nombre && nombre !== rol.nombre) {
      const rolExistente = await Rol.findOne({
        where: { 
          nombre,
          id: { [sequelize.Op.ne]: rolId }
        },
        transaction: t
      });
      
      if (rolExistente) {
        await t.rollback();
        return res.status(400).json({ message: 'Ya existe otro rol con este nombre' });
      }
    }
    
    // Actualizar el rol
    await rol.update({
      ...(nombre && { nombre }),
      ...(descripcion && { descripcion })
    }, { transaction: t });
    
    // Actualizar permisos si se proporcionaron
    if (permisos) {
      // Verificar que todos los permisos existan
      const permisosExistentes = await Permiso.findAll({
        where: { id: permisos },
        transaction: t
      });
      
      if (permisosExistentes.length !== permisos.length) {
        await t.rollback();
        return res.status(404).json({ message: 'Uno o más permisos no existen' });
      }
      
      // Reemplazar todos los permisos actuales
      await rol.setPermisos(permisosExistentes, { transaction: t });
    }
    
    await t.commit();
    
    // Obtener el rol actualizado con sus permisos
    const rolActualizado = await Rol.findByPk(rolId, {
      include: [{
        model: Permiso,
        as: 'permisos',
        through: { attributes: [] }
      }]
    });
    
    res.status(200).json({
      message: 'Rol actualizado exitosamente',
      rol: rolActualizado
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ message: 'Error al actualizar rol', error: error.message });
  }
};

// Eliminar un rol
exports.deleteRol = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const rolId = req.params.id;
    
    // Verificar que el rol exista
    const rol = await Rol.findByPk(rolId, { transaction: t });
    
    if (!rol) {
      await t.rollback();
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    
    // Verificar si es un rol del sistema (no eliminable)
    if (rol.sistema) {
      await t.rollback();
      return res.status(403).json({ 
        message: 'No se puede eliminar un rol del sistema' 
      });
    }
    
    // Eliminar el rol
    await rol.destroy({ transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Rol eliminado exitosamente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar rol:', error);
    res.status(500).json({ message: 'Error al eliminar rol', error: error.message });
  }
};

// Obtener todos los permisos
exports.findAllPermisos = async (req, res) => {
  try {
    const permisos = await Permiso.findAll({
      order: [['modulo', 'ASC'], ['nombre', 'ASC']]
    });
    
    res.status(200).json(permisos);
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({ message: 'Error al obtener permisos', error: error.message });
  }
};

// Obtener un permiso por ID
exports.findPermisoById = async (req, res) => {
  try {
    const permiso = await Permiso.findByPk(req.params.id);
    
    if (!permiso) {
      return res.status(404).json({ message: 'Permiso no encontrado' });
    }
    
    res.status(200).json(permiso);
  } catch (error) {
    console.error('Error al obtener permiso:', error);
    res.status(500).json({ message: 'Error al obtener permiso', error: error.message });
  }
};

// Crear un nuevo permiso
exports.createPermiso = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { nombre, descripcion, modulo, codigo } = req.body;
    
    // Validar que el código es único
    const permisoExistente = await Permiso.findOne({ 
      where: { codigo },
      transaction: t
    });
    
    if (permisoExistente) {
      await t.rollback();
      return res.status(400).json({ message: 'Ya existe un permiso con este código' });
    }
    
    // Crear el permiso
    const nuevoPermiso = await Permiso.create({
      nombre,
      descripcion,
      modulo,
      codigo
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).json({
      message: 'Permiso creado exitosamente',
      permiso: nuevoPermiso
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear permiso:', error);
    res.status(500).json({ message: 'Error al crear permiso', error: error.message });
  }
};

// Actualizar un permiso
exports.updatePermiso = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { nombre, descripcion, modulo, codigo } = req.body;
    const permisoId = req.params.id;
    
    // Verificar que el permiso exista
    const permiso = await Permiso.findByPk(permisoId, { transaction: t });
    
    if (!permiso) {
      await t.rollback();
      return res.status(404).json({ message: 'Permiso no encontrado' });
    }
    
    // Verificar si es un permiso del sistema (no modificable)
    if (permiso.sistema) {
      await t.rollback();
      return res.status(403).json({ 
        message: 'No se puede modificar un permiso del sistema' 
      });
    }
    
    // Verificar que el código sea único si se está actualizando
    if (codigo && codigo !== permiso.codigo) {
      const permisoExistente = await Permiso.findOne({
        where: { 
          codigo,
          id: { [sequelize.Op.ne]: permisoId }
        },
        transaction: t
      });
      
      if (permisoExistente) {
        await t.rollback();
        return res.status(400).json({ message: 'Ya existe otro permiso con este código' });
      }
    }
    
    // Actualizar el permiso
    await permiso.update({
      ...(nombre && { nombre }),
      ...(descripcion && { descripcion }),
      ...(modulo && { modulo }),
      ...(codigo && { codigo })
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Permiso actualizado exitosamente',
      permiso
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar permiso:', error);
    res.status(500).json({ message: 'Error al actualizar permiso', error: error.message });
  }
};

// Eliminar un permiso
exports.deletePermiso = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const permisoId = req.params.id;
    
    // Verificar que el permiso exista
    const permiso = await Permiso.findByPk(permisoId, { transaction: t });
    
    if (!permiso) {
      await t.rollback();
      return res.status(404).json({ message: 'Permiso no encontrado' });
    }
    
    // Verificar si es un permiso del sistema (no eliminable)
    if (permiso.sistema) {
      await t.rollback();
      return res.status(403).json({ 
        message: 'No se puede eliminar un permiso del sistema' 
      });
    }
    
    // Eliminar el permiso
    await permiso.destroy({ transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Permiso eliminado exitosamente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar permiso:', error);
    res.status(500).json({ message: 'Error al eliminar permiso', error: error.message });
  }
};

// Verificar si un usuario tiene un permiso específico
exports.checkPermiso = async (req, res) => {
  try {
    const { usuario_id, permiso_codigo } = req.body;
    
    if (!usuario_id || !permiso_codigo) {
      return res.status(400).json({ 
        message: 'Se requieren el ID de usuario y el código de permiso' 
      });
    }
    
    // Buscar el usuario con su rol
    const usuario = await Usuario.findByPk(usuario_id, {
      include: [{
        model: Rol,
        include: [{
          model: Permiso,
          as: 'permisos'
        }]
      }]
    });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar si el rol del usuario tiene el permiso
    const tienePermiso = usuario.Rol.permisos.some(
      permiso => permiso.codigo === permiso_codigo
    );
    
    res.status(200).json({
      tienePermiso
    });
  } catch (error) {
    console.error('Error al verificar permiso:', error);
    res.status(500).json({ message: 'Error al verificar permiso', error: error.message });
  }
}; 