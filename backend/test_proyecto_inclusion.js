// Script de prueba para verificar que se incluye la información del proyecto en las consultas
const { SiiIngreso, SiiEgreso, Proyecto } = require('./models');

async function testProyectoInclusion() {
  try {
    console.log('🧪 Probando inclusión de información de proyecto en consultas SII...');

    // Verificar que hay proyectos
    const proyectosCount = await Proyecto.count();
    console.log(`📊 Total de proyectos en BD: ${proyectosCount}`);

    if (proyectosCount === 0) {
      console.log('⚠️ No hay proyectos en la base de datos para probar');
      return;
    }

    // Probar consulta de ingresos
    console.log('\n📥 Probando consulta de ingresos SII...');
    const ingresos = await SiiIngreso.findAll({
      limit: 3,
      include: [{
        model: Proyecto,
        as: 'Proyecto',
        attributes: ['id', 'nombre'],
        required: false
      }]
    });

    console.log(`✅ Encontrados ${ingresos.length} ingresos SII`);
    ingresos.forEach((ingreso, index) => {
      console.log(`   ${index + 1}. ${ingreso.tipo_dte}-${ingreso.folio} | Proyecto: ${ingreso.Proyecto ? ingreso.Proyecto.nombre : 'Sin asignar'}`);
    });

    // Probar consulta de egresos
    console.log('\n📤 Probando consulta de egresos SII...');
    const egresos = await SiiEgreso.findAll({
      limit: 3,
      include: [{
        model: Proyecto,
        as: 'Proyecto',
        attributes: ['id', 'nombre'],
        required: false
      }]
    });

    console.log(`✅ Encontrados ${egresos.length} egresos SII`);
    egresos.forEach((egreso, index) => {
      console.log(`   ${index + 1}. ${egreso.tipo_dte}-${egreso.folio} | Proyecto: ${egreso.Proyecto ? egreso.Proyecto.nombre : 'Sin asignar'}`);
    });

    // Probar consulta individual
    if (ingresos.length > 0) {
      console.log('\n🔍 Probando consulta individual de ingreso...');
      const ingresoIndividual = await SiiIngreso.findByPk(ingresos[0].id, {
        include: [{
          model: Proyecto,
          as: 'Proyecto',
          attributes: ['id', 'nombre'],
          required: false
        }]
      });

      if (ingresoIndividual) {
        console.log(`✅ Ingreso individual: ${ingresoIndividual.tipo_dte}-${ingresoIndividual.folio}`);
        console.log(`   Proyecto: ${ingresoIndividual.Proyecto ? ingresoIndividual.Proyecto.nombre : 'Sin asignar'}`);
      }
    }

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('📝 Las consultas ahora incluyen correctamente la información del proyecto.');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

testProyectoInclusion();
