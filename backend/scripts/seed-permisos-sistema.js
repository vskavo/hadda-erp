require('dotenv').config();
const { Sequelize } = require('sequelize');

/**
 * Script para crear todos los permisos del sistema durante el deploy inicial
 * Se ejecuta automáticamente en el docker-entrypoint.sh
 */

async function seedPermisosSistema() {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  );

  try {
    console.log('🔑 Inicializando permisos del sistema...\n');

    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');

    // Definir todos los permisos del sistema
    const permisosDelSistema = [
      // Administración
      {
        nombre: 'Acceso Total (Admin)',
        descripcion: 'Permite realizar cualquier acción en el sistema.',
        modulo: 'Administración',
        codigo: 'ADMIN_FULL_ACCESS',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Gestionar Usuarios',
        descripcion: 'Permite crear, ver, editar y eliminar usuarios.',
        modulo: 'Administración',
        codigo: 'admin:users:manage',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Gestionar Roles y Permisos',
        descripcion: 'Permite crear, ver, editar y eliminar roles y asignar permisos.',
        modulo: 'Administración',
        codigo: 'admin:roles:manage',
        sistema: true,
        activo: true
      },

      // Clientes
      {
        nombre: 'Ver Clientes',
        descripcion: 'Permite ver la lista de clientes y sus detalles.',
        modulo: 'Clientes',
        codigo: 'clientes:read',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Crear Clientes',
        descripcion: 'Permite crear nuevos clientes.',
        modulo: 'Clientes',
        codigo: 'clientes:create',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Editar Clientes',
        descripcion: 'Permite modificar la información de clientes existentes.',
        modulo: 'Clientes',
        codigo: 'clientes:update',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Eliminar Clientes',
        descripcion: 'Permite eliminar clientes.',
        modulo: 'Clientes',
        codigo: 'clientes:delete',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Gestionar Contactos Cliente',
        descripcion: 'Permite gestionar los contactos asociados a un cliente.',
        modulo: 'Clientes',
        codigo: 'clientes:contactos:manage',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Gestionar Actividades Cliente',
        descripcion: 'Permite gestionar las actividades asociadas a un cliente.',
        modulo: 'Clientes',
        codigo: 'clientes:actividades:manage',
        sistema: true,
        activo: true
      },

      // Proyectos
      {
        nombre: 'Ver Proyectos',
        descripcion: 'Permite ver la lista de los proyectos asignados a este usuario',
        modulo: 'Proyectos',
        codigo: 'proyectos:read',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Crear Proyectos',
        descripcion: 'Permite crear nuevos proyectos.',
        modulo: 'Proyectos',
        codigo: 'proyectos:create',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Editar Proyectos',
        descripcion: 'Permite modificar la información de proyectos existentes.',
        modulo: 'Proyectos',
        codigo: 'proyectos:update',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Eliminar Proyectos',
        descripcion: 'Permite eliminar proyectos.',
        modulo: 'Proyectos',
        codigo: 'proyectos:delete',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Ver Rentabilidad Proyecto',
        descripcion: 'Permite ver el análisis de rentabilidad de un proyecto.',
        modulo: 'Proyectos',
        codigo: 'proyectos:rentabilidad:read',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Ver Seguimiento Proyecto',
        descripcion: 'Permite ver el seguimiento y avance de un proyecto.',
        modulo: 'Proyectos',
        codigo: 'proyectos:seguimiento:read',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Ver Todos los Proyectos',
        descripcion: 'Permite ver todos los proyectos del sistema',
        modulo: 'Proyectos',
        codigo: 'proyectos:read:all',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Asignar Responsable de Proyecto',
        descripcion: 'Permite asignar o modificar el responsable de un proyecto.',
        modulo: 'Proyectos',
        codigo: 'proyectos:assign:responsable',
        sistema: true,
        activo: true
      },

      // Cursos
      {
        nombre: 'Ver Cursos',
        descripcion: 'Permite ver la lista de cursos y sus detalles.',
        modulo: 'Cursos',
        codigo: 'cursos:read',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Crear Cursos',
        descripcion: 'Permite crear nuevos cursos.',
        modulo: 'Cursos',
        codigo: 'cursos:create',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Editar Cursos',
        descripcion: 'Permite modificar la información de cursos existentes.',
        modulo: 'Cursos',
        codigo: 'cursos:update',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Eliminar Cursos',
        descripcion: 'Permite eliminar cursos.',
        modulo: 'Cursos',
        codigo: 'cursos:delete',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Gestionar Participantes Curso',
        descripcion: 'Permite añadir/editar/eliminar participantes de un curso.',
        modulo: 'Cursos',
        codigo: 'cursos:participantes:manage',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Gestionar Sesiones Curso',
        descripcion: 'Permite crear/editar/eliminar sesiones de un curso.',
        modulo: 'Cursos',
        codigo: 'cursos:sesiones:manage',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Registrar Asistencia Curso',
        descripcion: 'Permite registrar la asistencia a las sesiones de un curso.',
        modulo: 'Cursos',
        codigo: 'cursos:asistencia:manage',
        sistema: true,
        activo: true
      },

      // Finanzas
      {
        nombre: 'Ver Dashboard Financiero',
        descripcion: 'Permite acceder al resumen financiero.',
        modulo: 'Finanzas',
        codigo: 'finanzas:dashboard:read',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Gestionar Facturas',
        descripcion: 'Permite crear, ver, editar y anular facturas.',
        modulo: 'Finanzas',
        codigo: 'finanzas:facturas:manage',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Gestionar Movimientos',
        descripcion: 'Permite registrar y ver ingresos/egresos.',
        modulo: 'Finanzas',
        codigo: 'finanzas:movimientos:manage',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Realizar Conciliación Bancaria',
        descripcion: 'Permite acceder y usar la herramienta de conciliación.',
        modulo: 'Finanzas',
        codigo: 'finanzas:conciliacion:manage',
        sistema: true,
        activo: true
      },

      // Ventas
      {
        nombre: 'Ver Ventas',
        descripcion: 'Permite ver la lista de ventas y sus detalles.',
        modulo: 'Ventas',
        codigo: 'ventas:read',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Crear Ventas',
        descripcion: 'Permite crear nuevos registros de venta.',
        modulo: 'Ventas',
        codigo: 'ventas:create',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Editar Ventas',
        descripcion: 'Permite modificar ventas existentes.',
        modulo: 'Ventas',
        codigo: 'ventas:update',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Eliminar Ventas',
        descripcion: 'Permite eliminar registros de venta.',
        modulo: 'Ventas',
        codigo: 'ventas:delete',
        sistema: true,
        activo: true
      },

      // Reportes
      {
        nombre: 'Ver Lista de Reportes',
        descripcion: 'Permite acceder a la lista de reportes predefinidos.',
        modulo: 'Reportes',
        codigo: 'reportes:list:read',
        sistema: true,
        activo: true
      },
      {
        nombre: 'Generar Reportes',
        descripcion: 'Permite usar el generador de reportes personalizados.',
        modulo: 'Reportes',
        codigo: 'reportes:generate',
        sistema: true,
        activo: true
      },

      // Dashboard
      {
        nombre: 'Ver Dashboard Principal',
        descripcion: 'Permite acceder al dashboard principal de la aplicación.',
        modulo: 'Dashboard',
        codigo: 'dashboard:read',
        sistema: true,
        activo: true
      },

      // Usuarios
      {
        nombre: 'Ver Lista de Usuarios',
        descripcion: 'Permite ver la lista de usuarios del sistema (útil para selectores, etc.)',
        modulo: 'Usuarios',
        codigo: 'usuarios:read:list',
        sistema: true,
        activo: true
      }
    ];

    console.log(`\n📝 Insertando ${permisosDelSistema.length} permisos del sistema...\n`);

    let permisosCreados = 0;
    let permisosExistentes = 0;

    // Insertar cada permiso (idempotente - no duplicar si ya existe)
    for (const permiso of permisosDelSistema) {
      try {
        // Verificar si ya existe
        const [existentes] = await sequelize.query(
          `SELECT id FROM permisos WHERE codigo = :codigo LIMIT 1`,
          {
            replacements: { codigo: permiso.codigo }
          }
        );

        if (existentes.length === 0) {
          // No existe, crearlo
          await sequelize.query(
            `INSERT INTO permisos (nombre, descripcion, modulo, codigo, sistema, activo, created_at, updated_at)
             VALUES (:nombre, :descripcion, :modulo, :codigo, :sistema, :activo, NOW(), NOW())`,
            {
              replacements: {
                nombre: permiso.nombre,
                descripcion: permiso.descripcion,
                modulo: permiso.modulo,
                codigo: permiso.codigo,
                sistema: permiso.sistema,
                activo: permiso.activo
              }
            }
          );
          console.log(`  ✅ Creado: ${permiso.codigo} - ${permiso.nombre}`);
          permisosCreados++;
        } else {
          console.log(`  ⏭️  Ya existe: ${permiso.codigo}`);
          permisosExistentes++;
        }
      } catch (error) {
        console.error(`  ❌ Error al crear permiso ${permiso.codigo}:`, error.message);
      }
    }

    console.log('\n========================================');
    console.log(`✅ Permisos creados: ${permisosCreados}`);
    console.log(`⏭️  Permisos existentes: ${permisosExistentes}`);
    console.log(`📊 Total de permisos en el sistema: ${permisosCreados + permisosExistentes}`);
    console.log('========================================\n');

    // Verificar el total de permisos en la BD
    const [totalPermisos] = await sequelize.query(
      'SELECT COUNT(*) as count FROM permisos'
    );

    console.log(`🔍 Verificación: ${totalPermisos[0].count} permisos en la base de datos\n`);

    await sequelize.close();

    return {
      success: true,
      permisosCreados,
      permisosExistentes,
      total: permisosCreados + permisosExistentes
    };

  } catch (error) {
    console.error('❌ Error al crear permisos del sistema:', error);
    console.error('Stack:', error.stack);
    
    try {
      await sequelize.close();
    } catch (closeError) {
      // Ignorar error al cerrar
    }

    // No fallar el deploy, solo advertir
    return {
      success: false,
      error: error.message
    };
  }
}

// Ejecutar solo si se llama directamente (no desde otro script)
if (require.main === module) {
  seedPermisosSistema()
    .then((result) => {
      if (result.success) {
        console.log('🎉 Seeders de permisos ejecutados exitosamente!');
        process.exit(0);
      } else {
        console.error('⚠️  Hubo problemas al ejecutar los seeders de permisos');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedPermisosSistema };

