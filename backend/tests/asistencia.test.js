const request = require('supertest');
const app = require('../app');
const { Asistencia, Participante, Curso, Usuario, Sesion } = require('../models');
const { generarToken } = require('./helpers/auth');

let token;
let curso;
let participante;
let sesion;
let usuario;

beforeAll(async () => {
  // Crear usuario para pruebas
  usuario = await Usuario.create({
    nombre: 'Test',
    apellido: 'User',
    email: 'test.asistencia@example.com',
    password: 'password123',
    rol_id: 1
  });

  // Generar token para pruebas
  token = generarToken(usuario);

  // Crear curso para pruebas
  curso = await Curso.create({
    nombre: 'Curso de prueba para asistencias',
    codigo_sence: 'SENCE-TEST-001',
    fecha_inicio: '2024-06-01',
    fecha_fin: '2024-06-30',
    estado: 'activo',
    usuario_id: usuario.id
  });

  // Crear participante para pruebas
  participante = await Participante.create({
    curso_id: curso.id,
    rut: '12.345.678-9',
    nombre: 'Participante',
    apellido: 'Test',
    email: 'participante.test@example.com',
    estado: 'confirmado'
  });

  // Crear sesión para pruebas
  sesion = await Sesion.create({
    curso_id: curso.id,
    numero: 1,
    fecha: '2024-06-05',
    estado: 'programada',
    usuario_id: usuario.id
  });
});

afterAll(async () => {
  // Limpiar datos de prueba
  await Asistencia.destroy({ where: {} });
  await Sesion.destroy({ where: {} });
  await Participante.destroy({ where: {} });
  await Curso.destroy({ where: {} });
  await Usuario.destroy({ where: { email: 'test.asistencia@example.com' } });
});

describe('Pruebas de asistencia', () => {
  test('Debería registrar una asistencia', async () => {
    const response = await request(app)
      .post('/api/asistencias/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        participante_id: participante.id,
        curso_id: curso.id,
        fecha: '2024-06-05',
        estado: 'presente',
        hora_entrada: '09:00:00',
        hora_salida: '13:00:00',
        duracion_minutos: 240,
        observaciones: 'Asistencia registrada correctamente'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.participante_id).toBe(participante.id);
    expect(response.body.data.estado).toBe('presente');
  });

  test('Debería obtener asistencias por curso y fecha', async () => {
    const response = await request(app)
      .get(`/api/asistencias/curso/${curso.id}?fecha=2024-06-05`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.participantes).toBeDefined();
    expect(response.body.data.participantes.length).toBeGreaterThan(0);
  });

  test('Debería obtener asistencias por participante', async () => {
    const response = await request(app)
      .get(`/api/asistencias/participante/${participante.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.participante).toBeDefined();
    expect(response.body.data.asistencias).toBeDefined();
    expect(response.body.data.asistencias.length).toBeGreaterThan(0);
  });

  test('Debería actualizar una asistencia existente', async () => {
    const response = await request(app)
      .post('/api/asistencias/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        participante_id: participante.id,
        curso_id: curso.id,
        fecha: '2024-06-05',
        estado: 'atraso',
        hora_entrada: '09:15:00',
        hora_salida: '13:00:00',
        duracion_minutos: 225,
        observaciones: 'Asistencia actualizada con atraso'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.estado).toBe('atraso');
  });

  test('Debería registrar asistencias masivas', async () => {
    // Crear otro participante para pruebas
    const participante2 = await Participante.create({
      curso_id: curso.id,
      rut: '98.765.432-1',
      nombre: 'Otro',
      apellido: 'Participante',
      email: 'otro.participante@example.com',
      estado: 'confirmado'
    });

    const response = await request(app)
      .post(`/api/asistencias/curso/${curso.id}/masivas`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fecha: '2024-06-06',
        asistencias: [
          {
            participante_id: participante.id,
            estado: 'presente',
            hora_entrada: '09:00:00',
            hora_salida: '13:00:00'
          },
          {
            participante_id: participante2.id,
            estado: 'ausente',
            observaciones: 'No asistió'
          }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.exitosos).toBe(2);

    // Limpiar participante adicional
    await Participante.destroy({ where: { id: participante2.id } });
  });

  test('Debería obtener reporte de asistencia por curso', async () => {
    const response = await request(app)
      .get(`/api/asistencias/reporte/curso/${curso.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.curso).toBeDefined();
    expect(response.body.data.sesiones).toBeDefined();
    expect(response.body.data.matriz_asistencia).toBeDefined();
  });

  test('Debería eliminar una asistencia', async () => {
    // Primero obtenemos la asistencia
    const asistenciasResponse = await request(app)
      .get(`/api/asistencias/participante/${participante.id}`)
      .set('Authorization', `Bearer ${token}`);
    
    const asistenciaId = asistenciasResponse.body.data.asistencias[0].id;
    
    const response = await request(app)
      .delete(`/api/asistencias/${asistenciaId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
}); 