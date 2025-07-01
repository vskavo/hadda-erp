const express = require('express');
const router = express.Router();
const otecDataController = require('../controllers/otecData.controller');

// Crear un nuevo registro OTEC
router.post('/', otecDataController.createOtecData);

// Listar todos los registros OTEC
router.get('/', otecDataController.getAllOtecData);

// Eliminar un registro OTEC por RUT
router.delete('/:rut', otecDataController.deleteOtecData);

module.exports = router; 