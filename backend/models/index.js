const { Sequelize } = require('sequelize');
const Pool = require('sequelize-pool').Pool;

// Verificar si la base de datos está habilitada
const dbEnabled = process.env.DB_ENABLED !== 'false';

let sequelize;

if (dbEnabled) {
  // Configuración de la conexión a la base de datos
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      // Configuración optimizada del pool de conexiones
      pool: {
        max: 10,                // Aumentamos a 10 conexiones máximas (más conexiones disponibles)
        min: 0,                 // Iniciar sin conexiones y crearlas según demanda
        acquire: 30000,         // 30 segundos máximo para obtener una conexión
        idle: 20000,            // 20 segundos de tiempo inactivo antes de cerrar la conexión
        evict: 20000,           // Verificar conexiones inactivas cada 20 segundos
        validate: (connection) => {
          return connection.query('SELECT 1+1 AS result')
            .then(() => true)
            .catch(err => {
              console.log('Conexión inválida, cerrando:', err.message);
              return false;
            });
        }
      },
      retry: {
        max: 5,                 // Aumentamos a 5 intentos de reconexión
        match: [
          /ConnectionAcquireTimeoutError/,
          /ConnectionRefusedError/,
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/,
          /TimeoutError/
        ]
      },
      dialectOptions: {
        // Para compatibilidad con formatos de fecha en PostgreSQL
        useUTC: false,
        // Configuración SSL para PostgreSQL
        ssl: {
          require: true,
          rejectUnauthorized: false // Necesario para conectar a Azure PostgreSQL
        },
        // Configuración adicional de timeout para conexiones
        connectTimeout: 30000,   // 30 segundos para establecer conexión
        statement_timeout: 30000, // 30 segundos para ejecutar consultas
        idle_in_transaction_session_timeout: 30000 // 30 segundos para transacciones inactivas
      },
      timezone: process.env.DB_TIMEZONE || '+00:00',
      
      // Configuración para usar snake_case en PostgreSQL
      define: {
        timestamps: true,
        underscored: true, // Utiliza snake_case para columnas
        underscoredAll: true, // Utiliza snake_case para todos los atributos
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    }
  );

  // Log de debug para conexión - usar solo si es necesario
  if (process.env.NODE_ENV === 'development') {
    sequelize.authenticate()
      .then(() => console.log('Conexión a la base de datos establecida correctamente.'))
      .catch(err => {
        console.error('Error al conectar con la base de datos:', err);
        console.error('Detalles de la conexión:', {
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          ssl: true
        });
      });
  }
} else {
  console.log('Modo sin base de datos activado - Se usarán modelos simulados');
  
  // Crear un objeto Sequelize simulado
  sequelize = {
    define: () => ({ findOne: () => null, findAll: () => [], findByPk: () => null }),
    authenticate: async () => Promise.resolve(),
    query: async () => [{ now: new Date().toISOString() }],
    QueryTypes: { SELECT: 'SELECT' },
    close: () => Promise.resolve() // Añadimos un método close simulado
  };
}

// Función para cerrar todas las conexiones
const closeConnections = async () => {
  if (dbEnabled && sequelize) {
    console.log('Cerrando conexiones a la base de datos...');
    try {
      await sequelize.close();
      console.log('Conexiones cerradas correctamente');
    } catch (error) {
      console.error('Error al cerrar conexiones:', error);
    }
  }
};

// Importar modelos
const Usuario = require('./usuario.model')(sequelize);
const Cliente = require('./cliente.model')(sequelize);
const Contacto = require('./contacto.model')(sequelize);
const SeguimientoCliente = require('./seguimientoCliente.model')(sequelize);
const Curso = require('./curso.model')(sequelize);
const CursoSence = require('./cursoSence.model')(sequelize);
const Factura = require('./factura.model')(sequelize);
const Proyecto = require('./proyecto.model')(sequelize);
const Participante = require('./participante.model')(sequelize);
const DeclaracionJurada = require('./declaracionJurada.model')(sequelize);
const Ingreso = require('./ingreso.model')(sequelize);
const Egreso = require('./egreso.model')(sequelize);
const SiiIngreso = require('./sii_ingreso.model')(sequelize);
const SiiEgreso = require('./sii_egreso.model')(sequelize);
const CuentaBancaria = require('./cuentaBancaria.model')(sequelize);
const Remuneracion = require('./remuneracion.model')(sequelize);
const Cotizacion = require('./cotizacion.model')(sequelize);
const Venta = require('./venta.model')(sequelize);
const CostoProyecto = require('./costoProyecto.model')(sequelize);
const Reporte = require('./reporte.model')(sequelize);
const ReporteTemplate = require('./reporteTemplate.model')(sequelize);
const Rol = require('./rol.model')(sequelize);
const Permiso = require('./permiso.model')(sequelize);
const RolPermiso = require('./rolPermiso.model')(sequelize);
const Sesion = require('./sesion.model')(sequelize);
const Asistencia = require('./asistencia.model')(sequelize);
const { ConciliacionBancaria, MovimientoConciliacion } = require('./conciliacionBancaria.model')(sequelize);
const AvanceProyecto = require('./avanceProyecto.model')(sequelize);
const HitoProyecto = require('./hitoProyecto.model')(sequelize);
const Setting = require('./setting.model')(sequelize);
const Comision = require('./comision.model')(sequelize);
const OtecData = require('./otec_data.model')(sequelize);
const UsuarioSence = require('./usuarios_sence.model')(sequelize);
const UsuarioSii = require('./usuario_sii.model')(sequelize);

