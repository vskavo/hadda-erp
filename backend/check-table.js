require('dotenv').config();
const { sequelize } = require('./models');

async function checkTableStructure() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente.');

    // Consulta para obtener la estructura de la tabla de usuarios
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position;
    `);

    console.log('Estructura de la tabla "usuarios":');
    console.table(columns);

    // Verificar explícitamente las columnas de timestamp
    const timestampColumns = columns.filter(column => 
      column.column_name === 'created_at' || 
      column.column_name === 'updated_at' ||
      column.column_name === 'createdAt' || 
      column.column_name === 'updatedAt'
    );

    console.log('\nColumnas de timestamp:');
    console.table(timestampColumns);

    // Probar consulta directa para un usuario
    const [usuarios] = await sequelize.query(`
      SELECT id, nombre, apellido, email, activo, created_at, updated_at
      FROM usuarios
      LIMIT 1;
    `);

    console.log('\nPrimer usuario en la base de datos:');
    console.table(usuarios);

    // Finalizar
    console.log('\nVerificación completada.');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la verificación:', error);
    process.exit(1);
  }
}

checkTableStructure(); 