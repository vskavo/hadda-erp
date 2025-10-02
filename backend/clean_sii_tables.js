// Script para limpiar las tablas SII si es necesario
const { sequelize, SiiIngreso, SiiEgreso } = require('./models');

async function cleanSiiTables() {
  try {
    console.log('🧹 Limpiando tablas SII...');

    // Contar registros antes de limpiar
    const ingresosCount = await SiiIngreso.count();
    const egresosCount = await SiiEgreso.count();

    console.log(`📊 Registros encontrados - Ingresos: ${ingresosCount}, Egresos: ${egresosCount}`);

    if (ingresosCount > 0 || egresosCount > 0) {
      console.log('⚠️  Eliminando registros existentes...');

      await SiiIngreso.destroy({ where: {} });
      await SiiEgreso.destroy({ where: {} });

      console.log('✅ Tablas SII limpiadas');
    } else {
      console.log('ℹ️  Las tablas ya están vacías');
    }

    // Verificar que las tablas estén vacías
    const ingresosAfter = await SiiIngreso.count();
    const egresosAfter = await SiiEgreso.count();

    console.log(`📊 Registros después de limpieza - Ingresos: ${ingresosAfter}, Egresos: ${egresosAfter}`);

  } catch (error) {
    console.error('❌ Error limpiando tablas:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  cleanSiiTables();
}

module.exports = cleanSiiTables;