// Definir relaciones entre modelos
Cliente.hasMany(Proyecto, { foreignKey: 'cliente_id' });
Proyecto.belongsTo(Cliente, { foreignKey: 'cliente_id' });

Cliente.hasMany(Factura, { foreignKey: 'cliente_id' });
Factura.belongsTo(Cliente, { foreignKey: 'cliente_id' });

Proyecto.hasMany(Factura, { foreignKey: 'proyecto_id' });
Factura.belongsTo(Proyecto, { foreignKey: 'proyecto_id' });

Cliente.hasMany(Cotizacion, { foreignKey: 'cliente_id' });
Cotizacion.belongsTo(Cliente, { foreignKey: 'cliente_id' });

Cliente.hasMany(Venta, { foreignKey: 'cliente_id' });
Venta.belongsTo(Cliente, { foreignKey: 'cliente_id' });

// Relaciones para el modulo de clientes
Cliente.hasMany(Contacto, { foreignKey: 'cliente_id' });
Contacto.belongsTo(Cliente, { foreignKey: 'cliente_id' });

Cliente.hasMany(SeguimientoCliente, { foreignKey: 'cliente_id' });
SeguimientoCliente.belongsTo(Cliente, { foreignKey: 'cliente_id' });

Contacto.hasMany(SeguimientoCliente, { foreignKey: 'contacto_id' });
SeguimientoCliente.belongsTo(Contacto, { foreignKey: 'contacto_id' });

Usuario.hasMany(SeguimientoCliente, { foreignKey: 'usuario_id' });
SeguimientoCliente.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Proyecto.hasMany(Ingreso, { foreignKey: 'proyecto_id' });
Ingreso.belongsTo(Proyecto, { foreignKey: 'proyecto_id' });

Proyecto.hasMany(Egreso, { foreignKey: 'proyecto_id' });
Egreso.belongsTo(Proyecto, { foreignKey: 'proyecto_id' });

Proyecto.hasMany(CostoProyecto, { foreignKey: 'proyecto_id' });
CostoProyecto.belongsTo(Proyecto, { foreignKey: 'proyecto_id' });

// Relaciones para seguimiento de proyectos
Proyecto.hasMany(AvanceProyecto, { foreignKey: 'proyecto_id', as: 'Avances' });
AvanceProyecto.belongsTo(Proyecto, { foreignKey: 'proyecto_id' });

Usuario.hasMany(AvanceProyecto, { foreignKey: 'usuario_id' });
AvanceProyecto.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Proyecto.hasMany(HitoProyecto, { foreignKey: 'proyecto_id', as: 'Hitos' });
HitoProyecto.belongsTo(Proyecto, { foreignKey: 'proyecto_id' });

Usuario.hasMany(HitoProyecto, { foreignKey: 'usuario_id' });
HitoProyecto.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Usuario.hasMany(Proyecto, { foreignKey: 'responsable_id', as: 'ProyectosResponsable' });
Proyecto.belongsTo(Usuario, { foreignKey: 'responsable_id', as: 'Responsable' });

Curso.hasMany(Participante, { foreignKey: 'curso_id' });
Participante.belongsTo(Curso, { foreignKey: 'curso_id' });

Curso.hasMany(DeclaracionJurada, { 
  foreignKey: 'id_sence',
  sourceKey: 'id_sence'  // La clave en el modelo Curso
});
DeclaracionJurada.belongsTo(Curso, { 
  foreignKey: 'id_sence',
  targetKey: 'id_sence'  // La clave en el modelo Curso
});

// Relaciones para control de asistencia
Curso.hasMany(Sesion, { foreignKey: 'curso_id' });
Sesion.belongsTo(Curso, { foreignKey: 'curso_id' });

Usuario.hasMany(Sesion, { foreignKey: 'usuario_id' });
Sesion.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Participante.hasMany(Asistencia, { foreignKey: 'participante_id' });
Asistencia.belongsTo(Participante, { foreignKey: 'participante_id' });

Curso.hasMany(Asistencia, { foreignKey: 'curso_id' });
Asistencia.belongsTo(Curso, { foreignKey: 'curso_id' });

Usuario.hasMany(Asistencia, { foreignKey: 'usuario_id' });
Asistencia.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Relaciones para reportes
ReporteTemplate.hasMany(Reporte, { foreignKey: 'template_id' });
Reporte.belongsTo(ReporteTemplate, { foreignKey: 'template_id' });

