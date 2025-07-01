const { UsuarioSence } = require('../models');

async function crearUsuarioSence(data) {
  return await UsuarioSence.create(data);
}

async function listarUsuariosSence() {
  return await UsuarioSence.findAll();
}

async function eliminarUsuarioSence(rut) {
  return await UsuarioSence.destroy({ where: { rut } });
}

module.exports = {
  crearUsuarioSence,
  listarUsuariosSence,
  eliminarUsuarioSence
}; 