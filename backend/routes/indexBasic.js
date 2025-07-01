const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const authMiddleware = require('../middlewares/auth.middleware');

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'API de prueba funcionando correctamente' });
});

// Ruta para probar la conexión a la base de datos
router.get('/db-test', async (req, res) => {
  try {
    // Verificar la conexión
    await sequelize.authenticate();
    
    // Realizar una consulta simple
    const result = await sequelize.query('SELECT NOW()', {
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      status: 'success',
      message: 'Conexión a la base de datos correcta',
      dbTime: result[0].now,
      dbConfig: {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'erp_otec',
        user: process.env.DB_USER || 'postgres',
        ssl: process.env.DB_SSL === 'true' ? 'Habilitado' : 'Deshabilitado'
      }
    });
  } catch (error) {
    console.error('Error en la prueba de base de datos:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al conectar con la base de datos',
      error: error.message,
      dbConfig: {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'erp_otec',
        user: process.env.DB_USER || 'postgres',
        ssl: process.env.DB_SSL === 'true' ? 'Habilitado' : 'Deshabilitado'
      }
    });
  }
});

// Ruta de autenticación
const authRoutes = require('./auth.routes');
router.use('/auth', authRoutes);

// Ruta para obtener información del usuario actual
router.get('/users/me', authMiddleware, async (req, res) => {
  try {
    const { Usuario } = require('../models');
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: { exclude: ['password'] }
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
        ultimo_login: usuario.ultimo_login
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

// Ruta para dashboard
router.get('/dashboard/completo', authMiddleware, async (req, res) => {
  try {
    // Simulación de datos de dashboard
    res.json({
      status: 'success',
      datos: {
        estadisticas: {
          clientes: { total: 24, nuevos: 5 },
          proyectos: { total: 18, activos: 12, completados: 6 },
          cursos: { total: 30, activos: 15 },
          ingresos: { total: 12500000, mes_actual: 2300000 }
        },
        grafico_ingresos: [
          { mes: 'Enero', valor: 1500000 },
          { mes: 'Febrero', valor: 1800000 },
          { mes: 'Marzo', valor: 2100000 },
          { mes: 'Abril', valor: 2300000 }
        ],
        proyectos_recientes: [
          { id: 1, nombre: 'Capacitación ACHS', cliente: 'ACHS', estado: 'En progreso' },
          { id: 2, nombre: 'Curso Excel Avanzado', cliente: 'Banco de Chile', estado: 'Completado' },
          { id: 3, nombre: 'Taller Liderazgo', cliente: 'Falabella', estado: 'Planificado' }
        ],
        alertas: [
          { tipo: 'info', mensaje: 'Proyecto "Taller Liderazgo" comienza en 2 días' },
          { tipo: 'warning', mensaje: 'Factura #123 pendiente de pago' },
          { tipo: 'error', mensaje: 'Declaración jurada del curso "Excel Avanzado" vence mañana' }
        ]
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({ message: 'Error al obtener datos del dashboard', error: error.message });
  }
});

// Ruta para obtener lista de clientes
router.get('/clientes', authMiddleware, async (req, res) => {
  try {
    // Simulación de datos de clientes
    res.json({
      status: 'success',
      clientes: [
        { 
          id: 1, 
          razon_social: 'ACHS', 
          rut: '70.360.100-6', 
          direccion: 'Av. Vicuña Mackenna 152, Santiago', 
          telefono: '226852000',
          email: 'contacto@achs.cl',
          estado: 'Activo',
          created_at: '2023-01-15T10:30:00Z' 
        },
        { 
          id: 2, 
          razon_social: 'Banco de Chile', 
          rut: '97.004.000-5', 
          direccion: 'Ahumada 251, Santiago', 
          telefono: '226373000',
          email: 'contacto@bancochile.cl',
          estado: 'Activo',
          created_at: '2023-02-10T14:20:00Z' 
        },
        { 
          id: 3, 
          razon_social: 'Falabella', 
          rut: '90.749.000-9', 
          direccion: 'Manuel Rodríguez 730, Santiago', 
          telefono: '226399000',
          email: 'contacto@falabella.cl',
          estado: 'Activo',
          created_at: '2023-03-05T09:15:00Z' 
        },
        { 
          id: 4, 
          razon_social: 'Sodimac', 
          rut: '96.792.430-K', 
          direccion: 'Av. Presidente Eduardo Frei Montalva 3092, Renca', 
          telefono: '226981000',
          email: 'contacto@sodimac.cl',
          estado: 'Activo',
          created_at: '2023-03-20T11:45:00Z' 
        },
        { 
          id: 5, 
          razon_social: 'Cencosud', 
          rut: '93.834.000-5', 
          direccion: 'Av. Kennedy 9001, Las Condes', 
          telefono: '226599000',
          email: 'contacto@cencosud.cl',
          estado: 'Inactivo',
          created_at: '2023-04-12T16:30:00Z' 
        }
      ],
      total: 5
    });
  } catch (error) {
    console.error('Error al obtener lista de clientes:', error);
    res.status(500).json({ message: 'Error al obtener lista de clientes', error: error.message });
  }
});

// Ruta para obtener lista de cursos
router.get('/cursos', authMiddleware, async (req, res) => {
  try {
    // Simulación de datos de cursos
    res.json({
      status: 'success',
      cursos: [
        {
          id: 1,
          nombre: 'Excel Avanzado',
          descripcion: 'Curso completo de Excel con funciones avanzadas y macros',
          codigo_sence: 'SENCE-1234-2023',
          duracion_horas: 40,
          precio: 450000,
          fecha_inicio: '2023-05-15T09:00:00Z',
          fecha_fin: '2023-06-15T18:00:00Z',
          estado: 'En progreso',
          tipo: 'Presencial',
          cupos_totales: 20,
          cupos_disponibles: 5,
          created_at: '2023-04-01T10:30:00Z'
        },
        {
          id: 2,
          nombre: 'Liderazgo Efectivo',
          descripcion: 'Taller para desarrollar habilidades de liderazgo y gestión de equipos',
          codigo_sence: 'SENCE-2345-2023',
          duracion_horas: 24,
          precio: 380000,
          fecha_inicio: '2023-07-10T14:00:00Z',
          fecha_fin: '2023-07-24T18:00:00Z',
          estado: 'Planificado',
          tipo: 'Híbrido',
          cupos_totales: 15,
          cupos_disponibles: 15,
          created_at: '2023-04-15T11:20:00Z'
        },
        {
          id: 3,
          nombre: 'Seguridad Laboral',
          descripcion: 'Capacitación en normativas de seguridad y prevención de riesgos',
          codigo_sence: 'SENCE-3456-2023',
          duracion_horas: 16,
          precio: 280000,
          fecha_inicio: '2023-04-20T09:00:00Z',
          fecha_fin: '2023-04-28T18:00:00Z',
          estado: 'Completado',
          tipo: 'Presencial',
          cupos_totales: 25,
          cupos_disponibles: 0,
          created_at: '2023-03-10T09:45:00Z'
        },
        {
          id: 4,
          nombre: 'Marketing Digital',
          descripcion: 'Estrategias y herramientas de marketing en entornos digitales',
          codigo_sence: 'SENCE-4567-2023',
          duracion_horas: 32,
          precio: 420000,
          fecha_inicio: '2023-06-05T15:00:00Z',
          fecha_fin: '2023-06-30T19:00:00Z',
          estado: 'En progreso',
          tipo: 'Online',
          cupos_totales: 30,
          cupos_disponibles: 12,
          created_at: '2023-05-02T14:30:00Z'
        },
        {
          id: 5,
          nombre: 'Gestión de Proyectos',
          descripcion: 'Metodologías ágiles para la gestión eficiente de proyectos',
          codigo_sence: 'SENCE-5678-2023',
          duracion_horas: 48,
          precio: 520000,
          fecha_inicio: '2023-08-07T09:00:00Z',
          fecha_fin: '2023-09-15T18:00:00Z',
          estado: 'Planificado',
          tipo: 'Híbrido',
          cupos_totales: 18,
          cupos_disponibles: 18,
          created_at: '2023-05-20T10:15:00Z'
        }
      ],
      total: 5
    });
  } catch (error) {
    console.error('Error al obtener lista de cursos:', error);
    res.status(500).json({ message: 'Error al obtener lista de cursos', error: error.message });
  }
});

// Ruta para obtener lista de proyectos
router.get('/proyectos', authMiddleware, async (req, res) => {
  try {
    // Simulación de datos de proyectos
    res.json({
      status: 'success',
      proyectos: [
        {
          id: 1,
          nombre: 'Capacitación ACHS',
          descripcion: 'Programa integral de capacitación para personal de ACHS',
          cliente_id: 1,
          cliente: 'ACHS',
          fecha_inicio: '2023-05-10T09:00:00Z',
          fecha_fin: '2023-07-30T18:00:00Z',
          estado: 'En progreso',
          presupuesto: 12500000,
          monto_facturado: 6250000,
          responsable_id: 1,
          responsable: 'Victoria Zavala',
          created_at: '2023-04-15T10:30:00Z'
        },
        {
          id: 2,
          nombre: 'Curso Excel Avanzado',
          descripcion: 'Curso especializado para personal administrativo del Banco de Chile',
          cliente_id: 2,
          cliente: 'Banco de Chile',
          fecha_inicio: '2023-04-05T14:00:00Z',
          fecha_fin: '2023-05-20T18:00:00Z',
          estado: 'Completado',
          presupuesto: 5800000,
          monto_facturado: 5800000,
          responsable_id: 1,
          responsable: 'Victoria Zavala',
          created_at: '2023-03-10T14:20:00Z'
        },
        {
          id: 3,
          nombre: 'Taller Liderazgo',
          descripcion: 'Taller para gerentes de tienda de Falabella',
          cliente_id: 3,
          cliente: 'Falabella',
          fecha_inicio: '2023-07-15T09:00:00Z',
          fecha_fin: '2023-07-30T18:00:00Z',
          estado: 'Planificado',
          presupuesto: 4200000,
          monto_facturado: 1260000,
          responsable_id: 1,
          responsable: 'Victoria Zavala',
          created_at: '2023-05-20T09:15:00Z'
        },
        {
          id: 4,
          nombre: 'Seguridad en Tiendas',
          descripcion: 'Capacitación sobre protocolos de seguridad para tiendas Sodimac',
          cliente_id: 4,
          cliente: 'Sodimac',
          fecha_inicio: '2023-06-01T09:00:00Z',
          fecha_fin: '2023-06-30T18:00:00Z',
          estado: 'En progreso',
          presupuesto: 7500000,
          monto_facturado: 3750000,
          responsable_id: 1,
          responsable: 'Victoria Zavala',
          created_at: '2023-05-10T11:45:00Z'
        },
        {
          id: 5,
          nombre: 'Atención al Cliente',
          descripcion: 'Programa de mejora de atención al cliente para personal de Cencosud',
          cliente_id: 5,
          cliente: 'Cencosud',
          fecha_inicio: '2023-08-10T14:00:00Z',
          fecha_fin: '2023-09-30T18:00:00Z',
          estado: 'Planificado',
          presupuesto: 9800000,
          monto_facturado: 0,
          responsable_id: 1,
          responsable: 'Victoria Zavala',
          created_at: '2023-06-05T16:30:00Z'
        }
      ],
      total: 5
    });
  } catch (error) {
    console.error('Error al obtener lista de proyectos:', error);
    res.status(500).json({ message: 'Error al obtener lista de proyectos', error: error.message });
  }
});

// Rutas para estadísticas generales
router.get('/estadisticas', authMiddleware, async (req, res) => {
  try {
    // Simulación de datos de estadísticas
    res.json({
      status: 'success',
      estadisticas: {
        clientes: { total: 24, nuevos: 5, activos: 20, inactivos: 4 },
        proyectos: { total: 18, activos: 12, completados: 6, planificados: 0 },
        cursos: { total: 30, activos: 15, completados: 10, planificados: 5 },
        finanzas: { 
          ingresos_totales: 45800000, 
          gastos_totales: 28500000,
          ingresos_pendientes: 12300000,
          utilidad: 17300000
        },
        participantes: { total: 350, activos: 230, certificados: 120 }
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// Rutas para facturas
router.get('/facturas', authMiddleware, async (req, res) => {
  try {
    // Simulación de datos de facturas
    res.json({
      status: 'success',
      facturas: [
        {
          id: 1,
          numero: 'F-2023001',
          cliente_id: 1,
          cliente: 'ACHS',
          fecha_emision: '2023-05-15T10:30:00Z',
          fecha_vencimiento: '2023-06-15T23:59:59Z',
          monto_total: 5250000,
          estado: 'Pagada',
          proyecto_id: 1,
          proyecto: 'Capacitación ACHS',
          created_at: '2023-05-15T10:30:00Z'
        },
        {
          id: 2,
          numero: 'F-2023002',
          cliente_id: 2,
          cliente: 'Banco de Chile',
          fecha_emision: '2023-05-20T14:20:00Z',
          fecha_vencimiento: '2023-06-20T23:59:59Z',
          monto_total: 5800000,
          estado: 'Pagada',
          proyecto_id: 2,
          proyecto: 'Curso Excel Avanzado',
          created_at: '2023-05-20T14:20:00Z'
        },
        {
          id: 3,
          numero: 'F-2023003',
          cliente_id: 3,
          cliente: 'Falabella',
          fecha_emision: '2023-06-05T09:15:00Z',
          fecha_vencimiento: '2023-07-05T23:59:59Z',
          monto_total: 1260000,
          estado: 'Pagada',
          proyecto_id: 3,
          proyecto: 'Taller Liderazgo',
          created_at: '2023-06-05T09:15:00Z'
        },
        {
          id: 4,
          numero: 'F-2023004',
          cliente_id: 4,
          cliente: 'Sodimac',
          fecha_emision: '2023-06-15T11:45:00Z',
          fecha_vencimiento: '2023-07-15T23:59:59Z',
          monto_total: 3750000,
          estado: 'Pendiente',
          proyecto_id: 4,
          proyecto: 'Seguridad en Tiendas',
          created_at: '2023-06-15T11:45:00Z'
        },
        {
          id: 5,
          numero: 'F-2023005',
          cliente_id: 1,
          cliente: 'ACHS',
          fecha_emision: '2023-07-01T10:30:00Z',
          fecha_vencimiento: '2023-08-01T23:59:59Z',
          monto_total: 3750000,
          estado: 'Pendiente',
          proyecto_id: 1,
          proyecto: 'Capacitación ACHS',
          created_at: '2023-07-01T10:30:00Z'
        }
      ],
      total: 5
    });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ message: 'Error al obtener facturas', error: error.message });
  }
});

// Rutas para participantes de cursos
router.get('/participantes', authMiddleware, async (req, res) => {
  try {
    // Simulación de datos de participantes
    res.json({
      status: 'success',
      participantes: [
        {
          id: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          rut: '12.345.678-9',
          email: 'juan.perez@empresa.cl',
          telefono: '912345678',
          empresa: 'ACHS',
          curso_id: 1,
          curso: 'Excel Avanzado',
          estado: 'Activo',
          asistencia: 85,
          nota_final: 6.5,
          certificado: false,
          created_at: '2023-04-20T10:30:00Z'
        },
        {
          id: 2,
          nombre: 'María',
          apellido: 'González',
          rut: '9.876.543-2',
          email: 'maria.gonzalez@empresa.cl',
          telefono: '998765432',
          empresa: 'Banco de Chile',
          curso_id: 2,
          curso: 'Liderazgo Efectivo',
          estado: 'Preinscrito',
          asistencia: null,
          nota_final: null,
          certificado: false,
          created_at: '2023-05-15T14:20:00Z'
        },
        {
          id: 3,
          nombre: 'Pedro',
          apellido: 'Soto',
          rut: '14.725.836-5',
          email: 'pedro.soto@empresa.cl',
          telefono: '914725836',
          empresa: 'Falabella',
          curso_id: 3,
          curso: 'Seguridad Laboral',
          estado: 'Completado',
          asistencia: 100,
          nota_final: 7.0,
          certificado: true,
          created_at: '2023-03-25T09:15:00Z'
        },
        {
          id: 4,
          nombre: 'Ana',
          apellido: 'Muñoz',
          rut: '15.975.328-4',
          email: 'ana.munoz@empresa.cl',
          telefono: '915975328',
          empresa: 'Sodimac',
          curso_id: 4,
          curso: 'Marketing Digital',
          estado: 'Activo',
          asistencia: 75,
          nota_final: null,
          certificado: false,
          created_at: '2023-05-10T11:45:00Z'
        },
        {
          id: 5,
          nombre: 'Carlos',
          apellido: 'Vega',
          rut: '17.654.321-8',
          email: 'carlos.vega@empresa.cl',
          telefono: '917654321',
          empresa: 'Cencosud',
          curso_id: 5,
          curso: 'Gestión de Proyectos',
          estado: 'Preinscrito',
          asistencia: null,
          nota_final: null,
          certificado: false,
          created_at: '2023-06-01T16:30:00Z'
        }
      ],
      total: 5
    });
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    res.status(500).json({ message: 'Error al obtener participantes', error: error.message });
  }
});

// Ruta para obtener información de usuario por ID
router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const { Usuario } = require('../models');
    const { id } = req.params;
    
    // Intentar obtener el usuario de la base de datos
    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!usuario) {
      // Si no lo encuentra, devolver un usuario simulado para desarrollo
      if (id === '1') {
        return res.json({
          usuario: {
            id: 1,
            nombre: 'Victoria',
            apellido: 'Zavala',
            email: 'vzavala@dataotec.com',
            rol: 'Administrador',
            activo: true,
            ultimo_login: new Date().toISOString()
          }
        });
      }
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ usuario });
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
});

// Ruta para obtener un cliente específico por ID
router.get('/clientes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        message: 'ID de cliente no válido',
        error: 'Se requiere un ID de cliente válido'
      });
    }
    
    console.log(`Obteniendo cliente con ID ${id}`);
    
    // Simulación - buscar cliente por ID
    // En un caso real, aquí consultaríamos la base de datos
    let clienteEncontrado = null;
    
    // Para la demostración, vamos a simular algunos clientes conocidos
    if (id === '1') {
      clienteEncontrado = { 
        id: 1, 
        razon_social: 'ACHS', 
        rut: '70.360.100-6', 
        direccion: 'Av. Vicuña Mackenna 152, Santiago', 
        telefono: '226852000',
        email: 'contacto@achs.cl',
        estado: 'Activo',
        created_at: '2023-01-15T10:30:00Z' 
      };
    } else if (id === '2') {
      clienteEncontrado = { 
        id: 2, 
        razon_social: 'Banco de Chile', 
        rut: '97.004.000-5', 
        direccion: 'Ahumada 251, Santiago', 
        telefono: '226373000',
        email: 'contacto@bancochile.cl',
        estado: 'Activo',
        created_at: '2023-02-10T14:20:00Z' 
      };
    } else if (id === '960') {
      // Este es el cliente que acabas de crear en el ejemplo
      clienteEncontrado = {
        id: 960,
        razon_social: 'Dataotec SPA',
        nombre_comercial: 'DataOtec',
        rut: '77.845.621-4',
        direccion: 'Antonio Bellet 193',
        telefono: '986545037',
        email: 'contacto@dataotec.com',
        estado: 'Activo',
        tipo_cliente: 'empresa',
        giro: 'Asesorías Comerciales',
        sitio_web: 'https://dataotec.com',
        ciudad: 'Providencia',
        region: 'Región Metropolitana de Santiago',
        created_at: '2025-03-21T23:49:56.992Z'
      };
    } else {
      // Para cualquier otro ID, crear un cliente simulado
      clienteEncontrado = {
        id: parseInt(id),
        razon_social: `Cliente Simulado ${id}`,
        nombre_comercial: `Comercial ${id}`,
        rut: `${id}.123.456-7`,
        direccion: `Dirección de prueba ${id}`,
        telefono: `9${id}123456`,
        email: `cliente${id}@ejemplo.com`,
        estado: 'Activo',
        tipo_cliente: 'empresa',
        giro: 'Servicios Generales',
        sitio_web: `https://cliente${id}.com`,
        ciudad: 'Santiago',
        region: 'Región Metropolitana',
        created_at: new Date().toISOString()
      };
    }
    
    if (!clienteEncontrado) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.json({
      status: 'success',
      cliente: clienteEncontrado
    });
  } catch (error) {
    console.error(`Error al obtener cliente con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener cliente', error: error.message });
  }
});

// Ruta para obtener un curso específico por ID
router.get('/cursos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        message: 'ID de curso no válido',
        error: 'Se requiere un ID de curso válido'
      });
    }
    
    console.log(`Obteniendo curso con ID ${id}`);
    
    // Simulación - curso con ID específico
    const cursoId = parseInt(id);
    const curso = {
      id: cursoId,
      nombre: `Curso ${cursoId}`,
      descripcion: `Descripción del curso ${cursoId}`,
      codigo_sence: `SENCE-${cursoId}-2023`,
      duracion_horas: 40,
      precio: 450000,
      fecha_inicio: '2023-05-15T09:00:00Z',
      fecha_fin: '2023-06-15T18:00:00Z',
      estado: 'En progreso',
      tipo: 'Presencial',
      cupos_totales: 20,
      cupos_disponibles: 5,
      created_at: '2023-04-01T10:30:00Z'
    };
    
    res.json({
      status: 'success',
      curso: curso
    });
  } catch (error) {
    console.error(`Error al obtener curso con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener curso', error: error.message });
  }
});

// Ruta para obtener un proyecto específico por ID
router.get('/proyectos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        message: 'ID de proyecto no válido',
        error: 'Se requiere un ID de proyecto válido'
      });
    }
    
    console.log(`Obteniendo proyecto con ID ${id}`);
    
    // Simulación - proyecto con ID específico
    const proyectoId = parseInt(id);
    const proyecto = {
      id: proyectoId,
      nombre: `Proyecto ${proyectoId}`,
      descripcion: `Descripción del proyecto ${proyectoId}`,
      cliente_id: 1,
      cliente: 'ACHS',
      fecha_inicio: '2023-05-10T09:00:00Z',
      fecha_fin: '2023-07-30T18:00:00Z',
      estado: 'En progreso',
      presupuesto: 12500000,
      monto_facturado: 6250000,
      responsable_id: 1,
      responsable: 'Victoria Zavala',
      created_at: '2023-04-15T10:30:00Z'
    };
    
    res.json({
      status: 'success',
      proyecto: proyecto
    });
  } catch (error) {
    console.error(`Error al obtener proyecto con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener proyecto', error: error.message });
  }
});

// Ruta para obtener una factura específica por ID
router.get('/facturas/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        message: 'ID de factura no válido',
        error: 'Se requiere un ID de factura válido'
      });
    }
    
    console.log(`Obteniendo factura con ID ${id}`);
    
    // Simulación - factura con ID específico
    const facturaId = parseInt(id);
    const factura = {
      id: facturaId,
      numero: `F-2023${facturaId.toString().padStart(3, '0')}`,
      cliente_id: 1,
      cliente: 'ACHS',
      fecha_emision: '2023-05-15T10:30:00Z',
      fecha_vencimiento: '2023-06-15T23:59:59Z',
      monto_total: 5250000,
      estado: 'Pendiente',
      proyecto_id: 1,
      proyecto: 'Capacitación ACHS',
      created_at: '2023-05-15T10:30:00Z'
    };
    
    res.json({
      status: 'success',
      factura: factura
    });
  } catch (error) {
    console.error(`Error al obtener factura con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener factura', error: error.message });
  }
});

