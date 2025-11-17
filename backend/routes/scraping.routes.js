const express = require('express');
const router = express.Router();
const scrapingController = require('../controllers/scraping.controller');
const { autenticar } = require('../middlewares/auth.middleware');

/**
 * Endpoint principal que recibe cookies de la extensión de Chrome
 * POST /api/scraping/start-with-auth
 * 
 * Este endpoint recibe las cookies capturadas por la extensión de Chrome
 * y las envía a Azure Function para ejecutar el scraping con autenticación.
 */
router.post('/start-with-auth', scrapingController.startScrapingWithAuth);

module.exports = router;

