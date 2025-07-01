const bcrypt = require('bcryptjs');

const storedHash = '$2a$10$YYKhpci0O5XRLfTwM9p6ZuTrkTGSEaj/GSCVkwEk.oT1LIzxV0vNG';
const password = 'admin123';

async function testPassword() {
  try {
    console.log('=== TEST DE VERIFICACIÓN DE CONTRASEÑA ===');
    console.log(`Probando contraseña "${password}" contra hash almacenado:`);
    console.log(storedHash);
    
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log(`\nResultado: ${isMatch ? 'COINCIDE ✅' : 'NO COINCIDE ❌'}`);
    
    // Probar algunas variaciones de la contraseña
    const variations = [
      'Admin123',       // Mayúscula inicial
      'admin123 ',      // Espacio al final
      ' admin123',      // Espacio al inicio
      'admin@123',      // Símbolo
      'Admin@123',      // Combinación
      'Admin123!',      // Con signo de exclamación
      'Password123'     // Otra contraseña común
    ];
    
    console.log('\n=== PROBANDO VARIACIONES DE CONTRASEÑA ===');
    for (const variant of variations) {
      const variantMatch = await bcrypt.compare(variant, storedHash);
      console.log(`"${variant}": ${variantMatch ? 'COINCIDE ✅' : 'NO COINCIDE ❌'}`);
    }
    
    // Generar un nuevo hash para la contraseña original
    const newHash = await bcrypt.hash(password, 10);
    console.log(`\n=== NUEVO HASH GENERADO ===`);
    console.log(`Nuevo hash para "${password}":`);
    console.log(newHash);
    
    // Verificar el nuevo hash
    const newIsMatch = await bcrypt.compare(password, newHash);
    console.log(`Verificación del nuevo hash: ${newIsMatch ? 'CORRECTA ✅' : 'INCORRECTA ❌'}`);
  } catch (error) {
    console.error('Error durante la prueba:', error);
  }
}

testPassword(); 