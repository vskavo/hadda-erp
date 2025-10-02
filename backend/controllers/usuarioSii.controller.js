const { UsuarioSii } = require('../models');

// Crear un nuevo usuario autorizado SII
exports.createUsuarioSii = async (req, res) => {
  try {
    const { rut, nombre, clave_unica } = req.body;
    if (!rut || !nombre || !clave_unica) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    const existe = await UsuarioSii.findByPk(rut);
    if (existe) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese RUT.' });
    }
    const nuevo = await UsuarioSii.create({ rut, nombre, clave_unica });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el usuario SII', error: error.message });
  }
};

// Listar todos los usuarios SII
exports.getAllUsuariosSii = async (req, res) => {
  try {
    const datos = await UsuarioSii.findAll();
    res.json(datos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los usuarios SII', error: error.message });
  }
};

// Eliminar un usuario SII por RUT
exports.deleteUsuarioSii = async (req, res) => {
  try {
    const { rut } = req.params;
    const eliminado = await UsuarioSii.destroy({ where: { rut } });
    if (!eliminado) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario SII', error: error.message });
  }
};

// Editar un usuario SII por RUT
exports.updateUsuarioSii = async (req, res) => {
  try {
    const { rut } = req.params;
    const { nombre, clave_unica } = req.body;
    if (!nombre || !clave_unica) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    const usuario = await UsuarioSii.findByPk(rut);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    usuario.nombre = nombre;
    usuario.clave_unica = clave_unica;
    await usuario.save();
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el usuario SII', error: error.message });
  }
};
