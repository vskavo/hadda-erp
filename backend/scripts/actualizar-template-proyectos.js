const { ReporteTemplate, sequelize } = require('../models');

async function actualizarTemplate() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    // Buscar el template de Proyectos Activos
    const template = await ReporteTemplate.findOne({
      where: { nombre: 'Proyectos Activos' }
    });

    if (!template) {
      console.log('❌ Template "Proyectos Activos" no encontrado');
      process.exit(1);
    }

    console.log(`📝 Actualizando template ID: ${template.id}`);

    // Actualizar con los valores correctos
    await template.update({
      descripcion: 'Lista de todos los proyectos en estado activo (No iniciado, En curso)',
      parametros_requeridos: {
        campos: [
          'id',
          'nombre',
          'Cliente.razon_social',
          'Responsable.nombre',
          'estado',
          'prioridad',
          'presupuesto',
          'porcentaje_avance',
          'fecha_inicio',
          'fecha_fin'
        ],
        filtros: {
          estado: ['No iniciado', 'En curso']
        }
      },
      opciones_configuracion: {
        entidad: 'proyectos',
        campos: [
          'id',
          'nombre',
          'Cliente.razon_social',
          'Responsable.nombre',
          'estado',
          'prioridad',
          'presupuesto',
          'porcentaje_avance',
          'fecha_inicio',
          'fecha_fin'
        ],
        filtros: {
          estado: ['No iniciado', 'En curso']
        }
      }
    });

    console.log('✅ Template actualizado correctamente');
    console.log('\nNuevos filtros:', template.parametros_requeridos.filtros);

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

actualizarTemplate();

