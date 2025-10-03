const { Usuario, Rol, Permiso } = require('../models');

// Middleware para verificar si el usuario es administrador
exports.esAdministrador = async (req, res, next) => {
  try {
    // Simplificamos la consulta para evitar el error con la columna modulo
    const usuario = await Usuario.findByPk(req.usuario.id, {
      include: [{
        model: Rol,
        as: 'Rol',
        attributes: ['id', 'nombre']
      }]
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!usuario.Rol) {
      return res.status(403).json({ message: 'No tiene permisos suficientes' });
    }

    // Verificar si el rol es administrador o superadmin por su nombre
    const rolNormalizado = usuario.Rol.nombre.toLowerCase();
    if (rolNormalizado === 'administrador' || rolNormalizado === 'superadmin') {
      return next();
    }

    // Si no es administrador por nombre, verificamos si tiene el permiso específico
    if (usuario.Rol.id) {
      // Consulta separada para verificar si tiene el permiso específico
      const rolConPermisos = await Rol.findByPk(usuario.Rol.id, {
        include: [{
          model: Permiso,
          as: 'permisos',
          attributes: ['codigo'],
          through: { attributes: [] }
        }]
      });
      
      if (rolConPermisos && 
          rolConPermisos.permisos && 
          rolConPermisos.permisos.some(p => p.codigo === 'ADMIN_FULL_ACCESS')) {
        return next();
      }
    }

    return res.status(403).json({ message: 'No tiene permisos de administrador' });
  } catch (error) {
    console.error('Error al verificar rol de administrador:', error);
    return res.status(500).json({ message: 'Error al verificar permisos', error: error.message });
  }
};

// Middleware para verificar si el usuario es financiero o superior
exports.esFinanciero = async (req, res, next) => {
  try {
    // Simplificamos la consulta para evitar el error con la columna modulo
    const usuario = await Usuario.findByPk(req.usuario.id, {
      include: [{
        model: Rol,
        as: 'Rol',
        attributes: ['id', 'nombre']
      }]
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!usuario.Rol) {
      return res.status(403).json({ message: 'No tiene permisos suficientes' });
    }

    // Verificar si el rol es administrador o financiero por su nombre
    if (usuario.Rol.nombre.toLowerCase() === 'administrador' || usuario.Rol.nombre.toLowerCase() === 'financiero') {
      return next();
    }

    // Si no tiene el rol adecuado por nombre, verificamos si tiene el permiso específico
    if (usuario.Rol.id) {
      // Consulta separada para verificar si tiene el permiso específico
      const rolConPermisos = await Rol.findByPk(usuario.Rol.id, {
        include: [{
          model: Permiso,
          as: 'permisos',
          attributes: ['codigo'],
          through: { attributes: [] }
        }]
      });
      
      if (rolConPermisos && 
          rolConPermisos.permisos && 
          rolConPermisos.permisos.some(p => p.codigo === 'FINANZAS_ACCESS')) {
        return next();
      }
    }

    return res.status(403).json({ message: 'No tiene permisos financieros' });
  } catch (error) {
    console.error('Error al verificar rol financiero:', error);
    return res.status(500).json({ message: 'Error al verificar permisos', error: error.message });
  }
};

// Middleware para verificar si el usuario es supervisor o superior
exports.esSupervisor = async (req, res, next) => {
  try {
    // Simplificamos la consulta para evitar el error con la columna modulo
    const usuario = await Usuario.findByPk(req.usuario.id, {
      include: [{
        model: Rol,
        as: 'Rol',
        attributes: ['id', 'nombre']
      }]
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!usuario.Rol) {
      return res.status(403).json({ message: 'No tiene permisos suficientes' });
    }

    // Verificar si el rol es administrador, superadmin o supervisor por su nombre
    const rolNormalizado = usuario.Rol.nombre.toLowerCase();
    if (rolNormalizado === 'administrador' || rolNormalizado === 'superadmin' || rolNormalizado === 'supervisor') {
      return next();
    }

    // Si no tiene el rol adecuado por nombre, verificamos si tiene el permiso específico
    if (usuario.Rol.id) {
      // Consulta separada para verificar si tiene el permiso específico
      const rolConPermisos = await Rol.findByPk(usuario.Rol.id, {
        include: [{
          model: Permiso,
          as: 'permisos',
          attributes: ['codigo'],
          through: { attributes: [] }
        }]
      });
      
      if (rolConPermisos && 
          rolConPermisos.permisos && 
          rolConPermisos.permisos.some(p => p.codigo === 'SUPERVISION_ACCESS')) {
        return next();
      }
    }

    return res.status(403).json({ message: 'No tiene permisos de supervisor' });
  } catch (error) {
    console.error('Error al verificar rol de supervisor:', error);
    return res.status(500).json({ message: 'Error al verificar permisos', error: error.message });
  }
};

// Middleware genérico para verificar permiso específico
exports.tienePermiso = (codigoPermiso) => {
  return async (req, res, next) => {
    console.log(`[DEBUG][tienePermiso] Verificando permiso: "${codigoPermiso}" para usuario ID: ${req.usuario?.id}`); // Log inicio
    try {
      // Simplificamos la consulta para evitar el error con la columna modulo
      const usuario = await Usuario.findByPk(req.usuario.id, {
        include: [{
          model: Rol,
          as: 'Rol',
          attributes: ['id', 'nombre']
        }]
      });

      if (!usuario) {
        console.log(`[DEBUG][tienePermiso] Usuario no encontrado.`);
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (!usuario.Rol) {
        console.log(`[DEBUG][tienePermiso] Rol no encontrado para el usuario.`);
        return res.status(403).json({ message: 'No tiene permisos suficientes' });
      }

      const nombreRolUsuario = usuario.Rol.nombre;
      const idRolUsuario = usuario.Rol.id;
      console.log(`[DEBUG][tienePermiso] Rol del usuario: "${nombreRolUsuario}" (ID: ${idRolUsuario})`);

      // Si es administrador o superadmin, permitimos acceso a todo
      const rolNormalizado = nombreRolUsuario.toLowerCase();
      if (rolNormalizado === 'administrador' || rolNormalizado === 'superadmin') {
        console.log(`[DEBUG][tienePermiso] Usuario es administrador/superadmin. Permitiendo acceso.`);
        return next();
      }

      // Si no es administrador, verificamos si tiene el permiso específico
      if (idRolUsuario) {
        console.log(`[DEBUG][tienePermiso] Buscando permisos para Rol ID: ${idRolUsuario}`);
        const rolConPermisos = await Rol.findByPk(idRolUsuario, {
          include: [{
            model: Permiso,
            as: 'permisos',
            attributes: ['codigo'], // Solo necesitamos el código
            through: { attributes: [] }
          }]
        });
        
        // Loguear los permisos encontrados
        const permisosEncontrados = rolConPermisos?.permisos?.map(p => p.codigo) || [];
        console.log(`[DEBUG][tienePermiso] Permisos encontrados para el rol:`, permisosEncontrados);
        
        // Si tiene ADMIN_FULL_ACCESS, dar acceso total
        if (permisosEncontrados.includes('ADMIN_FULL_ACCESS')) {
          console.log(`[DEBUG][tienePermiso] Usuario tiene ADMIN_FULL_ACCESS. Permitiendo acceso.`);
          return next();
        }
        
        // Realizar la verificación del permiso específico
        const tieneElPermiso = permisosEncontrados.includes(codigoPermiso);
        console.log(`[DEBUG][tienePermiso] ¿Tiene el permiso "${codigoPermiso}"? ${tieneElPermiso}`);

        if (tieneElPermiso) {
          console.log(`[DEBUG][tienePermiso] Permiso concedido.`);
          return next();
        }
      } else {
        console.log(`[DEBUG][tienePermiso] No se pudo obtener el ID del rol para buscar permisos.`);
      }

      // Si llegamos aquí, no tiene el permiso
      console.log(`[DEBUG][tienePermiso] Permiso "${codigoPermiso}" denegado.`);
      return res.status(403).json({ 
        message: `No tiene el permiso requerido: ${codigoPermiso}` 
      });
    } catch (error) {
      console.error(`[DEBUG][tienePermiso] Error al verificar permiso ${codigoPermiso}:`, error);
      return res.status(500).json({ message: 'Error al verificar permisos', error: error.message });
    }
  };
}; 