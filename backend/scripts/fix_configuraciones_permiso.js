require('dotenv').config();
const { sequelize, Rol, Permiso, RolPermiso } = require('../models');

/**
 * Script para asegurar que exista el permiso para administrar configuraciones
 * y que esté asignado al rol de administrador
 */
async function fixConfiguracionesPermiso() {
  try {
    console.log('Iniciando verificación de permisos de configuraciones...');

    // Buscar permiso para configuraciones
    let permiso = await Permiso.findOne({
      where: { codigo: 'admin:settings:manage' }
    });

    // Si no existe, crearlo
    if (!permiso) {
      console.log('Permiso "admin:settings:manage" no encontrado. Creando...');
      permiso = await Permiso.create({
        nombre: 'Administrar configuraciones',
        descripcion: 'Permite acceder y modificar configuraciones del sistema',
        modulo: 'Administración',
        codigo: 'admin:settings:manage',
        sistema: true,
        activo: true
      });
      console.log('Permiso creado correctamente.');
    } else {
      console.log('El permiso "admin:settings:manage" ya existe.');
    }

    // Buscar rol de administrador
    const rolAdmin = await Rol.findOne({
      where: { nombre: 'administrador' }
    });

    if (!rolAdmin) {
      console.error('Error: No se encontró el rol de administrador en la base de datos.');
      return;
    }

    // Verificar si el rol ya tiene el permiso
    const tienePermiso = await RolPermiso.findOne({
      where: {
        rol_id: rolAdmin.id,
        permiso_id: permiso.id
      }
    });

    // Si no tiene el permiso, asignarlo
    if (!tienePermiso) {
      console.log('Asignando permiso de configuraciones al rol administrador...');
      await RolPermiso.create({
        rol_id: rolAdmin.id,
        permiso_id: permiso.id
      });
      console.log('Permiso asignado correctamente.');
    } else {
      console.log('El rol administrador ya tiene el permiso de configuraciones.');
    }

    console.log('Proceso completado exitosamente.');
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar la función
fixConfiguracionesPermiso(); 