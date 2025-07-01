// Script para probar las rutas una por una
require('dotenv').config();
const fs = require('fs');

console.log('Probando rutas...');

// Probar la ruta auth.routes.js
try {
  console.log('Cargando auth.routes.js...');
  const authRoutes = require('./routes/auth.routes');
  console.log('OK - auth.routes.js');
} catch (error) {
  console.error('Error en auth.routes.js:', error);
}

// Probar usuario.routes.js (que sabemos que es problemático)
try {
  console.log('Cargando usuario.routes.js...');
  const usuarioRoutes = require('./routes/usuario.routes');
  console.log('OK - usuario.routes.js');
} catch (error) {
  console.error('Error en usuario.routes.js:', error);
}

// Probar el resto de las rutas
const routesInIndexJs = [
  'rol.routes',
  'cliente.routes',
  'contacto.routes',
  'seguimiento-cliente.routes',
  'curso.routes',
  'participante.routes',
  'declaracion-jurada.routes',
  'sesion.routes',
  'asistencia.routes',
  'factura.routes',
  'ingreso.routes',
  'egreso.routes',
  'conciliacion-bancaria.routes',
  'cuenta-bancaria.routes',
  'proyecto.routes',
  'email.routes',
  'pdf.routes',
  'dashboard.routes'
];

routesInIndexJs.forEach(route => {
  try {
    console.log(`Cargando ${route}.js...`);
    const routeModule = require(`./routes/${route}`);
    console.log(`OK - ${route}.js`);
  } catch (error) {
    console.error(`Error en ${route}.js:`, error);
  }
}); 