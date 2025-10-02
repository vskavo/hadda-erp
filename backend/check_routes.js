const routes = require('./routes/index');

console.log('🔍 Verificando rutas SII registradas...\n');

const siiRoutes = routes.stack
  .filter(layer => layer.route && layer.route.path)
  .filter(layer => layer.route.path.includes('/sii/'))
  .map(layer => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods).join(', ').toUpperCase()
  }));

if (siiRoutes.length === 0) {
  console.log('❌ No se encontraron rutas SII registradas');
  console.log('🔧 Verificando si los archivos de rutas existen...\n');

  const fs = require('fs');
  const path = require('path');

  const siiIngresoPath = path.join(__dirname, 'routes', 'sii_ingreso.routes.js');
  const siiEgresoPath = path.join(__dirname, 'routes', 'sii_egreso.routes.js');

  console.log(`📁 sii_ingreso.routes.js: ${fs.existsSync(siiIngresoPath) ? '✅ Existe' : '❌ No existe'}`);
  console.log(`📁 sii_egreso.routes.js: ${fs.existsSync(siiEgresoPath) ? '✅ Existe' : '❌ No existe'}`);

  // Verificar si se pueden cargar los módulos
  try {
    require('./routes/sii_ingreso.routes');
    console.log('📦 Módulo sii_ingreso.routes.js: ✅ Se carga correctamente');
  } catch (e) {
    console.log('📦 Módulo sii_ingreso.routes.js: ❌ Error al cargar:', e.message);
  }

  try {
    require('./routes/sii_egreso.routes');
    console.log('📦 Módulo sii_egreso.routes.js: ✅ Se carga correctamente');
  } catch (e) {
    console.log('📦 Módulo sii_egreso.routes.js: ❌ Error al cargar:', e.message);
  }

} else {
  console.log('✅ Rutas SII encontradas:');
  siiRoutes.forEach(route => {
    console.log(`  ${route.methods} ${route.path}`);
  });
}

console.log('\n🔧 Verificando configuración del servidor...\n');

// Verificar si el servidor está configurado para usar /api
const express = require('express');
const testApp = express();
const testRoutes = require('./routes/index');

testApp.use('/api', testRoutes);

console.log('📋 Configuración esperada:');
console.log('  Servidor principal debería tener: app.use(\'/api\', routes)');
console.log('  Rutas SII deberían estar disponibles en: /api/sii/ingresos/* y /api/sii/egresos/*');

console.log('\n✨ Verificación completada.');
