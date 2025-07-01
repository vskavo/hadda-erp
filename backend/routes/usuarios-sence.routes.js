const express = require('express');
const router = express.Router();
const usuariosSenceController = require('../controllers/usuariosSence.controller');

// Crear un nuevo usuario Sence
router.post('/', usuariosSenceController.createUsuarioSence);

// Listar todos los usuarios Sence
router.get('/', usuariosSenceController.getAllUsuariosSence);

// Eliminar un usuario Sence por RUT
router.delete('/:rut', usuariosSenceController.deleteUsuarioSence);

// Editar un usuario Sence por RUT
router.put('/:rut', usuariosSenceController.updateUsuarioSence);

module.exports = router; 