Usuario.hasMany(Reporte, { foreignKey: 'usuario_id' });
Reporte.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Usuario.hasMany(ReporteTemplate, { foreignKey: 'usuario_id', as: 'TemplatesCreados' });
ReporteTemplate.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Relaciones para roles y permisos
Rol.belongsToMany(Permiso, { 
  through: RolPermiso,
  foreignKey: 'rol_id',
  otherKey: 'permiso_id',
  as: 'permisos'
});

Permiso.belongsToMany(Rol, { 
  through: RolPermiso,
  foreignKey: 'permiso_id',
  otherKey: 'rol_id',
  as: 'roles'
});

// Relación entre Usuario y Rol
Usuario.belongsTo(Rol, { 
  foreignKey: 'rol_id', 
  as: 'Rol' // Alias usado en auth.controller para obtener nombre
}); 
Rol.hasMany(Usuario, { 
  foreignKey: 'rol_id' 
});

// Relaciones para conciliaciones bancarias
CuentaBancaria.hasMany(ConciliacionBancaria, { foreignKey: 'cuenta_bancaria_id', as: 'Conciliaciones' });
ConciliacionBancaria.belongsTo(CuentaBancaria, { foreignKey: 'cuenta_bancaria_id', as: 'CuentaBancaria' });

Usuario.hasMany(ConciliacionBancaria, { foreignKey: 'usuario_id', as: 'Conciliaciones' });
ConciliacionBancaria.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });

// Relaciones entre Proyecto y Curso
Proyecto.hasMany(Curso, { foreignKey: 'proyecto_id', as: 'Cursos' });
Curso.belongsTo(Proyecto, { foreignKey: 'proyecto_id', as: 'Proyecto' });

// Revertir relaciones entre Comision y Rol a la forma estándar
Comision.belongsTo(Rol, { foreignKey: 'rol_id' }); 
Rol.hasMany(Comision, { foreignKey: 'rol_id' });

// Relación entre Ingreso y Cliente
Cliente.hasMany(Ingreso, { foreignKey: 'cliente_id' });
Ingreso.belongsTo(Cliente, { foreignKey: 'cliente_id' });

// Relación entre Ingreso y Factura
Factura.hasMany(Ingreso, { foreignKey: 'factura_id' });
Ingreso.belongsTo(Factura, { foreignKey: 'factura_id' });

// Relación entre Ingreso y CuentaBancaria (con alias)
CuentaBancaria.hasMany(Ingreso, { foreignKey: 'cuenta_bancaria_id', as: 'CuentaBancaria' });
Ingreso.belongsTo(CuentaBancaria, { foreignKey: 'cuenta_bancaria_id', as: 'CuentaBancaria' });

// Relación entre Ingreso y Usuario
Usuario.hasMany(Ingreso, { foreignKey: 'usuario_id' });
Ingreso.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Relación entre Egreso y CuentaBancaria (con alias único)
CuentaBancaria.hasMany(Egreso, { foreignKey: 'cuenta_bancaria_id', as: 'CuentaBancariaEgreso' });
Egreso.belongsTo(CuentaBancaria, { foreignKey: 'cuenta_bancaria_id', as: 'CuentaBancariaEgreso' });

// Relación entre Egreso y Usuario
Usuario.hasMany(Egreso, { foreignKey: 'usuario_id', as: 'Egresos' });
Egreso.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });

// Relación entre Venta y Proyecto
Venta.belongsTo(Proyecto, { foreignKey: 'proyecto_id' });
Proyecto.hasMany(Venta, { foreignKey: 'proyecto_id' });

// Relación de propietario de cliente
Cliente.belongsTo(Usuario, { foreignKey: 'owner', as: 'Owner' });
Usuario.hasMany(Cliente, { foreignKey: 'owner', as: 'ClientesPropios' });

// Relaciones para SII Ingresos y Egresos
Proyecto.hasMany(SiiIngreso, { foreignKey: 'proyecto_id' });
SiiIngreso.belongsTo(Proyecto, { foreignKey: 'proyecto_id', as: 'Proyecto' });

Proyecto.hasMany(SiiEgreso, { foreignKey: 'proyecto_id' });
SiiEgreso.belongsTo(Proyecto, { foreignKey: 'proyecto_id', as: 'Proyecto' });

// Exportar modelos, conexión y funciones
module.exports = {
  sequelize,
  dbEnabled,
  closeConnections,
  Usuario,
  Cliente,
  Contacto,
  SeguimientoCliente,
  Curso,
  CursoSence,
  Factura,
  Proyecto,
  Participante,
  DeclaracionJurada,
  Ingreso,
  Egreso,
  SiiIngreso,
  SiiEgreso,
  CuentaBancaria,
  Remuneracion,
  Cotizacion,
  Venta,
  CostoProyecto,
  Reporte,
  ReporteTemplate,
  Rol,
  Permiso,
  RolPermiso,
  Sesion,
  Asistencia,
  ConciliacionBancaria,
  MovimientoConciliacion,
  AvanceProyecto,
  HitoProyecto,
  Setting,
  Comision,
  OtecData,
  UsuarioSence,
  UsuarioSii
}; 