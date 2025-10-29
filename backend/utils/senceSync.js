const axios = require('axios');
const { Participante, Asistencia, Curso, sequelize } = require('../models');

async function sincronizarConSence(curso_id) {
  const transaction = await sequelize.transaction();

  try {
    // Buscar el curso por ID para obtener el id_sence
    const curso = await Curso.findByPk(curso_id, { transaction });

    if (!curso) {
      throw new Error(`No se encontró un curso con ID: ${curso_id}`);
    }

    if (!curso.id_sence) {
      throw new Error(`El curso ${curso_id} no tiene un id_sence configurado`);
    }

    // Llamar a la Azure Function con el id_sence del curso
    const response = await axios.post('https://sencecursossync.azurewebsites.net/api/extracciondatossence', {
      acc_cap: curso.id_sence
    });

    const payload = response.data;

    // Verificar que el payload tenga la estructura esperada
    if (!payload.curso || !payload.participantes || !Array.isArray(payload.participantes)) {
      throw new Error('El payload recibido no tiene la estructura esperada');
    }

    // Procesar participantes
    const participantesProcesados = [];
    for (const participanteData of payload.participantes) {
      try {
        // Mapear campos del payload a la estructura de la base de datos
        const participanteMapped = {
          curso_id: curso_id,
          rut: participanteData.rut,
          nombre: participanteData.nombre,
          apellido: participanteData.apellido,
          tramo_sence: participanteData.tramo_sence,
          estado: participanteData.estado || 'inscrito',
          porcentaje_asistencia: participanteData.asistencia_porcentaje || 0,
          // Email es obligatorio, usamos un placeholder por ahora
          email: `${participanteData.rut.replace('-', '').replace('K', 'k')}@placeholder.com`,
          certificado: false
        };

        // Crear o actualizar participante (upsert)
        const [participante, created] = await Participante.upsert(participanteMapped, {
          transaction,
          returning: true
        });

        participantesProcesados.push({
          id: participante.id,
          rut: participante.rut,
          asistio: participanteData.asistio
        });

      } catch (error) {
        console.error(`Error procesando participante ${participanteData.rut}:`, error.message);
        // Continuar con el siguiente participante
      }
    }

    // Procesar asistencias
    const asistenciasCreadas = [];
    for (const participante of participantesProcesados) {
      try {
        // Crear asistencia basada en el estado de asistencia del participante
        const asistenciaMapped = {
          participante_id: participante.id,
          curso_id: curso_id,
          fecha: new Date().toISOString().split('T')[0], // Fecha actual como DATEONLY
          estado: participante.asistio ? 'presente' : 'ausente',
          duracion_minutos: participante.asistio ? 480 : 0 // Asumiendo 8 horas si asistió
        };

        // Verificar si ya existe una asistencia para este participante en esta fecha
        const asistenciaExistente = await Asistencia.findOne({
          where: {
            participante_id: participante.id,
            fecha: asistenciaMapped.fecha
          },
          transaction
        });

        if (!asistenciaExistente) {
          const asistencia = await Asistencia.create(asistenciaMapped, { transaction });
          asistenciasCreadas.push(asistencia);
        }

      } catch (error) {
        console.error(`Error creando asistencia para participante ${participante.rut}:`, error.message);
        // Continuar con el siguiente
      }
    }

    // Confirmar la transacción
    await transaction.commit();

    return {
      success: true,
      data: {
        curso: payload.curso,
        participantes_procesados: participantesProcesados.length,
        asistencias_creadas: asistenciasCreadas.length,
        resumen: payload.resumen
      },
      message: `Sincronización completada. Participantes: ${participantesProcesados.length}, Asistencias: ${asistenciasCreadas.length}`
    };

  } catch (err) {
    // Revertir la transacción en caso de error
    await transaction.rollback();

    if (err.response && err.response.data && typeof err.response.data === 'string' && err.response.data.includes('duplicate key value violates unique constraint')) {
      return { success: false, message: 'Error: El curso ya existe en SENCE (duplicado)', data: err.response.data };
    }
    return { success: false, message: 'Error al sincronizar con SENCE', data: err.response ? err.response.data : err.message };
  }
}

module.exports = { sincronizarConSence }; 