const { OtecData } = require('../models');

// Crear un nuevo registro OTEC
exports.createOtecData = async (req, res) => {
  try {
    const { rut, razon_social_otec, nombre_otec } = req.body;
    if (!rut || !razon_social_otec || !nombre_otec) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    const existe = await OtecData.findByPk(rut);
    if (existe) {
      return res.status(409).json({ message: 'Ya existe un registro con ese RUT.' });
    }
    const nuevo = await OtecData.create({ rut, razon_social_otec, nombre_otec });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el registro OTEC', error: error.message });
  }
};

// Listar todos los registros OTEC
exports.getAllOtecData = async (req, res) => {
  try {
    const datos = await OtecData.findAll();
    res.json(datos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los datos OTEC', error: error.message });
  }
};

// Eliminar un registro OTEC por RUT
exports.deleteOtecData = async (req, res) => {
  try {
    const { rut } = req.params;
    const eliminado = await OtecData.destroy({ where: { rut } });
    if (!eliminado) {
      return res.status(404).json({ message: 'Registro no encontrado.' });
    }
    res.json({ message: 'Registro eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el registro OTEC', error: error.message });
  }
}; 