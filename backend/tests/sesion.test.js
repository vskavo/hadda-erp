const request = require('supertest');
const app = require('../app');
const { Sesion, Curso, Usuario } = require('../models');
const { generarToken } = require('./helpers/auth');

let token;
let curso;
let usuario;

beforeAll(async () => {
  // Crear usuario para pruebas
  usuario = await Usuario.create({
    nombre: 'Test',
    apellido: 'User',
    email: 'test.sesion@example.com',
    password: 'password123',
    rol_id: 1
  });

  // Generar token para pruebas
  token = generarToken(usuario);

  // Crear curso para pruebas
  curso = await Curso.create({
    nombre: 'Curso de prueba para sesiones',
    codigo_sence: 'SENCE-TEST-002',
    fecha_inicio: '2024-06-01',
    fecha_fin: '2024-06-30',
    estado: 'activo',
    usuario_id: usuario.id
  });
});

afterAll(async () => {
  // Limpiar datos de prueba
  await Sesion.destroy({ where: {} });
  await Curso.destroy({ where: {} });
  await Usuario.destroy({ where: { email: 'test.sesion@example.com' } });
});

describe('Pruebas de sesiones', () => {
  let sesionId;

  test('Debería crear una sesión', async () => {
    const response = await request(app)
      .post('/api/sesiones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        curso_id: curso.id,
        numero: 1,
        fecha: '2024-06-05',
        hora_inicio: '09:00:00',
        hora_fin: '13:00:00',
        duracion_minutos: 240,
        modalidad: 'presencial',
        ubicacion: 'Sala 101',
        contenido: 'Introducción al curso',
        estado: 'programada',
        observaciones: 'Primera sesión del curso'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.curso_id).toBe(curso.id);
    expect(response.body.data.numero).toBe(1);

    sesionId = response.body.data.id;
  });

  test('Debería obtener sesiones por curso', async () => {
    const response = await request(app)
      .get(`/api/sesiones/curso/${curso.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('Debería obtener una sesión por ID', async () => {
    const response = await request(app)
      .get(`/api/sesiones/${sesionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(sesionId);
  });

  test('Debería actualizar una sesión', async () => {
    const response = await request(app)
      .put(`/api/sesiones/${sesionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        hora_inicio: '09:30:00',
        hora_fin: '13:30:00',
        duracion_minutos: 240,
        contenido: 'Introducción al curso - Actualizado',
        observaciones: 'Primera sesión del curso - Actualizada'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.contenido).toBe('Introducción al curso - Actualizado');
  });

  test('Debería cambiar el estado de una sesión', async () => {
    const response = await request(app)
      .put(`/api/sesiones/${sesionId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        estado: 'en_curso'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.estado).toBe('en_curso');
  });

  test('Debería generar sesiones automáticamente', async () => {
    const response = await request(app)
      .post('/api/sesiones/generar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        curso_id: curso.id,
        fecha_inicio: '2024-06-10',
        fecha_fin: '2024-06-20',
        dias_semana: [1, 3, 5], // Lunes, Miércoles, Viernes
        hora_inicio: '14:00:00',
        hora_fin: '18:00:00',
        duracion_minutos: 240,
        modalidad: 'presencial',
        ubicacion: 'Sala 102'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('Debería eliminar una sesión', async () => {
    const response = await request(app)
      .delete(`/api/sesiones/${sesionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
}); 