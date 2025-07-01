const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Registro de nuevo usuario
exports.register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    // Crear nuevo usuario
    const usuario = await Usuario.create({
      nombre,
      apellido,
      email,
      password,
      rol: rol || 'usuario'
    });

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Responder con datos del usuario (sin password) y token
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
      },
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

// Inicio de sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`Intento de login para: ${email}`);
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Modificamos la consulta para incluir un JOIN con la tabla de roles
    const usuario = await Usuario.findOne({ 
      where: { email },
      attributes: ['id', 'nombre', 'apellido', 'email', 'password', 'rol_id', 'activo'],
      include: [
        {
          model: require('../models').Rol,
          as: 'Rol',
          attributes: ['id', 'nombre']
        }
      ],
      raw: false // Necesitamos los métodos del modelo para comparePassword
    });
    
    if (!usuario) {
      console.log(`Usuario no encontrado: ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Verificar si el usuario está activo
    if (usuario.activo === false) {
      console.log(`Usuario desactivado: ${email}`);
      return res.status(401).json({ message: 'Usuario desactivado. Contacte al administrador.' });
    }

    // Verificar la contraseña (descomenta esta sección para producción)
    const passwordValida = await usuario.comparePassword(password);
    if (!passwordValida) {
      console.log(`Contraseña inválida para: ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // SOLUCIÓN TEMPORAL: Para pruebas, aceptar cualquier contraseña
    // let passwordValida = true;
    
    // Obtener el nombre del rol desde la relación
    const rolNombre = usuario.Rol ? usuario.Rol.nombre : 'usuario';
    console.log(`DEPURACIÓN - Rol obtenido de la BD: ${rolNombre}`);
    
    // Generar token JWT con duración de 24 horas, usando el nombre del rol en lugar del ID
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        rol: rolNombre // Usamos el nombre del rol en lugar del ID
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    /* COMENTAMOS ESTA PARTE QUE CAUSA PROBLEMAS DE CONEXIÓN
    // Actualizar último login en segundo plano, sin esperar que termine
    Usuario.update(
      { ultimo_login: new Date() }, 
      { where: { id: usuario.id } }
    ).catch(err => console.error('Error al actualizar último login (no crítico):', err));
    */
    
    // Información de depuración sobre el rol
    console.log(`DEPURACIÓN - Tipo de rol_id: ${typeof usuario.rol_id}`);
    console.log(`DEPURACIÓN - Valor de rol_id: ${usuario.rol_id}`);
    console.log(`DEPURACIÓN - Nombre del rol: ${rolNombre}`);
    
    // Datos del usuario para respuesta (sin contraseña)
    const userResponse = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: rolNombre // Enviamos el nombre del rol en lugar del ID
    };
    
    console.log(`DEPURACIÓN - Enviando respuesta de login para ${email}:`, userResponse);
    
    // Responder con datos del usuario y token
    res.json({
      message: 'Inicio de sesión exitoso',
      usuario: userResponse,
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      message: 'Error al iniciar sesión', 
      error: error.message
    });
  }
};

// Obtener perfil del usuario actual
exports.getPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: { exclude: ['password'] }
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ usuario });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
};

// Actualizar perfil del usuario
exports.updatePerfil = async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;
    const usuario = await Usuario.findByPk(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar datos
    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;
    if (email) usuario.email = email;
    if (password) usuario.password = password;

    await usuario.save();

    res.json({
      message: 'Perfil actualizado exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
};

// Cerrar sesión del usuario
exports.logout = async (req, res) => {
  try {
    // En un sistema basado en JWT, el cierre de sesión se maneja principalmente en el cliente
    // eliminando el token, pero aquí podemos añadir lógica adicional si es necesario
    
    // Opcional: Actualizar último logout en la base de datos
    if (req.usuario && req.usuario.id) {
      await Usuario.update(
        { ultimo_logout: new Date() },
        { where: { id: req.usuario.id } }
      );
    }
    
    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ message: 'Error al cerrar sesión', error: error.message });
  }
};

// Recuperación de contraseña - Solicitud
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'El email es requerido' });
    }
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      // Por seguridad, no revelar si el email existe o no
      return res.status(200).json({ message: 'Si el correo está registrado, se enviará un email con instrucciones.' });
    }
    // Generar token seguro y expiración (15 minutos)
    const token = require('crypto').randomBytes(32).toString('hex');
    const fechaExpiracion = new Date(Date.now() + 15 * 60 * 1000);
    usuario.token_recuperacion = token;
    usuario.fecha_expiracion_token = fechaExpiracion;
    await usuario.save();
    // Enviar email con enlace
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
    const emailService = require('../services/email.service');
    await emailService.enviarCorreoConPlantilla({
      to: usuario.email,
      subject: 'Recuperación de contraseña',
      templateName: 'recuperacion-password',
      data: {
        nombre: usuario.nombre,
        resetUrl,
        minutos: 15
      }
    });
    return res.status(200).json({ message: 'Si el correo está registrado, se enviará un email con instrucciones.' });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud', error: error.message });
  }
};

// Validar token de recuperación
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const usuario = await Usuario.findOne({ where: { token_recuperacion: token } });
    if (!usuario || !usuario.fecha_expiracion_token || usuario.fecha_expiracion_token < new Date()) {
      return res.status(400).json({ message: 'El enlace de restablecimiento es inválido o ha expirado.' });
    }
    return res.status(200).json({ message: 'Token válido' });
  } catch (error) {
    console.error('Error en validateResetToken:', error);
    res.status(500).json({ message: 'Error al validar el token', error: error.message });
  }
};

// Restablecer contraseña usando token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'La nueva contraseña es requerida' });
    }
    const usuario = await Usuario.findOne({ where: { token_recuperacion: token } });
    if (!usuario || !usuario.fecha_expiracion_token || usuario.fecha_expiracion_token < new Date()) {
      return res.status(400).json({ message: 'El enlace de restablecimiento es inválido o ha expirado.' });
    }
    usuario.password = password;
    usuario.token_recuperacion = null;
    usuario.fecha_expiracion_token = null;
    await usuario.save();
    return res.status(200).json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña', error: error.message });
  }
}; 