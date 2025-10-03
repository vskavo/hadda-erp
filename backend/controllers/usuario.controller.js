const { Usuario, Rol, Permiso, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');
const crypto = require('crypto');

// Obtener todos los usuarios
exports.findAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    
    // Mapeo de nombres de columnas para ordenamiento
    const columnMap = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'ultimoLogin': 'ultimo_login',
      'fechaBloqueo': 'fecha_bloqueo',
      'requiereCambioPassword': 'requiere_cambio_password',
      'tokenRecuperacion': 'token_recuperacion',
      'fechaExpiracionToken': 'fecha_expiracion_token',
      'ultimaIp': 'ultima_ip',
      'imagenPerfil': 'imagen_perfil'
    };
    
    // Si el sortBy está en formato camelCase, convertirlo a snake_case
    const orderColumn = columnMap[sortBy] || sortBy;
    
    // Construir condiciones de búsqueda
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { apellido: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereConditions.rol = role;
    }
    
    // Ejecutar la consulta
    const { count, rows: usuarios } = await Usuario.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ['password'] }, // No devolver el password
      include: [
        {
          model: Rol,
          as: 'Rol',  // Usar el alias definido en models/index.js
          attributes: ['nombre', 'descripcion']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [[orderColumn, sortOrder]]
    });
    
    // Transformar los datos para adaptarlos al formato esperado por el frontend
    const usuariosFormateados = usuarios.map(usuario => {
      const usuarioJson = usuario.toJSON();
      return {
        ...usuarioJson,
        role: usuarioJson.Rol?.nombre || null,
        createdAt: usuarioJson.created_at,
        updatedAt: usuarioJson.updated_at
      };
    });
    
    res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      usuarios: usuariosFormateados
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// Obtener un usuario por ID
exports.findOne = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

