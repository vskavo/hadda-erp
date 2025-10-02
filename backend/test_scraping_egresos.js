// Script para probar el servicio de scraping de egresos
const fetch = require('node-fetch');

async function testScrapingEgresos() {
  try {
    console.log('🧪 Probando servicio de scraping de egresos...');

    const response = await fetch('https://scraper-sii-773544359782.southamerica-west1.run.app/scrape-sii-option1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rut: '11111111',
        clave: 'test123'
      })
    });

    console.log('📊 Status de respuesta:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('📄 Tipo de contenido:', typeof text);
    console.log('📄 Longitud:', text.length);
    console.log('📄 Primeros 1000 caracteres:');
    console.log('--- INICIO ---');
    console.log(text.substring(0, 1000));
    console.log('--- FIN ---');

    if (text.length > 1000) {
      console.log('\n📄 Últimos 500 caracteres:');
      console.log(text.substring(text.length - 500));
    }

    // Verificar si parece XML
    const isXml = text.trim().startsWith('<?xml') || text.trim().startsWith('<');
    console.log('🔍 ¿Parece XML?', isXml);

    if (isXml) {
      console.log('✅ La respuesta parece ser XML');
    } else {
      console.log('❌ La respuesta NO es XML válido');
      console.log('🔍 ¿Contiene HTML?', text.includes('<html') || text.includes('<HTML'));
      console.log('🔍 ¿Contiene JSON?', text.trim().startsWith('{') || text.trim().startsWith('['));
    }

  } catch (error) {
    console.error('❌ Error al probar el servicio:', error.message);
  }
}

testScrapingEgresos();
