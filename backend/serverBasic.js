require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { logInfo, logError } = require('./utils/logger');

const app = express();

// Middlewares básicos
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
try {
  // Usar sólo el archivo de rutas básico
  const apiRoutes = require('./routes/indexBasic');
  app.use('/api', apiRoutes);
  
  // Ruta de prueba
  app.get('/', (req, res) => {
    res.json({ message: 'API básica de Hadda - ERP funcionando correctamente' });
  });
} catch (error) {
  console.error('Error al cargar las rutas:', error);
  logError('Error al cargar las rutas:', error);
}

// Middleware para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logError('Error interno del servidor', err);
  const errorMessage = process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor';
  const errorDetails = process.env.NODE_ENV === 'development' ? err.stack : {};
  
  res.status(500).json({
    message: errorMessage,
    error: errorDetails
  });
});

const PORT = process.env.PORT || 5000;

// Iniciar servidor
app.listen(PORT, () => {
  logInfo(`Servidor básico corriendo en el puerto ${PORT}`);
  console.log(`Servidor básico corriendo en el puerto ${PORT}`);
}); 