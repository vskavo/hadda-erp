require('dotenv').config();
const { sequelize } = require('../models');

/**
 * Script de verificación de permisos del sistema
 * Verifica que todos los permisos necesarios estén creados
 * y que el rol administrador tenga todos asignados
 */

const PERMISOS_ESPERADOS = [
  'ADMIN_FULL_ACCESS',
  'admin:users:manage',
  'admin:roles:manage',
  'clientes:read',
  'clientes:create',
  'clientes:update',
  'clientes:delete',
  'clientes:contactos:manage',
  'clientes:actividades:manage',
  'proyectos:read',
  'proyectos:create',
  'proyectos:update',
  'proyectos:delete',
  'proyectos:rentabilidad:read',
  'proyectos:seguimiento:read',
  'proyectos:read:all',
  'proyectos:assign:responsable',
  'cursos:read',
  'cursos:create',
  'cursos:update',
  'cursos:delete',
  'cursos:participantes:manage',
  'cursos:sesiones:manage',
  'cursos:asistencia:manage',
  'finanzas:dashboard:read',
  'finanzas:facturas:manage',
  'finanzas:movimientos:manage',
  'finanzas:conciliacion:manage',
  'ventas:read',
  'ventas:create',
  'ventas:update',
  'ventas:delete',
  'reportes:list:read',
  'reportes:generate',
  'dashboard:read',
  'usuarios:read:list'
];

async function verificarPermisosSistema() {
  try {
    console.log('\n🔍 Verificando permisos del sistema...\n');
    console.log('========================================');

    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida\n');

    // 1. Verificar total de permisos
    const [totalPermisos] = await sequelize.query(
      'SELECT COUNT(*) as count FROM permisos'
    );
    console.log(`📊 Total de permisos en la BD: ${totalPermisos[0].count}`);
    console.log(`📋 Permisos esperados: ${PERMISOS_ESPERADOS.length}\n`);

    // 2. Verificar cada permiso esperado
    console.log('🔎 Verificando permisos individuales:\n');

    const permisosFaltantes = [];
    const permisosEncontrados = [];

    for (const codigo of PERMISOS_ESPERADOS) {
      const [permiso] = await sequelize.query(
        `SELECT id, nombre, modulo FROM permisos WHERE codigo = :codigo LIMIT 1`,
        { replacements: { codigo } }
      );

      if (permiso.length > 0) {
        console.log(`  ✅ ${codigo}`);
        permisosEncontrados.push({
          codigo,
          id: permiso[0].id,
          nombre: permiso[0].nombre,
          modulo: permiso[0].modulo
        });
      } else {
        console.log(`  ❌ ${codigo} - FALTANTE`);
        permisosFaltantes.push(codigo);
      }
    }

    console.log('\n========================================');
    console.log(`✅ Permisos encontrados: ${permisosEncontrados.length}`);
    console.log(`❌ Permisos faltantes: ${permisosFaltantes.length}`);
    console.log('========================================\n');

    if (permisosFaltantes.length > 0) {
      console.log('⚠️  PERMISOS FALTANTES:');
      permisosFaltantes.forEach(codigo => console.log(`  - ${codigo}`));
      console.log('\n💡 Ejecuta el seeder para crear los permisos faltantes:');
      console.log('   node backend/scripts/seed-permisos-sistema.js\n');
    }

    // 3. Verificar rol administrador
    console.log('👤 Verificando rol administrador...\n');

    const [rolAdmin] = await sequelize.query(
      `SELECT id, nombre FROM roles WHERE LOWER(nombre) = 'administrador' LIMIT 1`
    );

    if (rolAdmin.length === 0) {
      console.log('❌ Rol administrador no encontrado\n');
      await sequelize.close();
      return;
    }

    const rolId = rolAdmin[0].id;
    console.log(`✅ Rol administrador encontrado (ID: ${rolId})\n`);

    // 4. Verificar permisos asignados al rol administrador
    const [permisosRol] = await sequelize.query(
      `SELECT p.codigo, p.nombre, p.modulo
       FROM rol_permisos rp
       JOIN permisos p ON rp.permiso_id = p.id
       WHERE rp.rol_id = :rolId
       ORDER BY p.modulo, p.nombre`,
      { replacements: { rolId } }
    );

    console.log(`📊 Permisos asignados al rol administrador: ${permisosRol.length}\n`);

    // Agrupar por módulo
    const permisosPorModulo = {};
    permisosRol.forEach(p => {
      if (!permisosPorModulo[p.modulo]) {
        permisosPorModulo[p.modulo] = [];
      }
      permisosPorModulo[p.modulo].push(p);
    });

    console.log('📋 Permisos por módulo:\n');
    Object.keys(permisosPorModulo).sort().forEach(modulo => {
      console.log(`\n  ${modulo}:`);
      permisosPorModulo[modulo].forEach(p => {
        console.log(`    ✅ ${p.codigo}`);
      });
    });

    console.log('\n========================================');

    // 5. Verificar permisos faltantes en el rol administrador
    const codigosAsignados = permisosRol.map(p => p.codigo);
    const permisosFaltantesEnRol = PERMISOS_ESPERADOS.filter(
      codigo => !codigosAsignados.includes(codigo)
    );

    if (permisosFaltantesEnRol.length > 0) {
      console.log('\n⚠️  PERMISOS NO ASIGNADOS AL ROL ADMINISTRADOR:');
      permisosFaltantesEnRol.forEach(codigo => console.log(`  - ${codigo}`));
      console.log('\n💡 Ejecuta el script para asignar los permisos faltantes:');
      console.log('   node backend/scripts/seed-permisos-sistema.js\n');
    } else {
      console.log('\n✅ Todos los permisos del sistema están asignados al rol administrador\n');
    }

    // 6. Resumen final
    console.log('========================================');
    console.log('📊 RESUMEN:');
    console.log('========================================');
    console.log(`Permisos en BD:        ${totalPermisos[0].count}`);
    console.log(`Permisos esperados:    ${PERMISOS_ESPERADOS.length}`);
    console.log(`Permisos faltantes:    ${permisosFaltantes.length}`);
    console.log(`Permisos en rol admin: ${permisosRol.length}`);
    console.log(`Faltantes en rol:      ${permisosFaltantesEnRol.length}`);
    console.log('========================================\n');

    if (permisosFaltantes.length === 0 && permisosFaltantesEnRol.length === 0) {
      console.log('✅ ¡Todo está correcto! El sistema tiene todos los permisos necesarios.\n');
    } else {
      console.log('⚠️  Hay permisos faltantes. Ejecuta el seeder para corregir.\n');
    }

    await sequelize.close();

  } catch (error) {
    console.error('\n❌ Error al verificar permisos:', error);
    console.error('Stack:', error.stack);
    try {
      await sequelize.close();
    } catch (closeError) {
      // Ignorar
    }
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verificarPermisosSistema();
}

module.exports = { verificarPermisosSistema };

