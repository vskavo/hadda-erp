// Script para probar la conexión a la base de datos y crear las tablas SII
const { sequelize, SiiIngreso, SiiEgreso } = require('./models');

async function testDatabaseConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');

    // Probar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa');

    // Verificar si las tablas existen
    console.log('\n📋 Verificando tablas SII...');

    const tables = await sequelize.getQueryInterface().showAllTables();
    const hasIngresos = tables.includes('sii_ingresos');
    const hasEgresos = tables.includes('sii_egresos');

    console.log(`📊 sii_ingresos: ${hasIngresos ? '✅ Existe' : '❌ No existe'}`);
    console.log(`📊 sii_egresos: ${hasEgresos ? '✅ Existe' : '❌ No existe'}`);

    if (!hasIngresos || !hasEgresos) {
      console.log('\n🔧 Creando tablas SII...');

      // Sincronizar modelos
      await sequelize.sync({ force: false });
      console.log('✅ Tablas SII creadas exitosamente');
    }

    // Probar crear un registro de prueba
    console.log('\n🧪 Probando creación de registro...');

    try {
      const testIngreso = await SiiIngreso.create({
        tipo_dte: '33',
        folio: 999999,
        fecha_emision: new Date(),
        cliente_rut: '11111111-1',
        cliente_nombre: 'Cliente de Prueba',
        emisor_rut: '22222222-2',
        emisor_nombre: 'Emisor de Prueba',
        monto_neto: 100000,
        monto_exento: 0,
        iva: 19000,
        tasa_iva: 19.00,
        monto_total: 119000,
        estado_sii: 'ACEPTADO',
        source_filename: 'test.xml'
      });

      console.log('✅ Registro de prueba creado:', testIngreso.id);

      // Limpiar registro de prueba
      await testIngreso.destroy();
      console.log('🗑️ Registro de prueba eliminado');

    } catch (createError) {
      console.log('❌ Error creando registro de prueba:', createError.message);
    }

    console.log('\n✨ Pruebas completadas exitosamente');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testDatabaseConnection();
