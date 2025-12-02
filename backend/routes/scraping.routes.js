const express = require('express');
const router = express.Router();
const scrapingController = require('../controllers/scraping.controller');
const { autenticar } = require('../middlewares/auth.middleware');

/**
 * 🆕 Prepara una sesión de sincronización
 * POST /api/scraping/prepare-sync
 * 
 * El frontend envía los datos del curso ANTES de abrir la ventana de SENCE.
 * Retorna un syncId que se pasa a la extensión via URL.
 */
router.post('/prepare-sync', autenticar, scrapingController.prepareSync);

/**
 * Endpoint principal que recibe cookies de la extensión de Chrome
 * POST /api/scraping/start-with-auth
 * 
 * Este endpoint recibe las cookies capturadas por la extensión de Chrome
 * y las envía a Azure Function para ejecutar el scraping con autenticación.
 * 
 * Ahora también busca datos por syncId si no vienen completos en scraperData.
 */
router.post('/start-with-auth', scrapingController.startScrapingWithAuth);

/**
 * Obtener estado de scraping
 * GET /api/scraping/status/:cursoId
 */
router.get('/status/:cursoId', autenticar, scrapingController.getScrapingStatus);

module.exports = router;

