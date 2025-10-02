// Script para verificar qué tablas necesitan migraciones
const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

async function checkMigrations() {
  try {
    console.log('🔍 Verificando estado de migraciones...\n');
    
    // 1. Obtener todos los modelos definidos
    const models = Object.keys(sequelize.models);
    console.log(`📦 Modelos definidos: ${models.length}`);
    models.forEach(model => console.log(`  - ${model}`));
    
    // 2. Verificar tablas existentes en la BD
    console.log('\n📊 Verificando tablas en la base de datos...');
    try {
      await sequelize.authenticate();
      console.log('✅ Conexión exitosa\n');
      
      const tables = await sequelize.getQueryInterface().showAllTables();
      console.log(`📋 Tablas existentes: ${tables.length}`);
      tables.forEach(table => console.log(`  - ${table}`));
      
      // 3. Comparar modelos vs tablas
      console.log('\n🔄 Comparación:');
      const modelTables = models.map(m => sequelize.models[m].tableName);
      const missingTables = modelTables.filter(t => !tables.includes(t));
      const extraTables = tables.filter(t => !modelTables.includes(t));
      
      if (missingTables.length > 0) {
        console.log('\n❌ Tablas faltantes (definidas en modelos pero no en BD):');
        missingTables.forEach(t => console.log(`  - ${t}`));
      }
      
      if (extraTables.length > 0) {
        console.log('\n⚠️  Tablas extra (en BD pero sin modelo):');
        extraTables.forEach(t => console.log(`  - ${t}`));
      }
      
      if (missingTables.length === 0 && extraTables.length === 0) {
        console.log('\n✅ Todos los modelos tienen su tabla correspondiente');
      }
      
    } catch (dbError) {
      console.error('❌ Error al conectar a la BD:', dbError.message);
      console.log('\n⚠️  No se puede verificar tablas sin conexión a BD');
    }
    
    // 4. Listar migraciones existentes
    console.log('\n📁 Migraciones existentes:');
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js') || f.endsWith('.sql'));
    
    console.log(`Total: ${migrationFiles.length}`);
    migrationFiles.forEach(f => console.log(`  - ${f}`));
    
    // 5. Conclusión
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN:');
    console.log(`   Modelos definidos: ${models.length}`);
    console.log(`   Migraciones: ${migrationFiles.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMigrations();

