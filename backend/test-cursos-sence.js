const { sequelize, CursoSence } = require('./models');

async function testCursosSence() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');

    console.log('\n📊 Consultando cursos SENCE existentes...');
    const cursos = await CursoSence.findAll({
      limit: 5,
      order: [['id', 'DESC']]
    });

    console.log(`📋 Encontrados ${cursos.length} cursos:`);
    cursos.forEach((curso, index) => {
      console.log(`\n--- Curso ${index + 1} ---`);
      console.log(`ID: ${curso.id}`);
      console.log(`Código: ${curso.codigo_curso}`);
      console.log(`Nombre: ${curso.nombre_curso}`);
      console.log(`Modalidad: ${curso.modalidad}`);
      console.log(`Modo: ${curso.modo}`);
      console.log(`Estado: ${curso.estado}`);
      console.log(`Horas: ${curso.horas}`);
      console.log(`Valor Franquicia: ${curso.valor_franquicia}`);
      console.log(`Fecha Ingreso: ${curso.fecha_ingreso}`);
      console.log(`Creado: ${curso.createdAt}`);
      console.log(`Actualizado: ${curso.updatedAt}`);
    });

    // Probar inserción de un curso de prueba
    console.log('\n🧪 Creando curso de prueba...');
    const cursoPrueba = await CursoSence.create({
      codigo_curso: 'TEST123',
      solicitud_curso: 'SOL123',
      nombre_curso: 'Curso de Prueba - Liderazgo',
      modalidad: 'A distancia',
      modo: 'Auto aprendizaje',
      tipo: 'Capacitación',
      nivel: 'Básico',
      horas: 40,
      valor_franquicia: 50000,
      valor_efectivo_participante: 250000,
      valor_imputable_participante: 200000,
      resolucion_autorizacion: 'RES123',
      estado: 'Aprobado',
      numero_deposito: 'DEP123',
      fecha_ingreso: new Date('2024-08-20'),
      fecha_evaluacion: new Date('2024-08-25'),
      fecha_resolucion: new Date('2024-08-30'),
      fecha_vigencia: new Date('2024-08-30'),
      fecha_pago: new Date('2024-08-30')
    });

    console.log('✅ Curso de prueba creado exitosamente:');
    console.log(`ID: ${cursoPrueba.id}`);
    console.log(`Código: ${cursoPrueba.codigo_curso}`);
    console.log(`Modo: ${cursoPrueba.modo}`);

    // Verificar que se guardó correctamente
    console.log('\n🔍 Verificando que el curso se guardó...');
    const cursoVerificado = await CursoSence.findByPk(cursoPrueba.id);
    console.log(`✅ Modo guardado: "${cursoVerificado.modo}"`);

    // Limpiar curso de prueba
    console.log('\n🗑️  Eliminando curso de prueba...');
    await cursoPrueba.destroy();
    console.log('✅ Curso de prueba eliminado');

    console.log('\n🎉 Prueba completada exitosamente!');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar la prueba
testCursosSence();
