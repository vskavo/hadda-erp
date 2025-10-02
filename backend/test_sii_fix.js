// Script de prueba para verificar la corrección del problema con monto_total_signed
const { SiiIngreso, sequelize } = require('./models');

async function testSiiFix() {
  try {
    console.log('🧪 Probando corrección de monto_total_signed...');

    // Verificar que podemos crear un registro sin la columna problemática
    const testData = {
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
      // NOTA: No incluimos monto_total_signed - se calcula automáticamente
    };

    console.log('📝 Intentando crear registro de prueba...');
    const registro = await SiiIngreso.create(testData);

    console.log('✅ Registro creado exitosamente:', {
      id: registro.id,
      tipo_dte: registro.tipo_dte,
      folio: registro.folio,
      monto_total: registro.monto_total,
      monto_total_signed: registro.monto_total_signed // Debería estar calculado automáticamente
    });

    // Limpiar registro de prueba
    await registro.destroy();
    console.log('🗑️ Registro de prueba eliminado');

    console.log('🎉 ¡Corrección exitosa! El servicio debería funcionar ahora.');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testSiiFix();
