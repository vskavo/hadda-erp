const axios = require('axios');

async function sincronizarConSence(id_sence) {
  try {
    const response = await axios.post('https://sencecursossync.azurewebsites.net/api/extracciondatossence', {
      acc_cap: id_sence
    });
    return { success: true, data: response.data };
  } catch (err) {
    if (err.response && err.response.data && typeof err.response.data === 'string' && err.response.data.includes('duplicate key value violates unique constraint')) {
      return { success: false, message: 'Error: El curso ya existe en SENCE (duplicado)', data: err.response.data };
    }
    return { success: false, message: 'Error al sincronizar con SENCE', data: err.response ? err.response.data : err.message };
  }
}

module.exports = { sincronizarConSence }; 