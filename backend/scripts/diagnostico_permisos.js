require('dotenv').config();
const { sequelize, Usuario, Rol, Permiso, RolPermiso } = require('../models');

async function diagnosticoPermisos() {
  try {
    console.log('========== DIAGNÓSTICO DE ROLES Y PERMISOS ==========\n');

    // 1. Listar todos los roles
    console.log('1. ROLES EN LA BASE DE DATOS:');
    console.log('------------------------------');
    const roles = await Rol.findAll({
      order: [['id', 'ASC']]
    });
    
    roles.forEach(rol => {
      console.log(`ID: ${rol.id} | Nombre: "${rol.nombre}" | Sistema: ${rol.sistema} | Activo: ${rol.activo}`);
    });
    
    console.log('\n2. USUARIOS Y SUS ROLES:');
    console.log('-------------------------');
    const usuarios = await Usuario.findAll({
      include: [{
        model: Rol,
        as: 'Rol'
      }],
      order: [['id', 'ASC']]
    });
    
    usuarios.forEach(usuario => {
      console.log(`Usuario: ${usuario.email} | Rol: "${usuario.Rol?.nombre || 'SIN ROL'}" | Rol ID: ${usuario.rol_id}`);
    });
    
    // 3. Buscar específicamente usuarios administradores
    console.log('\n3. USUARIOS ADMINISTRADORES:');
    console.log('-----------------------------');
    const adminUsers = usuarios.filter(u => 
      u.Rol?.nombre && (u.Rol.nombre.toLowerCase() === 'administrador')
    );
    
    if (adminUsers.length === 0) {
      console.log('NO SE ENCONTRARON USUARIOS CON ROL ADMINISTRADOR');
    } else {
      adminUsers.forEach(admin => {
        console.log(`Email: ${admin.email} | Rol exacto: "${admin.Rol.nombre}"`);
      });
    }
    
    // 4. Buscar el permiso de configuraciones
    console.log('\n4. PERMISO DE CONFIGURACIONES:');
    console.log('-------------------------------');
    const permisoConfig = await Permiso.findOne({
      where: { codigo: 'admin:settings:manage' }
    });
    
    if (permisoConfig) {
      console.log(`Encontrado: ID: ${permisoConfig.id} | Código: ${permisoConfig.codigo} | Nombre: ${permisoConfig.nombre}`);
    } else {
      console.log('NO EXISTE el permiso "admin:settings:manage"');
    }
    
    // 5. Permisos de cada rol
    console.log('\n5. PERMISOS POR ROL:');
    console.log('---------------------');
    
    for (const rol of roles) {
      console.log(`\n[${rol.nombre}] (ID: ${rol.id}):`);
      
      const rolConPermisos = await Rol.findByPk(rol.id, {
        include: [{
          model: Permiso,
          as: 'permisos',
          attributes: ['id', 'codigo', 'nombre'],
          through: { attributes: [] }
        }]
      });
      
      if (rolConPermisos.permisos.length === 0) {
        console.log('  - Sin permisos asignados');
      } else {
        rolConPermisos.permisos.forEach(permiso => {
          console.log(`  - ${permiso.codigo} (${permiso.nombre})`);
        });
      }
    }
    
    // 6. Verificar específicamente permisos de administración
    console.log('\n6. PERMISOS DE ADMINISTRACIÓN:');
    console.log('-------------------------------');
    const { Op } = require('sequelize');
    const permisosAdmin = await Permiso.findAll({
      where: {
        codigo: {
          [Op.like]: 'admin:%'
        }
      }
    });
    
    if (permisosAdmin.length === 0) {
      console.log('No se encontraron permisos con prefijo "admin:"');
    } else {
      permisosAdmin.forEach(permiso => {
        console.log(`- ${permiso.codigo}: ${permiso.nombre}`);
      });
    }
    
    // 7. Verificar si existe la tabla rol_permisos
    console.log('\n7. VERIFICACIÓN DE TABLA rol_permisos:');
    console.log('---------------------------------------');
    const [results] = await sequelize.query(
      "SELECT COUNT(*) as count FROM rol_permisos"
    );
    console.log(`Total de registros en rol_permisos: ${results[0].count}`);
    
    console.log('\n========== FIN DEL DIAGNÓSTICO ==========');
    
  } catch (error) {
    console.error('Error durante el diagnóstico:', error);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar diagnóstico
diagnosticoPermisos(); 