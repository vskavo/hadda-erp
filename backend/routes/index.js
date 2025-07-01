const express = require('express');
const router = express.Router();
const { apiLimiter } = require('../middlewares/rateLimit.middleware');
const { autenticar } = require('../middlewares/auth.middleware');

// Importar rutas
try {
  console.log('Cargando rutas en index.js...');
  
  // Ruta de prueba para verificar que funciona
  router.get('/test', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
  });
  
  // Añadir ruta de usuario para compatibilidad con el frontend
  router.get('/users/me', autenticar, (req, res) => {
    console.log('Solicitud a /users/me recibida');
    console.log('Información del usuario en el token:', req.usuario);
    
    if (!req.usuario) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    // Convertir el valor de rol a string si es un número
    let rolValue = req.usuario.rol;
    if (typeof rolValue === 'number') {
      console.log('Convirtiendo rol de número a string');
      // Mapeo de roles numéricos a nombres (ajusta según tu sistema)
      const rolesMap = {
        1: 'administrador',
        2: 'gerencia',
        3: 'ventas',
        4: 'contabilidad',
        5: 'operaciones'
      };
      rolValue = rolesMap[rolValue] || 'usuario';
    }
    
    const userResponse = {
      id: req.usuario.id,
      nombre: req.usuario.nombre || 'Usuario',
      apellido: req.usuario.apellido || '',
      email: req.usuario.email,
      rol: rolValue
    };
    
    console.log('Respuesta enviada desde /users/me:', userResponse);
    
    res.json({ usuario: userResponse });
  });
  
  // Ruta de respaldo para clientes directamente en index.js
  router.post('/clientes-backup', (req, res) => {
    console.log('Cuerpo de la solicitud recibido en ruta de respaldo:', JSON.stringify(req.body));
    
    // Validación básica
    if (!req.body.razonSocial && !req.body.razon_social) {
      return res.status(400).json({ 
        message: 'Datos incompletos', 
        error: 'La razón social es obligatoria'
      });
    }
    
    if (!req.body.rut) {
      return res.status(400).json({ 
        message: 'Datos incompletos', 
        error: 'El RUT es obligatorio'
      });
    }
    
    // Crear cliente de prueba con un ID aleatorio
    const nuevoCliente = {
      id: Math.floor(Math.random() * 1000) + 1,
      razon_social: req.body.razonSocial || req.body.razon_social,
      rut: req.body.rut,
      giro: req.body.giro || '',
      direccion: req.body.direccion || '',
      telefono: req.body.telefono || '',
      email: req.body.email || '',
      estado: 'Activo',
      created_at: new Date().toISOString()
    };
    
    console.log('Cliente creado con ruta de respaldo:', nuevoCliente);
    
    res.status(201).json({
      status: 'success',
      message: 'Cliente creado exitosamente (ruta de respaldo)',
      cliente: nuevoCliente
    });
  });
  
  // Autenticación - Prioridad alta
  const authRoutes = require('./auth.routes');
  console.log('Ruta de autenticación cargada.');
  router.use('/auth', authRoutes);
  console.log('Ruta /api/auth configurada.');
  
  // Resto de rutas - Prioridad normal
  console.log('Cargando rutas secundarias...');
  
  // Cada ruta en su propio bloque try-catch
  try {
    const usuarioRoutes = require('./usuario.routes');
    router.use('/usuarios', usuarioRoutes);
    console.log('✅ Rutas de usuarios cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de usuarios:', error);
  }
  
  try {
    const rolRoutes = require('./rol.routes');
    router.use('/roles', rolRoutes);
    console.log('✅ Rutas de roles cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de roles:', error);
  }
  
  try {
    const clienteRoutes = require('./cliente.routes');
    router.use('/clientes', clienteRoutes);
    console.log('✅ Rutas de clientes cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de clientes:', error);
  }
  
  try {
    const contactoRoutes = require('./contacto.routes');
    router.use('/contactos', contactoRoutes);
    console.log('✅ Rutas de contactos cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de contactos:', error);
  }
  
  try {
    const seguimientoClienteRoutes = require('./seguimiento-cliente.routes');
    router.use('/seguimientos', seguimientoClienteRoutes);
    console.log('✅ Rutas de seguimientos cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de seguimientos:', error);
  }
  
  try {
    const cursoRoutes = require('./curso.routes');
    router.use('/cursos', cursoRoutes);
    console.log('✅ Rutas de cursos cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de cursos:', error);
  }
  
  try {
    const cursoSenceRoutes = require('./curso-sence.routes');
    router.use('/cursos-sence', cursoSenceRoutes);
    console.log('✅ Rutas de cursos SENCE cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de cursos SENCE:', error);
  }
  
  try {
    const participanteRoutes = require('./participante.routes');
    router.use('/participantes', participanteRoutes);
    console.log('✅ Rutas de participantes cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de participantes:', error);
  }
  
  try {
    const declaracionJuradaRoutes = require('./declaracion-jurada.routes');
    router.use('/declaraciones-juradas', declaracionJuradaRoutes);
    console.log('✅ Rutas de declaraciones juradas cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de declaraciones juradas:', error);
  }
  
  try {
    const sesionRoutes = require('./sesion.routes');
    router.use('/sesiones', sesionRoutes);
    console.log('✅ Rutas de sesiones cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de sesiones:', error);
  }
  
  try {
    const asistenciaRoutes = require('./asistencia.routes');
    router.use('/asistencias', asistenciaRoutes);
    console.log('✅ Rutas de asistencias cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de asistencias:', error);
  }
  
  try {
    const facturaRoutes = require('./factura.routes');
    router.use('/facturas', facturaRoutes);
    console.log('✅ Rutas de facturas cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de facturas:', error);
  }
  
  try {
    const ventaRoutes = require('./venta.routes');
    ventaRoutes(router);
    console.log('✅ Rutas de ventas cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de ventas:', error);
  }
  
  try {
    const ingresoRoutes = require('./ingreso.routes');
    router.use('/ingresos', ingresoRoutes);
    console.log('✅ Rutas de ingresos cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de ingresos:', error);
  }
  
  try {
    const egresoRoutes = require('./egreso.routes');
    router.use('/egresos', egresoRoutes);
    console.log('✅ Rutas de egresos cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de egresos:', error);
  }
  
  try {
    const conciliacionBancariaRoutes = require('./conciliacion-bancaria.routes');
    router.use('/conciliaciones-bancarias', conciliacionBancariaRoutes);
    console.log('✅ Rutas de conciliaciones bancarias cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de conciliaciones bancarias:', error);
  }
  
  try {
    const cuentaBancariaRoutes = require('./cuenta-bancaria.routes');
    router.use('/cuentas-bancarias', cuentaBancariaRoutes);
    console.log('✅ Rutas de cuentas bancarias cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de cuentas bancarias:', error);
  }
  
  try {
    const proyectoRoutes = require('./proyecto.routes');
    router.use('/proyectos', proyectoRoutes);
    console.log('✅ Rutas de proyectos cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de proyectos:', error);
  }
  
  try {
    const emailRoutes = require('./email.routes');
    router.use('/email', emailRoutes);
    console.log('✅ Rutas de email cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de email:', error);
  }
  
  try {
    const pdfRoutes = require('./pdf.routes');
    router.use('/pdf', pdfRoutes);
    console.log('✅ Rutas de PDF cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de PDF:', error);
  }
  
  try {
    const dashboardRoutes = require('./dashboard.routes');
    router.use('/dashboard', dashboardRoutes);
    console.log('✅ Rutas de dashboard cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de dashboard:', error);
  }
  
  try {
    const settingRoutes = require('./setting.routes');
    router.use('/settings', settingRoutes);
    console.log('✅ Rutas de configuraciones cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de configuraciones:', error);
  }
  
  // Importar nuevas rutas
  const comisionRoutes = require('./comision.routes');
  router.use('/comisiones', comisionRoutes);
  
  try {
    const otecDataRoutes = require('./otec-data.routes');
    router.use('/otec-data', otecDataRoutes);
    console.log('✅ Rutas de OTEC Data cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de OTEC Data:', error);
  }
  
  try {
    const usuariosSenceRoutes = require('./usuarios-sence.routes');
    router.use('/usuarios-sence', usuariosSenceRoutes);
    console.log('✅ Rutas de Usuarios Sence cargadas correctamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas de Usuarios Sence:', error);
  }
  
  console.log('Todas las rutas configuradas correctamente.');
} catch (error) {
  console.error('Error crítico al cargar rutas:', error);
}

// Aplicar limiter a todas las rutas de la API
router.use(apiLimiter);

module.exports = router; 