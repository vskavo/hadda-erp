// Script de prueba para crear un cliente usando Axios
const axios = require('axios');

async function crearClienteTest() {
  try {
    // Primero obtener un token (ajustar credenciales si es necesario)
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'vzavala@dataotec.com',
      password: 'admin123'
    });
    
    console.log('Login exitoso');
    const token = loginResponse.data.token;
    console.log('Token obtenido:', token);
    
    // Crear el cliente con el token
    const clienteResponse = await axios.post(
      'http://localhost:5000/api/clientes',
      {
        razon_social: 'Cliente Prueba Axios',
        rut: '22.333.444-5',
        direccion: 'Calle de Prueba 123',
        telefono: '912345678',
        email: 'prueba@cliente.cl',
        estado: 'Activo'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Respuesta del servidor:');
    console.log(clienteResponse.status, clienteResponse.statusText);
    console.log(JSON.stringify(clienteResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error en la prueba:');
    console.error('Status:', error.response?.status);
    console.error('Mensaje:', error.response?.data || error.message);
    console.error('Headers:', error.response?.headers);
    
    if (error.response?.data) {
      console.error('Datos de respuesta:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

console.log('Iniciando prueba de creación de cliente...');
crearClienteTest(); 