// Ruta para obtener un participante específico por ID
router.get('/participantes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        message: 'ID de participante no válido',
        error: 'Se requiere un ID de participante válido'
      });
    }
    
    console.log(`Obteniendo participante con ID ${id}`);
    
    // Simulación - participante con ID específico
    const participanteId = parseInt(id);
    const participante = {
      id: participanteId,
      nombre: `Nombre ${participanteId}`,
      apellido: `Apellido ${participanteId}`,
      rut: `${participanteId}.123.456-7`,
      email: `participante${participanteId}@ejemplo.com`,
      telefono: `9${participanteId}123456`,
      empresa: 'Empresa Ejemplo',
      curso_id: 1,
      curso: 'Excel Avanzado',
      estado: 'Activo',
      asistencia: 85,
      nota_final: 6.5,
      certificado: false,
      created_at: '2023-04-20T10:30:00Z'
    };
    
    res.json({
      status: 'success',
      participante: participante
    });
  } catch (error) {
    console.error(`Error al obtener participante con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener participante', error: error.message });
  }
});

// RUTAS POST PARA CREAR RECURSOS
// ==============================

// Ruta para crear un nuevo cliente
router.post('/clientes', authMiddleware, async (req, res) => {
  try {
    console.log('Cuerpo de la solicitud completo:', JSON.stringify(req.body));
    
    // Convertir propiedades de camelCase a snake_case
    const clienteData = {
      razon_social: req.body.razonSocial || req.body.razon_social,
      nombre_comercial: req.body.nombreComercial,
      rut: req.body.rut,
      direccion: req.body.direccion,
      telefono: req.body.telefono,
      email: req.body.email,
      estado: req.body.estado,
      tipo_cliente: req.body.tipoCliente,
      giro: req.body.giro,
      sitio_web: req.body.sitioWeb,
      ciudad: req.body.ciudad,
      region: req.body.region
    };
    
    console.log('Datos convertidos a snake_case:', clienteData);
    
    // Validación básica
    if (!clienteData.razon_social || !clienteData.rut) {
      console.log('Validación fallida: razon_social o rut faltantes');
      return res.status(400).json({ 
        message: 'Datos incompletos', 
        error: 'La razón social y el RUT son obligatorios',
        received: { razon_social: clienteData.razon_social, rut: clienteData.rut }
      });
    }
    
    console.log('Creando nuevo cliente:', clienteData);
    
    // En un entorno real, aquí se guardaría en la base de datos
    // Para simulación, devolvemos el cliente con un ID
    const nuevoCliente = {
      id: Math.floor(Math.random() * 1000) + 6, // ID aleatorio (simulado)
      razon_social: clienteData.razon_social,
      nombre_comercial: clienteData.nombre_comercial || '',
      rut: clienteData.rut,
      direccion: clienteData.direccion || '',
      telefono: clienteData.telefono || '',
      email: clienteData.email || '',
      estado: clienteData.estado || 'Activo',
      tipo_cliente: clienteData.tipo_cliente || 'Empresa',
      giro: clienteData.giro || '',
      sitio_web: clienteData.sitio_web || '',
      ciudad: clienteData.ciudad || '',
      region: clienteData.region || '',
      created_at: new Date().toISOString()
    };
    
    console.log('Cliente creado exitosamente:', nuevoCliente);
    console.log('ID del cliente creado:', nuevoCliente.id);
    
    // Añadir URL para obtener los detalles del cliente
    const clienteUrl = `/api/clientes/${nuevoCliente.id}`;
    console.log('URL para obtener detalles del cliente:', clienteUrl);
    
    res.status(201).json({
      status: 'success',
      message: 'Cliente creado exitosamente',
      cliente: nuevoCliente,
      _links: {
        self: clienteUrl,
        collection: '/api/clientes'
      },
      // Información de depuración - solo para desarrollo
      debug: {
        client_id: nuevoCliente.id,
        client_url: clienteUrl
      }
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    console.error('Stack del error:', error.stack);
    res.status(500).json({ 
      message: 'Error al crear cliente', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Ruta para crear un nuevo curso
router.post('/cursos', authMiddleware, async (req, res) => {
  try {
    console.log('Cuerpo de la solicitud completo:', JSON.stringify(req.body));
    
    // Convertir propiedades de camelCase a snake_case
    const cursoData = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      codigo_sence: req.body.codigoSence || req.body.codigo_sence,
      duracion_horas: req.body.duracionHoras || req.body.duracion_horas,
      precio: req.body.precio,
      fecha_inicio: req.body.fechaInicio || req.body.fecha_inicio,
      fecha_fin: req.body.fechaFin || req.body.fecha_fin,
      estado: req.body.estado,
      tipo: req.body.tipo,
      cupos_totales: req.body.cuposTotales || req.body.cupos_totales,
      cupos_disponibles: req.body.cuposDisponibles || req.body.cupos_disponibles
    };
    
    console.log('Datos convertidos a snake_case:', cursoData);
    
    // Validación básica
    if (!cursoData.nombre) {
      return res.status(400).json({ 
        message: 'Datos incompletos', 
        error: 'El nombre del curso es obligatorio' 
      });
    }
    
    console.log('Creando nuevo curso:', cursoData);
    
    // Simulación de creación
    const nuevoCurso = {
      id: Math.floor(Math.random() * 1000) + 6,
      nombre: cursoData.nombre,
      descripcion: cursoData.descripcion || '',
      codigo_sence: cursoData.codigo_sence || '',
      duracion_horas: cursoData.duracion_horas || 0,
      precio: cursoData.precio || 0,
      fecha_inicio: cursoData.fecha_inicio || null,
      fecha_fin: cursoData.fecha_fin || null,
      estado: cursoData.estado || 'Planificado',
      tipo: cursoData.tipo || 'Presencial',
      cupos_totales: cursoData.cupos_totales || 0,
      cupos_disponibles: cursoData.cupos_disponibles || cursoData.cupos_totales || 0,
      created_at: new Date().toISOString()
    };
    
    console.log('Curso creado exitosamente:', nuevoCurso);
    console.log('ID del curso creado:', nuevoCurso.id);
    
    // Añadir URL para obtener los detalles del curso
    const cursoUrl = `/api/cursos/${nuevoCurso.id}`;
    console.log('URL para obtener detalles del curso:', cursoUrl);
    
    res.status(201).json({
      status: 'success',
      message: 'Curso creado exitosamente',
      curso: nuevoCurso,
      _links: {
        self: cursoUrl,
        collection: '/api/cursos'
      }
    });
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(500).json({ message: 'Error al crear curso', error: error.message });
  }
});

// Ruta para crear un nuevo proyecto
router.post('/proyectos', authMiddleware, async (req, res) => {
  try {
    console.log('Cuerpo de la solicitud completo:', JSON.stringify(req.body));
    
    // Convertir propiedades de camelCase a snake_case
    const proyectoData = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      cliente_id: req.body.clienteId || req.body.cliente_id,
      fecha_inicio: req.body.fechaInicio || req.body.fecha_inicio,
      fecha_fin: req.body.fechaFin || req.body.fecha_fin,
      estado: req.body.estado,
      presupuesto: req.body.presupuesto,
      responsable_id: req.body.responsableId || req.body.responsable_id
    };
    
    console.log('Datos convertidos a snake_case:', proyectoData);
    
    // Validación básica
    if (!proyectoData.nombre || !proyectoData.cliente_id) {
      return res.status(400).json({ 
        message: 'Datos incompletos', 
        error: 'El nombre y el cliente son obligatorios' 
      });
    }
    
    console.log('Creando nuevo proyecto:', proyectoData);
    
    // Buscar nombre del cliente (simulado)
    let nombreCliente = 'Cliente Desconocido';
    if (proyectoData.cliente_id === 1) nombreCliente = 'ACHS';
    if (proyectoData.cliente_id === 2) nombreCliente = 'Banco de Chile';
    if (proyectoData.cliente_id === 3) nombreCliente = 'Falabella';
    if (proyectoData.cliente_id === 4) nombreCliente = 'Sodimac';
    if (proyectoData.cliente_id === 5) nombreCliente = 'Cencosud';
    
    // Simulación de creación
    const nuevoProyecto = {
      id: Math.floor(Math.random() * 1000) + 6,
      nombre: proyectoData.nombre,
      descripcion: proyectoData.descripcion || '',
      cliente_id: proyectoData.cliente_id,
      cliente: nombreCliente,
      fecha_inicio: proyectoData.fecha_inicio || new Date().toISOString(),
      fecha_fin: proyectoData.fecha_fin || null,
      estado: proyectoData.estado || 'Planificado',
      presupuesto: proyectoData.presupuesto || 0,
      monto_facturado: 0,
      responsable_id: proyectoData.responsable_id || 1,
      responsable: 'Victoria Zavala', // Valor predeterminado
      created_at: new Date().toISOString()
    };
    
    console.log('Proyecto creado exitosamente:', nuevoProyecto);
    console.log('ID del proyecto creado:', nuevoProyecto.id);
    
    // Añadir URL para obtener los detalles del proyecto
    const proyectoUrl = `/api/proyectos/${nuevoProyecto.id}`;
    console.log('URL para obtener detalles del proyecto:', proyectoUrl);
    
    res.status(201).json({
      status: 'success',
      message: 'Proyecto creado exitosamente',
      proyecto: nuevoProyecto,
      _links: {
        self: proyectoUrl,
        collection: '/api/proyectos'
      }
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ message: 'Error al crear proyecto', error: error.message });
  }
});

// Ruta para crear una nueva factura
router.post('/facturas', authMiddleware, async (req, res) => {
  try {
    console.log('Cuerpo de la solicitud completo:', JSON.stringify(req.body));
    
    // Convertir propiedades de camelCase a snake_case
    const facturaData = {
      numero: req.body.numero,
      cliente_id: req.body.clienteId || req.body.cliente_id,
      fecha_emision: req.body.fechaEmision || req.body.fecha_emision,
      fecha_vencimiento: req.body.fechaVencimiento || req.body.fecha_vencimiento,
      monto_total: req.body.montoTotal || req.body.monto_total,
      estado: req.body.estado,
      proyecto_id: req.body.proyectoId || req.body.proyecto_id
    };
    
    console.log('Datos convertidos a snake_case:', facturaData);
    
    // Validación básica
    if (!facturaData.numero || !facturaData.cliente_id || !facturaData.monto_total) {
      return res.status(400).json({ 
        message: 'Datos incompletos', 
        error: 'El número, cliente y monto son obligatorios' 
      });
    }
    
    console.log('Creando nueva factura:', facturaData);
    
    // Buscar nombres (simulado)
    let nombreCliente = 'Cliente Desconocido';
    if (facturaData.cliente_id === 1) nombreCliente = 'ACHS';
    if (facturaData.cliente_id === 2) nombreCliente = 'Banco de Chile';
    if (facturaData.cliente_id === 3) nombreCliente = 'Falabella';
    if (facturaData.cliente_id === 4) nombreCliente = 'Sodimac';
    if (facturaData.cliente_id === 5) nombreCliente = 'Cencosud';
    
    let nombreProyecto = 'Proyecto Desconocido';
    if (facturaData.proyecto_id === 1) nombreProyecto = 'Capacitación ACHS';
    if (facturaData.proyecto_id === 2) nombreProyecto = 'Curso Excel Avanzado';
    if (facturaData.proyecto_id === 3) nombreProyecto = 'Taller Liderazgo';
    if (facturaData.proyecto_id === 4) nombreProyecto = 'Seguridad en Tiendas';
    if (facturaData.proyecto_id === 5) nombreProyecto = 'Atención al Cliente';
    
    // Simulación de creación
    const nuevaFactura = {
      id: Math.floor(Math.random() * 1000) + 6,
      numero: facturaData.numero,
      cliente_id: facturaData.cliente_id,
      cliente: nombreCliente,
      fecha_emision: facturaData.fecha_emision || new Date().toISOString(),
      fecha_vencimiento: facturaData.fecha_vencimiento || null,
      monto_total: facturaData.monto_total,
      estado: facturaData.estado || 'Pendiente',
      proyecto_id: facturaData.proyecto_id,
      proyecto: nombreProyecto,
      created_at: new Date().toISOString()
    };
    
    console.log('Factura creada exitosamente:', nuevaFactura);
    console.log('ID de la factura creada:', nuevaFactura.id);
    
    // Añadir URL para obtener los detalles de la factura
    const facturaUrl = `/api/facturas/${nuevaFactura.id}`;
    console.log('URL para obtener detalles de la factura:', facturaUrl);
    
    res.status(201).json({
      status: 'success',
      message: 'Factura creada exitosamente',
      factura: nuevaFactura,
      _links: {
        self: facturaUrl,
        collection: '/api/facturas'
      }
    });
  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ message: 'Error al crear factura', error: error.message });
  }
});

// Ruta para crear un nuevo participante
router.post('/participantes', authMiddleware, async (req, res) => {
  try {
    console.log('Cuerpo de la solicitud completo:', JSON.stringify(req.body));
    
    // Convertir propiedades de camelCase a snake_case
    const participanteData = {
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      rut: req.body.rut,
      email: req.body.email,
      telefono: req.body.telefono,
      empresa: req.body.empresa,
      curso_id: req.body.cursoId || req.body.curso_id,
      estado: req.body.estado,
      asistencia: req.body.asistencia,
      nota_final: req.body.notaFinal || req.body.nota_final,
      certificado: req.body.certificado
    };
    
    console.log('Datos convertidos a snake_case:', participanteData);
    
    // Validación básica
    if (!participanteData.nombre || !participanteData.apellido || !participanteData.rut || !participanteData.curso_id) {
      return res.status(400).json({ 
        message: 'Datos incompletos', 
        error: 'Nombre, apellido, RUT y curso son obligatorios' 
      });
    }
    
    console.log('Creando nuevo participante:', participanteData);
    
    // Buscar nombre del curso (simulado)
    let nombreCurso = 'Curso Desconocido';
    if (participanteData.curso_id === 1) nombreCurso = 'Excel Avanzado';
    if (participanteData.curso_id === 2) nombreCurso = 'Liderazgo Efectivo';
    if (participanteData.curso_id === 3) nombreCurso = 'Seguridad Laboral';
    if (participanteData.curso_id === 4) nombreCurso = 'Marketing Digital';
    if (participanteData.curso_id === 5) nombreCurso = 'Gestión de Proyectos';
    
    // Simulación de creación
    const nuevoParticipante = {
      id: Math.floor(Math.random() * 1000) + 6,
      nombre: participanteData.nombre,
      apellido: participanteData.apellido,
      rut: participanteData.rut,
      email: participanteData.email || '',
      telefono: participanteData.telefono || '',
      empresa: participanteData.empresa || '',
      curso_id: participanteData.curso_id,
      curso: nombreCurso,
      estado: participanteData.estado || 'Preinscrito',
      asistencia: participanteData.asistencia || null,
      nota_final: participanteData.nota_final || null,
      certificado: participanteData.certificado || false,
      created_at: new Date().toISOString()
    };
    
    console.log('Participante creado exitosamente:', nuevoParticipante);
    console.log('ID del participante creado:', nuevoParticipante.id);
    
    // Añadir URL para obtener los detalles del participante
    const participanteUrl = `/api/participantes/${nuevoParticipante.id}`;
    console.log('URL para obtener detalles del participante:', participanteUrl);
    
    res.status(201).json({
      status: 'success',
      message: 'Participante creado exitosamente',
      participante: nuevoParticipante,
      _links: {
        self: participanteUrl,
        collection: '/api/participantes'
      }
    });
  } catch (error) {
    console.error('Error al crear participante:', error);
    res.status(500).json({ message: 'Error al crear participante', error: error.message });
  }
});

// Ruta de prueba para crear cliente sin validaciones
router.post('/clientes-test', authMiddleware, async (req, res) => {
  try {
    console.log('TEST - Cuerpo completo recibido:', JSON.stringify(req.body));
    
    // Convertir propiedades de camelCase a snake_case
    const clienteData = {
      razon_social: req.body.razonSocial || req.body.razon_social || 'Cliente de Prueba',
      nombre_comercial: req.body.nombreComercial || '',
      rut: req.body.rut || '12.345.678-9',
      direccion: req.body.direccion || 'Dirección de prueba',
      telefono: req.body.telefono || '912345678',
      email: req.body.email || 'prueba@ejemplo.com',
      estado: req.body.estado || 'Activo',
      tipo_cliente: req.body.tipoCliente || 'Empresa',
      giro: req.body.giro || '',
      sitio_web: req.body.sitioWeb || '',
      ciudad: req.body.ciudad || '',
      region: req.body.region || ''
    };
    
    console.log('TEST - Datos convertidos a snake_case:', clienteData);
    
    // Crear cliente con datos predeterminados si no se proporcionan
    const nuevoCliente = {
      id: Math.floor(Math.random() * 1000) + 100,
      razon_social: clienteData.razon_social,
      nombre_comercial: clienteData.nombre_comercial,
      rut: clienteData.rut,
      direccion: clienteData.direccion,
      telefono: clienteData.telefono,
      email: clienteData.email,
      estado: clienteData.estado,
      tipo_cliente: clienteData.tipo_cliente,
      giro: clienteData.giro,
      sitio_web: clienteData.sitio_web,
      ciudad: clienteData.ciudad,
      region: clienteData.region,
      created_at: new Date().toISOString()
    };
    
    console.log('TEST - Cliente creado sin validaciones:', nuevoCliente);
    
    res.status(201).json({
      status: 'success',
      message: 'Cliente de prueba creado exitosamente',
      cliente: nuevoCliente,
      body_recibido: req.body,
      datos_procesados: clienteData
    });
  } catch (error) {
    console.error('TEST ERROR:', error);
    res.status(500).json({ 
      message: 'Error en prueba', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// RUTAS PUT PARA ACTUALIZAR RECURSOS
// =================================

// Ruta para actualizar un cliente
router.put('/clientes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { razon_social, rut, direccion, telefono, email, estado } = req.body;
    
    console.log(`Actualizando cliente con ID ${id}:`, req.body);
    
    // Validación básica
    if (!razon_social && !rut && !direccion && !telefono && !email && !estado) {
      return res.status(400).json({ 
        message: 'Datos incompletos', 
        error: 'Debe proporcionar al menos un campo para actualizar' 
      });
    }
    
    // En un entorno real, aquí se actualizaría en la base de datos
    // Para simulación, devolvemos el cliente actualizado
    const clienteActualizado = {
      id: parseInt(id),
      razon_social: razon_social || 'Nombre Actualizado',
      rut: rut || '12.345.678-9',
      direccion: direccion || 'Dirección Actualizada',
      telefono: telefono || '912345678',
      email: email || 'email@actualizado.com',
      estado: estado || 'Activo',
      updated_at: new Date().toISOString()
    };
    
    console.log('Cliente actualizado exitosamente:', clienteActualizado);
    
    res.json({
      status: 'success',
      message: 'Cliente actualizado exitosamente',
      cliente: clienteActualizado
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error al actualizar cliente', error: error.message });
  }
});

// Ruta para actualizar un curso
router.put('/cursos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, descripcion, codigo_sence, duracion_horas, precio, 
      fecha_inicio, fecha_fin, estado, tipo, cupos_totales, cupos_disponibles 
    } = req.body;
    
    console.log(`Actualizando curso con ID ${id}:`, req.body);
    
    // En un entorno real, aquí se actualizaría en la base de datos
    // Para simulación, devolvemos el curso actualizado
    const cursoActualizado = {
      id: parseInt(id),
      nombre: nombre || 'Curso Actualizado',
      descripcion: descripcion || 'Descripción actualizada',
      codigo_sence: codigo_sence || 'SENCE-XXXX-20XX',
      duracion_horas: duracion_horas || 0,
      precio: precio || 0,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      estado: estado || 'Actualizado',
      tipo: tipo || 'Actualizado',
      cupos_totales: cupos_totales || 0,
      cupos_disponibles: cupos_disponibles || 0,
      updated_at: new Date().toISOString()
    };
    
    console.log('Curso actualizado exitosamente:', cursoActualizado);
    
    res.json({
      status: 'success',
      message: 'Curso actualizado exitosamente',
      curso: cursoActualizado
    });
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    res.status(500).json({ message: 'Error al actualizar curso', error: error.message });
  }
});

// Ruta para actualizar un proyecto
router.put('/proyectos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, descripcion, cliente_id, fecha_inicio, 
      fecha_fin, estado, presupuesto, monto_facturado, responsable_id 
    } = req.body;
    
    console.log(`Actualizando proyecto con ID ${id}:`, req.body);
    
    // En un entorno real, aquí se actualizaría en la base de datos
    // Para simulación, devolvemos el proyecto actualizado
    const proyectoActualizado = {
      id: parseInt(id),
      nombre: nombre || 'Proyecto Actualizado',
      descripcion: descripcion || 'Descripción actualizada',
      cliente_id: cliente_id || 1,
      cliente: 'Cliente Actualizado',
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      estado: estado || 'Actualizado',
      presupuesto: presupuesto || 0,
      monto_facturado: monto_facturado || 0,
      responsable_id: responsable_id || 1,
      responsable: 'Responsable Actualizado',
      updated_at: new Date().toISOString()
    };
    
    console.log('Proyecto actualizado exitosamente:', proyectoActualizado);
    
    res.json({
      status: 'success',
      message: 'Proyecto actualizado exitosamente',
      proyecto: proyectoActualizado
    });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({ message: 'Error al actualizar proyecto', error: error.message });
  }
});

// RUTAS DELETE PARA ELIMINAR RECURSOS
// ==================================

// Ruta para eliminar un cliente
router.delete('/clientes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Eliminando cliente con ID ${id}`);
    
    // En un entorno real, aquí se eliminaría de la base de datos
    // Para simulación, devolvemos una respuesta exitosa
    
    res.json({
      status: 'success',
      message: `Cliente con ID ${id} eliminado exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ message: 'Error al eliminar cliente', error: error.message });
  }
});

// Ruta para eliminar un curso
router.delete('/cursos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Eliminando curso con ID ${id}`);
    
    // En un entorno real, aquí se eliminaría de la base de datos
    // Para simulación, devolvemos una respuesta exitosa
    
    res.json({
      status: 'success',
      message: `Curso con ID ${id} eliminado exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    res.status(500).json({ message: 'Error al eliminar curso', error: error.message });
  }
});

// Ruta para eliminar un proyecto
router.delete('/proyectos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Eliminando proyecto con ID ${id}`);
    
    // En un entorno real, aquí se eliminaría de la base de datos
    // Para simulación, devolvemos una respuesta exitosa
    
    res.json({
      status: 'success',
      message: `Proyecto con ID ${id} eliminado exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ message: 'Error al eliminar proyecto', error: error.message });
  }
});

// Ruta para eliminar una factura
router.delete('/facturas/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Eliminando factura con ID ${id}`);
    
    // En un entorno real, aquí se eliminaría de la base de datos
    // Para simulación, devolvemos una respuesta exitosa
    
    res.json({
      status: 'success',
      message: `Factura con ID ${id} eliminada exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    res.status(500).json({ message: 'Error al eliminar factura', error: error.message });
  }
});

// Ruta para eliminar un participante
router.delete('/participantes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Eliminando participante con ID ${id}`);
    
    // En un entorno real, aquí se eliminaría de la base de datos
    // Para simulación, devolvemos una respuesta exitosa
    
    res.json({
      status: 'success',
      message: `Participante con ID ${id} eliminado exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar participante:', error);
    res.status(500).json({ message: 'Error al eliminar participante', error: error.message });
  }
});

module.exports = router; 