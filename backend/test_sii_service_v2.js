// Script para probar la versión alternativa del servicio SII
const siiServiceV2 = require('./services/sii.service.v2');

async function testSiiServiceV2() {
  try {
    console.log('🧪 Probando SiiServiceV2 con credenciales de prueba...');

    const resultado = await siiServiceV2.sincronizarIngresosSii({
      rut: '11111111',
      clave: 'test123',
      proyecto_id: null
    });

    console.log('✅ Resultado:', resultado);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testSiiServiceV2();
