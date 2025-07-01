const { OtecData } = require('../models');

async function crearOtecData(data) {
  return await OtecData.create(data);
}

async function listarOtecData() {
  return await OtecData.findAll();
}

async function eliminarOtecData(rut) {
  return await OtecData.destroy({ where: { rut } });
}

module.exports = {
  crearOtecData,
  listarOtecData,
  eliminarOtecData
}; 