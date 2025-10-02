const { models, sequelize } = require('./backend/models');

const { Proyecto, CostoProyecto } = models;

/**
 * Script para probar el funcionamiento del hook afterSave en CostoProyecto
 * Verifica que al actualizar un costo se recalcule correctamente costo_real
 */
async function testCostoHook() {
  const t = await sequelize.transaction();

  try {
    console.log('🚀 Iniciando prueba del hook afterSave de CostoProyecto...\n');

    // 1. Buscar un proyecto existente con costos
    const proyecto = await Proyecto.findOne({
      include: [{
        model: CostoProyecto,
        as: 'CostoProyectos',
        where: { estado: 'ejecutado' },
        required: false
      }],
      transaction: t
    });

    if (!proyecto) {
      console.log('❌ No se encontró ningún proyecto con costos ejecutados');
      await t.rollback();
      return;
    }

    console.log(`📋 Proyecto encontrado: ID ${proyecto.id} - ${proyecto.nombre}`);
    console.log(`💰 Costo real actual: ${proyecto.costo_real}`);

    // 2. Obtener el primer costo del proyecto
    const costo = proyecto.CostoProyectos[0];
    if (!costo) {
      console.log('❌ El proyecto no tiene costos ejecutados');
      await t.rollback();
      return;
    }

    console.log(`💸 Costo a actualizar: ID ${costo.id} - ${costo.concepto} - Monto: ${costo.monto}`);

    // 3. Guardar el monto original
    const montoOriginal = parseFloat(costo.monto);
    const nuevoMonto = montoOriginal + 10000; // Aumentar en 10.000

    console.log(`🔄 Actualizando monto de ${montoOriginal} a ${nuevoMonto}`);

    // 4. Actualizar el costo usando el método corregido
    costo.monto = nuevoMonto;
    await costo.save({ transaction: t });

    console.log('✅ Costo actualizado en la base de datos');

    // 5. Verificar que el costo_real se haya actualizado
    const proyectoActualizado = await Proyecto.findByPk(proyecto.id, { transaction: t });

    console.log(`📊 Nuevo costo real del proyecto: ${proyectoActualizado.costo_real}`);
    console.log(`🎯 Costo real esperado: ${parseFloat(proyecto.costo_real) - montoOriginal + nuevoMonto}`);

    const costoRealEsperado = parseFloat(proyecto.costo_real) - montoOriginal + nuevoMonto;
    const diferencia = Math.abs(parseFloat(proyectoActualizado.costo_real) - costoRealEsperado);

    if (diferencia < 0.01) { // Tolerancia para decimales
      console.log('✅ ¡ÉXITO! El hook afterSave funcionó correctamente');
      console.log(`📈 Diferencia: ${diferencia} (muy pequeña, probablemente por redondeo)`);
    } else {
      console.log('❌ ERROR: El costo_real no se actualizó correctamente');
      console.log(`📉 Diferencia: ${diferencia}`);
    }

    await t.rollback(); // Deshacer cambios de prueba
    console.log('\n🔄 Cambios de prueba revertidos');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    await t.rollback();
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testCostoHook()
    .then(() => {
      console.log('\n🏁 Prueba completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testCostoHook };
