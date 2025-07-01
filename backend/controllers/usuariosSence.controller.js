const { UsuarioSence } = require('../models');

// Crear un nuevo usuario autorizado Sence
exports.createUsuarioSence = async (req, res) => {
  try {
    const { rut, nombre, clave_unica } = req.body;
    if (!rut || !nombre || !clave_unica) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    const existe = await UsuarioSence.findByPk(rut);
    if (existe) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese RUT.' });
    }
    const nuevo = await UsuarioSence.create({ rut, nombre, clave_unica });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el usuario Sence', error: error.message });
  }
};

// Listar todos los usuarios Sence
exports.getAllUsuariosSence = async (req, res) => {
  try {
    const datos = await UsuarioSence.findAll();
    res.json(datos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los usuarios Sence', error: error.message });
  }
};

// Eliminar un usuario Sence por RUT
exports.deleteUsuarioSence = async (req, res) => {
  try {
    const { rut } = req.params;
    const eliminado = await UsuarioSence.destroy({ where: { rut } });
    if (!eliminado) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario Sence', error: error.message });
  }
};

// Editar un usuario Sence por RUT
exports.updateUsuarioSence = async (req, res) => {
  try {
    const { rut } = req.params;
    const { nombre, clave_unica } = req.body;
    if (!nombre || !clave_unica) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    const usuario = await UsuarioSence.findByPk(rut);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    usuario.nombre = nombre;
    usuario.clave_unica = clave_unica;
    await usuario.save();
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el usuario Sence', error: error.message });
  }
}; 