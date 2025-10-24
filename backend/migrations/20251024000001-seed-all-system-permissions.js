'use strict';

/**
 * Migración para crear todos los permisos del sistema
 * Esta migración asegura que todos los permisos necesarios existan
 * tanto en instalaciones nuevas como en las existentes
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('\n🔑 Creando permisos del sistema...\n');

    // Definir todos los permisos del sistema
    const permisosDelSistema = [
      // Administración
      { nombre: 'Acceso Total (Admin)', descripcion: 'Permite realizar cualquier acción en el sistema.', modulo: 'Administración', codigo: 'ADMIN_FULL_ACCESS', sistema: true, activo: true },
      { nombre: 'Gestionar Usuarios', descripcion: 'Permite crear, ver, editar y eliminar usuarios.', modulo: 'Administración', codigo: 'admin:users:manage', sistema: true, activo: true },
      { nombre: 'Gestionar Roles y Permisos', descripcion: 'Permite crear, ver, editar y eliminar roles y asignar permisos.', modulo: 'Administración', codigo: 'admin:roles:manage', sistema: true, activo: true },

      // Clientes
      { nombre: 'Ver Clientes', descripcion: 'Permite ver la lista de clientes y sus detalles.', modulo: 'Clientes', codigo: 'clientes:read', sistema: true, activo: true },
      { nombre: 'Crear Clientes', descripcion: 'Permite crear nuevos clientes.', modulo: 'Clientes', codigo: 'clientes:create', sistema: true, activo: true },
      { nombre: 'Editar Clientes', descripcion: 'Permite modificar la información de clientes existentes.', modulo: 'Clientes', codigo: 'clientes:update', sistema: true, activo: true },
      { nombre: 'Eliminar Clientes', descripcion: 'Permite eliminar clientes.', modulo: 'Clientes', codigo: 'clientes:delete', sistema: true, activo: true },
      { nombre: 'Gestionar Contactos Cliente', descripcion: 'Permite gestionar los contactos asociados a un cliente.', modulo: 'Clientes', codigo: 'clientes:contactos:manage', sistema: true, activo: true },
      { nombre: 'Gestionar Actividades Cliente', descripcion: 'Permite gestionar las actividades asociadas a un cliente.', modulo: 'Clientes', codigo: 'clientes:actividades:manage', sistema: true, activo: true },

      // Proyectos
      { nombre: 'Ver Proyectos', descripcion: 'Permite ver la lista de los proyectos asignados a este usuario', modulo: 'Proyectos', codigo: 'proyectos:read', sistema: true, activo: true },
      { nombre: 'Crear Proyectos', descripcion: 'Permite crear nuevos proyectos.', modulo: 'Proyectos', codigo: 'proyectos:create', sistema: true, activo: true },
      { nombre: 'Editar Proyectos', descripcion: 'Permite modificar la información de proyectos existentes.', modulo: 'Proyectos', codigo: 'proyectos:update', sistema: true, activo: true },
      { nombre: 'Eliminar Proyectos', descripcion: 'Permite eliminar proyectos.', modulo: 'Proyectos', codigo: 'proyectos:delete', sistema: true, activo: true },
      { nombre: 'Ver Rentabilidad Proyecto', descripcion: 'Permite ver el análisis de rentabilidad de un proyecto.', modulo: 'Proyectos', codigo: 'proyectos:rentabilidad:read', sistema: true, activo: true },
      { nombre: 'Ver Seguimiento Proyecto', descripcion: 'Permite ver el seguimiento y avance de un proyecto.', modulo: 'Proyectos', codigo: 'proyectos:seguimiento:read', sistema: true, activo: true },
      { nombre: 'Ver Todos los Proyectos', descripcion: 'Permite ver todos los proyectos del sistema', modulo: 'Proyectos', codigo: 'proyectos:read:all', sistema: true, activo: true },
      { nombre: 'Asignar Responsable de Proyecto', descripcion: 'Permite asignar o modificar el responsable de un proyecto.', modulo: 'Proyectos', codigo: 'proyectos:assign:responsable', sistema: true, activo: true },

      // Cursos
      { nombre: 'Ver Cursos', descripcion: 'Permite ver la lista de cursos y sus detalles.', modulo: 'Cursos', codigo: 'cursos:read', sistema: true, activo: true },
      { nombre: 'Crear Cursos', descripcion: 'Permite crear nuevos cursos.', modulo: 'Cursos', codigo: 'cursos:create', sistema: true, activo: true },
      { nombre: 'Editar Cursos', descripcion: 'Permite modificar la información de cursos existentes.', modulo: 'Cursos', codigo: 'cursos:update', sistema: true, activo: true },
      { nombre: 'Eliminar Cursos', descripcion: 'Permite eliminar cursos.', modulo: 'Cursos', codigo: 'cursos:delete', sistema: true, activo: true },
      { nombre: 'Gestionar Participantes Curso', descripcion: 'Permite añadir/editar/eliminar participantes de un curso.', modulo: 'Cursos', codigo: 'cursos:participantes:manage', sistema: true, activo: true },
      { nombre: 'Gestionar Sesiones Curso', descripcion: 'Permite crear/editar/eliminar sesiones de un curso.', modulo: 'Cursos', codigo: 'cursos:sesiones:manage', sistema: true, activo: true },
      { nombre: 'Registrar Asistencia Curso', descripcion: 'Permite registrar la asistencia a las sesiones de un curso.', modulo: 'Cursos', codigo: 'cursos:asistencia:manage', sistema: true, activo: true },

      // Finanzas
      { nombre: 'Ver Dashboard Financiero', descripcion: 'Permite acceder al resumen financiero.', modulo: 'Finanzas', codigo: 'finanzas:dashboard:read', sistema: true, activo: true },
      { nombre: 'Gestionar Facturas', descripcion: 'Permite crear, ver, editar y anular facturas.', modulo: 'Finanzas', codigo: 'finanzas:facturas:manage', sistema: true, activo: true },
      { nombre: 'Gestionar Movimientos', descripcion: 'Permite registrar y ver ingresos/egresos.', modulo: 'Finanzas', codigo: 'finanzas:movimientos:manage', sistema: true, activo: true },
      { nombre: 'Realizar Conciliación Bancaria', descripcion: 'Permite acceder y usar la herramienta de conciliación.', modulo: 'Finanzas', codigo: 'finanzas:conciliacion:manage', sistema: true, activo: true },

      // Ventas
      { nombre: 'Ver Ventas', descripcion: 'Permite ver la lista de ventas y sus detalles.', modulo: 'Ventas', codigo: 'ventas:read', sistema: true, activo: true },
      { nombre: 'Crear Ventas', descripcion: 'Permite crear nuevos registros de venta.', modulo: 'Ventas', codigo: 'ventas:create', sistema: true, activo: true },
      { nombre: 'Editar Ventas', descripcion: 'Permite modificar ventas existentes.', modulo: 'Ventas', codigo: 'ventas:update', sistema: true, activo: true },
      { nombre: 'Eliminar Ventas', descripcion: 'Permite eliminar registros de venta.', modulo: 'Ventas', codigo: 'ventas:delete', sistema: true, activo: true },

      // Reportes
      { nombre: 'Ver Lista de Reportes', descripcion: 'Permite acceder a la lista de reportes predefinidos.', modulo: 'Reportes', codigo: 'reportes:list:read', sistema: true, activo: true },
      { nombre: 'Generar Reportes', descripcion: 'Permite usar el generador de reportes personalizados.', modulo: 'Reportes', codigo: 'reportes:generate', sistema: true, activo: true },

      // Dashboard
      { nombre: 'Ver Dashboard Principal', descripcion: 'Permite acceder al dashboard principal de la aplicación.', modulo: 'Dashboard', codigo: 'dashboard:read', sistema: true, activo: true },

      // Usuarios
      { nombre: 'Ver Lista de Usuarios', descripcion: 'Permite ver la lista de usuarios del sistema (útil para selectores, etc.)', modulo: 'Usuarios', codigo: 'usuarios:read:list', sistema: true, activo: true }
    ];

    let permisosCreados = 0;
    let permisosActualizados = 0;

    // Usar transaction para asegurar integridad
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Insertar o actualizar cada permiso
      for (const permiso of permisosDelSistema) {
        // Verificar si existe
        const [existentes] = await queryInterface.sequelize.query(
          `SELECT id FROM permisos WHERE codigo = '${permiso.codigo}' LIMIT 1`,
          { transaction }
        );

        if (existentes.length === 0) {
          // No existe, crear
          await queryInterface.sequelize.query(
            `INSERT INTO permisos (nombre, descripcion, modulo, codigo, sistema, activo, created_at, updated_at)
             VALUES (
               '${permiso.nombre.replace(/'/g, "''")}',
               '${permiso.descripcion.replace(/'/g, "''")}',
               '${permiso.modulo}',
               '${permiso.codigo}',
               ${permiso.sistema},
               ${permiso.activo},
               NOW(),
               NOW()
             )`,
            { transaction }
          );
          console.log(`  ✅ Creado: ${permiso.codigo}`);
          permisosCreados++;
        } else {
          // Ya existe, actualizar descripción por si cambió
          await queryInterface.sequelize.query(
            `UPDATE permisos 
             SET nombre = '${permiso.nombre.replace(/'/g, "''")}',
                 descripcion = '${permiso.descripcion.replace(/'/g, "''")}',
                 modulo = '${permiso.modulo}',
                 sistema = ${permiso.sistema},
                 activo = ${permiso.activo},
                 updated_at = NOW()
             WHERE codigo = '${permiso.codigo}'`,
            { transaction }
          );
          console.log(`  📝 Actualizado: ${permiso.codigo}`);
          permisosActualizados++;
        }
      }

      // Asignar todos los permisos al rol administrador
      console.log('\n👤 Asignando permisos al rol administrador...');

      // Obtener el ID del rol administrador
      const [rolAdmin] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE LOWER(nombre) = 'administrador' LIMIT 1`,
        { transaction }
      );

      if (rolAdmin.length > 0) {
        const rolId = rolAdmin[0].id;

        // Obtener todos los permisos del sistema
        const [todosLosPermisos] = await queryInterface.sequelize.query(
          `SELECT id FROM permisos WHERE sistema = true AND activo = true`,
          { transaction }
        );

        let asignacionesCreadas = 0;

        for (const permiso of todosLosPermisos) {
          // Verificar si ya existe la asociación
          const [existe] = await queryInterface.sequelize.query(
            `SELECT id FROM rol_permisos 
             WHERE rol_id = ${rolId} AND permiso_id = ${permiso.id} LIMIT 1`,
            { transaction }
          );

          if (existe.length === 0) {
            // No existe, crear
            await queryInterface.sequelize.query(
              `INSERT INTO rol_permisos (rol_id, permiso_id, created_at, updated_at)
               VALUES (${rolId}, ${permiso.id}, NOW(), NOW())`,
              { transaction }
            );
            asignacionesCreadas++;
          }
        }

        console.log(`\n✅ ${asignacionesCreadas} permisos asignados al rol administrador`);
      } else {
        console.log('\n⚠️  Rol administrador no encontrado');
      }

      await transaction.commit();

      console.log('\n========================================');
      console.log(`✅ Permisos creados: ${permisosCreados}`);
      console.log(`📝 Permisos actualizados: ${permisosActualizados}`);
      console.log(`📊 Total: ${permisosCreados + permisosActualizados}`);
      console.log('========================================\n');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No eliminamos permisos del sistema en rollback por seguridad
    console.log('⚠️  No se eliminan permisos del sistema en rollback por seguridad');
  }
};

