/**
 * Script para generar código de migración a PostgreSQL para todos los modelos con ENUM
 * Este script analiza los modelos de Sequelize y genera el código necesario para 
 * crear tipos ENUM en PostgreSQL antes de la migración.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directorio donde están los modelos
const modelsDir = path.join(__dirname, '../models');

// Función para extraer ENUMs de los archivos de modelo
function extractEnumsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Buscar patrones de ENUM en el archivo
  const enumRegex = /type:\s*DataTypes\.ENUM\s*\(\s*['"]([^'"]+)['"]\s*(,\s*['"][^'"]+['"]\s*)*\)/g;
  const enumValueRegex = /['"]([^'"]+)['"]/g;
  
  const enums = [];
  let match;
  
  while ((match = enumRegex.exec(content)) !== null) {
    const enumValues = [];
    const fullMatch = match[0];
    
    let valueMatch;
    while ((valueMatch = enumValueRegex.exec(fullMatch)) !== null) {
      enumValues.push(valueMatch[1]);
    }
    
    if (enumValues.length > 0) {
      // Intentar encontrar el nombre del campo
      const beforeEnum = content.substring(0, match.index).split('\n');
      const lastLines = beforeEnum.slice(-3);
      
      let fieldName = 'unknown';
      for (let i = lastLines.length - 1; i >= 0; i--) {
        const fieldMatch = lastLines[i].match(/(\w+):\s*{/);
        if (fieldMatch) {
          fieldName = fieldMatch[1];
          break;
        }
      }
      
      // Obtener el nombre del modelo del archivo
      const modelName = path.basename(filePath, '.model.js');
      
      enums.push({
        model: modelName,
        field: fieldName,
        values: enumValues
      });
    }
  }
  
  return enums;
}

// Función para generar script de migración
function generateMigrationScript(enums) {
  let migrationCode = `
// Código para ejecutar antes de la sincronización de modelos en PostgreSQL
// Coloca esta lógica en tu startServer o script de migración

async function createPostgresEnums() {
  const { sequelize } = require('./models');
  
  try {
    console.log('Creando tipos ENUM para PostgreSQL...');
    
    // Crear tipos ENUM para cada campo ENUM en los modelos
`;

  // Map para almacenar ENUMs únicos por nombre de tipo
  const uniqueEnums = new Map();
  
  // Generar un nombre de tipo válido para PostgreSQL
  enums.forEach(enumObj => {
    const typeName = `${enumObj.model}_${enumObj.field}_enum`.toLowerCase();
    const enumValues = enumObj.values.map(v => `'${v}'`).join(', ');
    
    // Solo agregar ENUMs únicos por nombre de tipo
    if (!uniqueEnums.has(typeName)) {
      uniqueEnums.set(typeName, enumValues);
      
      migrationCode += `
    await sequelize.query(\`CREATE TYPE IF NOT EXISTS "${typeName}" AS ENUM (${enumValues})\`);`;
    }
  });
  
  migrationCode += `
    
    console.log('Tipos ENUM creados correctamente');
  } catch (error) {
    console.error('Error al crear tipos ENUM:', error);
    throw error;
  }
}

module.exports = { createPostgresEnums };
`;

  return migrationCode;
}

// Función principal
function main() {
  const allEnums = [];
  
  // Leer todos los archivos de modelo
  const modelFiles = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.model.js'));
  
  console.log(`Analizando ${modelFiles.length} archivos de modelo...`);
  
  // Extraer ENUMs de cada archivo
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    const enumsInFile = extractEnumsFromFile(filePath);
    
    if (enumsInFile.length > 0) {
      console.log(`  - ${file}: ${enumsInFile.length} ENUMs encontrados`);
      allEnums.push(...enumsInFile);
    }
  });
  
  console.log(`\nTotal: ${allEnums.length} ENUMs encontrados en todos los modelos`);
  
  // Generar script de migración
  const migrationScript = generateMigrationScript(allEnums);
  
  // Guardar el script
  const outputPath = path.join(__dirname, '../utils/postgresEnumHelper.js');
  fs.writeFileSync(outputPath, migrationScript);
  
  console.log(`\nScript de migración generado en: ${outputPath}`);
}

main(); 