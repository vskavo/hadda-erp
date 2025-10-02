// Script de prueba para verificar el parsing XML corregido
const SiiService = require('./services/sii.service');

console.log('🧪 Probando funciones de extracción XML...\n');

// Simular diferentes formatos que puede devolver xml2js
const testCases = [
  // Caso 1: String simple
  { input: '33', expected: '33', description: 'String simple' },
  // Caso 2: Objeto con propiedad _
  { input: { _: '33' }, expected: '33', description: 'Objeto con _' },
  // Caso 3: Objeto con _ y espacios
  { input: { _: '  33  ' }, expected: '33', description: 'Objeto con _ y espacios' },
  // Caso 4: Null/undefined
  { input: null, expected: null, description: 'Null' },
  { input: undefined, expected: null, description: 'Undefined' },
  // Caso 5: Número
  { input: 33, expected: null, description: 'Número (no soportado)' }
];

console.log('📝 Probando extractXmlValue:');
testCases.forEach((testCase, index) => {
  const result = SiiService.extractXmlValue(testCase.input);
  const success = result === testCase.expected ? '✅' : '❌';
  console.log(`  ${index + 1}. ${testCase.description}: ${success} (${JSON.stringify(testCase.input)} → ${JSON.stringify(result)})`);
});

console.log('\n🔢 Probando extractXmlNumber:');
const numberTestCases = [
  { input: '123.45', expected: 123.45, description: 'Número decimal string' },
  { input: { _: '123.45' }, expected: 123.45, description: 'Número decimal objeto' },
  { input: 'invalid', expected: null, description: 'String inválido' },
  { input: null, expected: null, description: 'Null' }
];

numberTestCases.forEach((testCase, index) => {
  const result = SiiService.extractXmlNumber(testCase.input);
  const success = result === testCase.expected ? '✅' : '❌';
  console.log(`  ${index + 1}. ${testCase.description}: ${success} (${JSON.stringify(testCase.input)} → ${result})`);
});

console.log('\n🔢 Probando extractXmlInt:');
const intTestCases = [
  { input: '33', expected: 33, description: 'Entero string' },
  { input: { _: '33' }, expected: 33, description: 'Entero objeto' },
  { input: '33.5', expected: 33, description: 'Decimal (convierte a entero)' },
  { input: 'invalid', expected: null, description: 'String inválido' },
  { input: null, expected: null, description: 'Null' }
];

intTestCases.forEach((testCase, index) => {
  const result = SiiService.extractXmlInt(testCase.input);
  const success = result === testCase.expected ? '✅' : '❌';
  console.log(`  ${index + 1}. ${testCase.description}: ${success} (${JSON.stringify(testCase.input)} → ${result})`);
});

console.log('\n✨ Pruebas completadas. Las funciones helper están listas para manejar los diferentes formatos que devuelve xml2js.');
