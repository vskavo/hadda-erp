const express = require('express');
const app = express();

// Simular las rutas SII
app.use(express.json());

// Simular middleware de autenticación (solo para pruebas)
const mockAuth = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

// Simular rutas SII
const siiIngresoRoutes = express.Router();
siiIngresoRoutes.use(mockAuth);
siiIngresoRoutes.get('/', (req, res) => res.json({ message: 'GET /sii/ingresos' }));
siiIngresoRoutes.post('/sincronizar', (req, res) => res.json({ message: 'POST /sii/ingresos/sincronizar' }));

const siiEgresoRoutes = express.Router();
siiEgresoRoutes.use(mockAuth);
siiEgresoRoutes.get('/', (req, res) => res.json({ message: 'GET /sii/egresos' }));
siiEgresoRoutes.post('/sincronizar', (req, res) => res.json({ message: 'POST /sii/egresos/sincronizar' }));

// Configurar rutas bajo /api
const apiRoutes = express.Router();
apiRoutes.use('/sii/ingresos', siiIngresoRoutes);
apiRoutes.use('/sii/egresos', siiEgresoRoutes);

app.use('/api', apiRoutes);

// Endpoint de prueba
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor de prueba funcionando', timestamp: new Date().toISOString() });
});

console.log('🚀 Servidor de prueba iniciándose en puerto 3001...');
app.listen(3001, () => {
  console.log('✅ Servidor de prueba ejecutándose en http://localhost:3001');
  console.log('📋 Endpoints de prueba:');
  console.log('  GET  /test');
  console.log('  GET  /api/sii/ingresos');
  console.log('  POST /api/sii/ingresos/sincronizar');
  console.log('  GET  /api/sii/egresos');
  console.log('  POST /api/sii/egresos/sincronizar');
});
