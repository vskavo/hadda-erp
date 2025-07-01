require('dotenv').config();

// Comprueba si debe usar el servidor básico o el servidor completo
const useBasicServer = process.env.USE_BASIC_SERVER === 'false';

console.log(`Iniciando el servidor ${useBasicServer ? 'básico' : 'completo'}...`);

// Inicia el servidor apropiado
if (useBasicServer) {
  console.log('Usando serverBasic.js');
  require('./serverBasic');
} else {
  console.log('Usando server.js');
  require('./backend/server');
} 