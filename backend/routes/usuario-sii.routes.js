const express = require('express');
const router = express.Router();
const usuarioSiiController = require('../controllers/usuarioSii.controller');

// Crear un nuevo usuario SII
router.post('/', usuarioSiiController.createUsuarioSii);

// Listar todos los usuarios SII
router.get('/', usuarioSiiController.getAllUsuariosSii);

// Eliminar un usuario SII por RUT
router.delete('/:rut', usuarioSiiController.deleteUsuarioSii);

// Editar un usuario SII por RUT
router.put('/:rut', usuarioSiiController.updateUsuarioSii);

module.exports = router;
