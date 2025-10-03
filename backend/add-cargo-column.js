const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de conexión igual a la de la aplicación
const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function addCargoColumn() {
  try {
    console.log('Agregando columna cargo a la tabla usuarios...');

    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    await sequelize.getQueryInterface().addColumn('usuarios', 'cargo', {
      type: Sequelize.STRING,
      allowNull: true
    });

    console.log('✅ Columna cargo agregada exitosamente a la tabla usuarios');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al agregar la columna cargo:', error.message);
    console.error('Detalles del error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

addCargoColumn();
