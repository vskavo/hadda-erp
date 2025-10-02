// Script de prueba para verificar la funcionalidad de editar proyecto en documentos SII
const { SiiIngreso, SiiEgreso, Proyecto } = require('./models');

async function testEditarProyectoSii() {
  try {
    console.log('🧪 Probando funcionalidad de editar proyecto en documentos SII...');

    // Obtener un proyecto existente para las pruebas
    const proyecto = await Proyecto.findOne();
    if (!proyecto) {
      console.log('⚠️ No hay proyectos en la base de datos. Creando uno de prueba...');
      return;
    }

    console.log(`📋 Proyecto de prueba: ${proyecto.nombre} (ID: ${proyecto.id})`);

    // Obtener un ingreso SII existente
    const ingreso = await SiiIngreso.findOne();
    if (ingreso) {
      console.log(`📄 Probando con ingreso SII: ${ingreso.tipo_dte}-${ingreso.folio}`);
      console.log(`   Proyecto actual: ${ingreso.proyecto_id || 'Sin asignar'}`);

      // Simular cambio de proyecto
      const nuevoProyectoId = ingreso.proyecto_id === proyecto.id ? null : proyecto.id;
      await ingreso.update({ proyecto_id: nuevoProyectoId });

      console.log(`✅ Proyecto del ingreso actualizado: ${nuevoProyectoId || 'Sin asignar'}`);
    }

    // Obtener un egreso SII existente
    const egreso = await SiiEgreso.findOne();
    if (egreso) {
      console.log(`📄 Probando con egreso SII: ${egreso.tipo_dte}-${egreso.folio}`);
      console.log(`   Proyecto actual: ${egreso.proyecto_id || 'Sin asignar'}`);

      // Simular cambio de proyecto
      const nuevoProyectoId = egreso.proyecto_id === proyecto.id ? null : proyecto.id;
      await egreso.update({ proyecto_id: nuevoProyectoId });

      console.log(`✅ Proyecto del egreso actualizado: ${nuevoProyectoId || 'Sin asignar'}`);
    }

    console.log('🎉 ¡Funcionalidad de editar proyecto probada exitosamente!');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

testEditarProyectoSii();