// Crear un nuevo usuario
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { nombre, apellido, email, password, role: rolNombre, rut, telefono, direccion, activo } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({ 
      where: { email },
      transaction: t
    });
    
    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ message: 'Ya existe un usuario con este email' });
    }

    // Buscar el ID del rol basado en el nombre recibido
    let rolIdParaGuardar = null;
    let rolNombreParaCorreo = 'usuario';
    if (rolNombre) {
      const rolEncontrado = await Rol.findOne({ 
        where: { nombre: rolNombre },
        attributes: ['id', 'nombre'], // Solo necesitamos el ID y nombre
        transaction: t
      });
      if (!rolEncontrado) {
        await t.rollback();
        // Asignaremos rol 'usuario' por defecto si no se encuentra
        console.warn(`Rol "${rolNombre}" no encontrado. Asignando rol por defecto.`);
        const rolPorDefecto = await Rol.findOne({ where: { nombre: 'usuario' }, attributes: ['id', 'nombre'], transaction: t });
        if (rolPorDefecto) {
          rolIdParaGuardar = rolPorDefecto.id;
          rolNombreParaCorreo = rolPorDefecto.nombre;
        } else {
          await t.rollback();
          return res.status(500).json({ message: 'No se pudo encontrar el rol especificado ni el rol por defecto.' });
        }
      } else {
        rolIdParaGuardar = rolEncontrado.id;
        rolNombreParaCorreo = rolEncontrado.nombre;
      }
    } else {
        // Si no se envía rol, asignar rol 'usuario' por defecto
        console.warn(`No se especificó rol. Asignando rol por defecto.`);
        const rolPorDefecto = await Rol.findOne({ where: { nombre: 'usuario' }, attributes: ['id', 'nombre'], transaction: t });
        if (rolPorDefecto) {
          rolIdParaGuardar = rolPorDefecto.id;
          rolNombreParaCorreo = rolPorDefecto.nombre;
        } else {
          await t.rollback();
          return res.status(500).json({ message: 'No se pudo encontrar el rol por defecto.' });
        }
    }
    
    // Generar token de recuperación y expiración (válido por 24 horas)
    const token_recuperacion = crypto.randomBytes(32).toString('hex');
    const fecha_expiracion_token = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Crear nuevo usuario usando rol_id y requiere_cambio_password en true
    const newUser = await Usuario.create({
      nombre,
      apellido,
      email,
      password,
      rol_id: rolIdParaGuardar, // Usar rol_id
      rut,
      telefono,
      direccion,
      activo: activo !== undefined ? activo : true,
      requiere_cambio_password: true,
      token_recuperacion,
      fecha_expiracion_token
    }, { transaction: t });
    
    await t.commit();
    
    // No devolver el password en la respuesta
    const userResponse = newUser.toJSON();
    delete userResponse.password;
    
    // Obtener el nombre del rol para la respuesta (opcional pero bueno para el frontend)
    userResponse.rol = rolNombreParaCorreo;
    delete userResponse.rol_id; // No exponer rol_id en la respuesta

    // Enviar correo de bienvenida con enlace para crear contraseña
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/recuperar/${token_recuperacion}`;
    const emailEnviado = await emailService.enviarCorreo({
      to: email,
      subject: 'Bienvenido a Hadda - ERP - Crea tu contraseña',
      template: 'bienvenida',
      data: {
        nombre,
        linkActivacion: resetUrl,
        año: new Date().getFullYear()
      }
    });
    
    res.status(201).json({
      message: 'Usuario creado exitosamente. Se ha enviado un correo para crear la contraseña.',
      usuario: userResponse
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// Actualizar un usuario por ID
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  console.log(`[DEBUG] Iniciando actualización para usuario ID: ${req.params.id}`); // Log inicio
  try {
    const { nombre, apellido, email, password, role: rolNombre, rut, telefono, direccion, activo } = req.body;
    const userId = req.params.id;
    
    console.log(`[DEBUG] Rol recibido del frontend (rolNombre): ${rolNombre}`); // Log rol recibido
    
    const usuario = await Usuario.findByPk(userId, { transaction: t });
    
    if (!usuario) {
      await t.rollback();
      console.log(`[DEBUG] Usuario ID: ${userId} no encontrado.`); // Log no encontrado
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar que el email no esté en uso por otro usuario
    if (email && email !== usuario.email) {
      const existingUser = await Usuario.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: userId }
        },
        transaction: t
      });
      
      if (existingUser) {
        await t.rollback();
        return res.status(400).json({ message: 'Este email ya está en uso por otro usuario' });
      }
    }
    
    // Buscar el ID del rol si se proporcionó un nombre de rol
    let rolIdParaActualizar = usuario.rol_id; // Mantener el rol actual por defecto
    console.log(`[DEBUG] rol_id actual del usuario: ${rolIdParaActualizar}`); // Log rol ID actual
    if (rolNombre) { 
      console.log(`[DEBUG] Buscando Rol con nombre: "${rolNombre}"`); // Log inicio búsqueda rol
      const rolEncontrado = await Rol.findOne({ 
        where: { nombre: rolNombre },
        attributes: ['id'],
        transaction: t
      });
      if (!rolEncontrado) {
        await t.rollback();
        console.log(`[DEBUG] Rol "${rolNombre}" no encontrado en la BD.`); // Log rol no encontrado
        return res.status(400).json({ message: `Rol "${rolNombre}" no encontrado.` });
      } 
      rolIdParaActualizar = rolEncontrado.id;
      console.log(`[DEBUG] Rol encontrado. ID a actualizar: ${rolIdParaActualizar}`); // Log ID encontrado
    } else {
      console.log(`[DEBUG] No se proporcionó rolNombre. No se buscará ni actualizará el rol.`); // Log si no vino rolNombre
    }
    
    // Actualizar datos del usuario
    const updateData = {
      ...(nombre && { nombre }),
      ...(apellido && { apellido }),
      ...(email && { email }),
      // Actualizar rol_id solo si se encontró uno nuevo Y rolNombre fue proporcionado
      ...(rolNombre && { rol_id: rolIdParaActualizar }), 
      ...(rut && { rut }),
      ...(telefono && { telefono }),
      ...(direccion && { direccion }),
      ...(activo !== undefined && { activo })
    };
    
    // Si hay una nueva contraseña, hashearla
    if (password) {
      console.log(`[DEBUG] Se proporcionó nueva contraseña. Hasheando...`); // Log hash password
      updateData.password = password;
    }
    
    console.log(`[DEBUG] Objeto updateData final antes de llamar a usuario.update():`, updateData); // Log final updateData
    
    await usuario.update(updateData, { transaction: t });
    console.log(`[DEBUG] usuario.update() ejecutado.`); // Log después de update
    
    await t.commit();
    console.log(`[DEBUG] Transacción commit ejecutada.`); // Log después de commit
    
    // Obtener usuario actualizado con el nombre del rol
    const updatedUser = await Usuario.findByPk(userId, {
      attributes: { exclude: ['password', 'rol_id'] }, // Excluir password y rol_id
      include: [{ model: Rol, as: 'Rol', attributes: ['nombre'] }] // Incluir nombre del rol
    });

    // Reestructurar la respuesta para que el rol esté en el nivel superior
    const userResponse = updatedUser.toJSON();
    if (userResponse.Rol) {
        userResponse.rol = userResponse.Rol.nombre;
        delete userResponse.Rol;
    }
    
    res.status(200).json({
      message: 'Usuario actualizado exitosamente',
      usuario: userResponse
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// Eliminar un usuario (desactivar)
exports.delete = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.params.id;
    const usuario = await Usuario.findByPk(userId, { transaction: t });
    
    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // En lugar de eliminar físicamente, desactivamos el usuario
    await usuario.update({ activo: false }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({ message: 'Error al desactivar usuario', error: error.message });
  }
};

// Eliminar físicamente un usuario (solo para administradores)
exports.hardDelete = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.params.id;
    const usuario = await Usuario.findByPk(userId, { transaction: t });
    
    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar si el usuario que realiza la petición es administrador
    if (req.usuario.rol !== 'administrador') {
      await t.rollback();
      return res.status(403).json({ message: 'No tiene permisos para realizar esta acción' });
    }
    
    await usuario.destroy({ transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Usuario eliminado permanentemente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

// Cambiar rol de usuario
exports.changeRole = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { rol } = req.body;
    const userId = req.params.id;
    
    if (!rol) {
      await t.rollback();
      return res.status(400).json({ message: 'El rol es requerido' });
    }
    
    const usuario = await Usuario.findByPk(userId, { transaction: t });
    
    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar que el rol sea válido (esto depende del modelo)
    const rolesValidos = ['administrador', 'supervisor', 'operador', 'usuario', 'financiero'];
    if (!rolesValidos.includes(rol)) {
      await t.rollback();
      return res.status(400).json({ message: 'Rol no válido' });
    }
    
    await usuario.update({ rol }, { transaction: t });
    
    await t.commit();
    
    const updatedUser = await Usuario.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({
      message: 'Rol actualizado exitosamente',
      usuario: updatedUser
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al cambiar rol de usuario:', error);
    res.status(500).json({ message: 'Error al cambiar rol', error: error.message });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;
    
    // Si el usuario es administrador, solo requerimos newPassword
    if (req.usuario.rol === 'administrador') {
      if (!newPassword) {
        await t.rollback();
        return res.status(400).json({ 
          message: 'Se requiere la nueva contraseña' 
        });
      }
    } else {
      // Si no es admin, requerimos ambos campos
      if (!currentPassword || !newPassword) {
        await t.rollback();
        return res.status(400).json({ 
          message: 'Se requieren la contraseña actual y la nueva contraseña' 
        });
      }
    }
    
    // Verificar que el usuario exista
    const usuario = await Usuario.findByPk(userId);
    
    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar que el usuario que hace la petición sea el mismo usuario o un administrador
    if (req.usuario.id.toString() !== userId && req.usuario.rol !== 'administrador') {
      await t.rollback();
      return res.status(403).json({ 
        message: 'No tiene permisos para cambiar la contraseña de este usuario' 
      });
    }
    
    // Verificar la contraseña actual (si no es administrador)
    if (req.usuario.rol !== 'administrador') {
      const isMatch = await bcrypt.compare(currentPassword, usuario.password);
      if (!isMatch) {
        await t.rollback();
        return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      }
    }
    
    // Actualizar la contraseña
    await usuario.update({ password: newPassword }, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    await t.rollback();
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar contraseña', error: error.message });
  }
};

// Obtener perfil del usuario actual
exports.getProfile = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
};

// Actualizar perfil del usuario actual
exports.updateProfile = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { nombre, apellido, telefono, direccion } = req.body;
    const userId = req.usuario.id;
    
    const usuario = await Usuario.findByPk(userId, { transaction: t });
    
    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Actualizar datos del perfil
    const updateData = {
      ...(nombre && { nombre }),
      ...(apellido && { apellido }),
      ...(telefono && { telefono }),
      ...(direccion && { direccion })
    };
    
    await usuario.update(updateData, { transaction: t });
    
    await t.commit();
    
    const updatedUser = await Usuario.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      usuario: updatedUser
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
};

// Obtener perfil del usuario actual (adaptado de auth.controller)
exports.getPerfilUsuarioActual = async (req, res) => {
  try {
    // req.usuario ya tiene id, email, rol (nombre) del token gracias a 'autenticar'
    if (!req.usuario) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    // Podríamos buscar más detalles si fuera necesario, pero por ahora devolvemos lo del token
    res.status(200).json({ usuario: req.usuario }); 
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
};

// Actualizar perfil del usuario actual (adaptado de auth.controller)
exports.updatePerfilUsuarioActual = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nombre, apellido, email, password } = req.body;
    const userId = req.usuario.id; // Obtener ID del usuario autenticado

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const usuario = await Usuario.findByPk(userId, { transaction: t });

    if (!usuario) {
       await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que el email no esté en uso por otro usuario si se cambia
    if (email && email !== usuario.email) {
      const existingUser = await Usuario.findOne({ 
        where: { email, id: { [Op.ne]: userId } },
        transaction: t
      });
      if (existingUser) {
        await t.rollback();
        return res.status(400).json({ message: 'Este email ya está en uso por otro usuario' });
      }
    }

    // Actualizar datos
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (apellido) updateData.apellido = apellido;
    if (email) updateData.email = email;
    // La contraseña se hashea automáticamente con el hook beforeUpdate
    if (password) updateData.password = password; 

    await usuario.update(updateData, { transaction: t });
    await t.commit();

    // Devolver datos actualizados (sin password)
    const perfilActualizado = { ...usuario.toJSON(), ...updateData };
    delete perfilActualizado.password;
    // Asegurarse de devolver el nombre del rol correcto
    perfilActualizado.rol = req.usuario.rol;

    res.json({
      message: 'Perfil actualizado exitosamente',
      usuario: perfilActualizado
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
};

// NUEVA FUNCIÓN: Obtener los códigos de permiso del usuario actual
exports.getMisPermisos = async (req, res) => {
  try {
    const nombreRolUsuario = req.usuario.rol;

    if (!nombreRolUsuario) {
      console.error('[getMisPermisos] No se encontró el rol en req.usuario');
      return res.status(403).json({ message: 'Rol de usuario no identificado.' });
    }

    // Buscar el Rol por su nombre e incluir sus permisos
    const rolConPermisos = await Rol.findOne({
      where: { nombre: nombreRolUsuario },
      include: [{
        model: Permiso,
        as: 'permisos', // Usar el alias definido en models/index.js
        attributes: ['codigo'], // Solo necesitamos el código del permiso
        through: { attributes: [] } // No incluir la tabla intermedia
      }]
    });

    if (!rolConPermisos || !rolConPermisos.permisos) {
      // Si el rol no se encuentra o no tiene permisos asociados, devolver array vacío
      console.warn(`[getMisPermisos] Rol "${nombreRolUsuario}" no encontrado o sin permisos.`);
      return res.json({ permisos: [] });
    }

    // Extraer solo los códigos de permiso
    const codigosPermiso = rolConPermisos.permisos.map(p => p.codigo);

    res.json({ permisos: codigosPermiso });

  } catch (error) {
    console.error('Error al obtener permisos del usuario:', error);
    res.status(500).json({ message: 'Error al obtener permisos', error: error.message });
  }
}; 