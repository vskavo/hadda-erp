const { sequelize } = require('../models');
const { CursoSence } = require('../models');
const { Op } = require('sequelize');
const { logError } = require('../utils/logger');

/**
 * Controlador para gestionar cursos SENCE
 */
const cursoSenceController = {
  /**
   * Obtener todos los cursos SENCE
   */
  getAllCursosSence: async (req, res) => {
    try {
      const cursos = await CursoSence.findAll({
        order: [['nombre_curso', 'ASC']]
      });
      
      return res.status(200).json({
        success: true,
        cursos
      });
    } catch (error) {
      logError('Error al obtener cursos SENCE:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener cursos SENCE',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Obtener un curso SENCE por ID
   */
  getCursoSenceById: async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el ID del curso'
        });
      }
      
      const curso = await CursoSence.findByPk(id);
      
      if (!curso) {
        return res.status(404).json({
          success: false,
          message: 'Curso SENCE no encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        curso
      });
    } catch (error) {
      logError(`Error al obtener curso SENCE con ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener curso SENCE',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Buscar cursos SENCE por nombre o código
   */
  searchCursosSence: async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un término de búsqueda'
        });
      }
      
      const cursos = await CursoSence.findAll({
        where: {
          [Op.or]: [
            {
              nombre_curso: {
                [Op.iLike]: `%${query}%`
              }
            },
            {
              codigo_curso: {
                [Op.iLike]: `%${query}%`
              }
            }
          ]
        },
        order: [['nombre_curso', 'ASC']]
      });
      
      return res.status(200).json({
        success: true,
        cursos
      });
    } catch (error) {
      logError(`Error al buscar cursos SENCE con query ${req.query.query}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error al buscar cursos SENCE',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Obtener las modalidades de cursos SENCE
   */
  getModalidades: async (req, res) => {
    try {
      const modalidades = await CursoSence.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('modalidad')), 'modalidad'],
        ],
        where: {
          modalidad: {
            [Op.not]: null
          }
        },
        raw: true
      });
      
      return res.status(200).json({
        success: true,
        modalidades: modalidades.map(m => ({ id: m.modalidad, nombre: m.modalidad }))
      });
    } catch (error) {
      logError('Error al obtener modalidades de cursos SENCE:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener modalidades',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Obtener los modos de cursos SENCE
   */
  getModos: async (req, res) => {
    try {
      const modos = await CursoSence.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('modo')), 'modo'],
        ],
        where: {
          modo: {
            [Op.not]: null
          }
        },
        raw: true
      });

      return res.status(200).json({
        success: true,
        modos: modos.map(m => ({ id: m.modo, nombre: m.modo }))
      });
    } catch (error) {
      logError('Error al obtener modos de cursos SENCE:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener modos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Crear un nuevo curso SENCE
   */
  createCursoSence: async (req, res) => {
    try {
      const {
        codigo_curso,
        solicitud_curso,
        nombre_curso,
        modalidad,
        modo,
        tipo,
        nivel,
        horas,
        valor_franquicia,
        valor_efectivo_participante,
        valor_imputable_participante,
        resolucion_autorizacion,
        estado,
        numero_deposito,
        fecha_ingreso,
        fecha_evaluacion,
        fecha_resolucion,
        fecha_vigencia,
        fecha_pago
      } = req.body;

      // Validación básica
      if (!nombre_curso) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del curso es obligatorio'
        });
      }

      const nuevoCurso = await CursoSence.create({
        codigo_curso,
        solicitud_curso,
        nombre_curso,
        modalidad,
        modo,
        tipo,
        nivel,
        horas: horas ? parseInt(horas) : null,
        valor_franquicia: valor_franquicia ? parseFloat(valor_franquicia) : null,
        valor_efectivo_participante: valor_efectivo_participante ? parseFloat(valor_efectivo_participante) : null,
        valor_imputable_participante: valor_imputable_participante ? parseFloat(valor_imputable_participante) : null,
        resolucion_autorizacion,
        estado,
        numero_deposito,
        fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : null,
        fecha_evaluacion: fecha_evaluacion ? new Date(fecha_evaluacion) : null,
        fecha_resolucion: fecha_resolucion ? new Date(fecha_resolucion) : null,
        fecha_vigencia: fecha_vigencia ? new Date(fecha_vigencia) : null,
        fecha_pago: fecha_pago ? new Date(fecha_pago) : null
      });

      return res.status(201).json({
        success: true,
        message: 'Curso SENCE creado exitosamente',
        curso: nuevoCurso
      });
    } catch (error) {
      logError('Error al crear curso SENCE:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al crear curso SENCE',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Crear múltiples cursos SENCE desde CSV
   */
  bulkCreateCursosSence: async (req, res) => {
    try {
      const { cursos } = req.body;

      if (!Array.isArray(cursos) || cursos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de cursos válido'
        });
      }

      const resultados = [];
      let creados = 0;
      let errores = 0;

      for (const cursoData of cursos) {
        try {
          // Validación básica
          if (!cursoData.nombre_curso) {
            resultados.push({
              fila: cursoData._rowIndex || 'N/A',
              error: 'El nombre del curso es obligatorio'
            });
            errores++;
            continue;
          }

          const nuevoCurso = await CursoSence.create({
            codigo_curso: cursoData.codigo_curso,
            solicitud_curso: cursoData.solicitud_curso,
            nombre_curso: cursoData.nombre_curso,
            modalidad: cursoData.modalidad,
            modo: cursoData.modo,
            tipo: cursoData.tipo,
            nivel: cursoData.nivel,
            horas: cursoData.horas ? parseInt(cursoData.horas) : null,
            valor_franquicia: cursoData.valor_franquicia ? parseFloat(cursoData.valor_franquicia) : null,
            valor_efectivo_participante: cursoData.valor_efectivo_participante ? parseFloat(cursoData.valor_efectivo_participante) : null,
            valor_imputable_participante: cursoData.valor_imputable_participante ? parseFloat(cursoData.valor_imputable_participante) : null,
            resolucion_autorizacion: cursoData.resolucion_autorizacion,
            estado: cursoData.estado,
            numero_deposito: cursoData.numero_deposito,
            fecha_ingreso: cursoData.fecha_ingreso ? new Date(cursoData.fecha_ingreso) : null,
            fecha_evaluacion: cursoData.fecha_evaluacion ? new Date(cursoData.fecha_evaluacion) : null,
            fecha_resolucion: cursoData.fecha_resolucion ? new Date(cursoData.fecha_resolucion) : null,
            fecha_vigencia: cursoData.fecha_vigencia ? new Date(cursoData.fecha_vigencia) : null,
            fecha_pago: cursoData.fecha_pago ? new Date(cursoData.fecha_pago) : null
          });

          creados++;
        } catch (error) {
          resultados.push({
            fila: cursoData._rowIndex || 'N/A',
            error: error.message
          });
          errores++;
        }
      }

      return res.status(200).json({
        success: true,
        message: `Proceso completado. Creados: ${creados}, Errores: ${errores}`,
        estadisticas: { creados, errores },
        errores: resultados
      });
    } catch (error) {
      logError('Error en carga masiva de cursos SENCE:', error);
      return res.status(500).json({
        success: false,
        message: 'Error en carga masiva de cursos SENCE',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Actualizar un curso SENCE
   */
  updateCursoSence: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        codigo_curso,
        solicitud_curso,
        nombre_curso,
        modalidad,
        modo,
        tipo,
        nivel,
        horas,
        valor_franquicia,
        valor_efectivo_participante,
        valor_imputable_participante,
        resolucion_autorizacion,
        estado,
        numero_deposito,
        fecha_ingreso,
        fecha_evaluacion,
        fecha_resolucion,
        fecha_vigencia,
        fecha_pago
      } = req.body;

      // Validación básica
      if (!nombre_curso) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del curso es obligatorio'
        });
      }

      // Verificar que el curso existe
      const cursoExistente = await CursoSence.findByPk(id);
      if (!cursoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Curso SENCE no encontrado'
        });
      }

      // Actualizar el curso
      await cursoExistente.update({
        codigo_curso,
        solicitud_curso,
        nombre_curso,
        modalidad,
        modo,
        tipo,
        nivel,
        horas: horas ? parseInt(horas) : null,
        valor_franquicia: valor_franquicia ? parseFloat(valor_franquicia) : null,
        valor_efectivo_participante: valor_efectivo_participante ? parseFloat(valor_efectivo_participante) : null,
        valor_imputable_participante: valor_imputable_participante ? parseFloat(valor_imputable_participante) : null,
        resolucion_autorizacion,
        estado,
        numero_deposito,
        fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : null,
        fecha_evaluacion: fecha_evaluacion ? new Date(fecha_evaluacion) : null,
        fecha_resolucion: fecha_resolucion ? new Date(fecha_resolucion) : null,
        fecha_vigencia: fecha_vigencia ? new Date(fecha_vigencia) : null,
        fecha_pago: fecha_pago ? new Date(fecha_pago) : null
      });

      return res.status(200).json({
        success: true,
        message: 'Curso SENCE actualizado exitosamente',
        curso: cursoExistente
      });
    } catch (error) {
      logError('Error al actualizar curso SENCE:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar curso SENCE',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Eliminar un curso SENCE
   */
  deleteCursoSence: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el curso existe
      const cursoExistente = await CursoSence.findByPk(id);
      if (!cursoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Curso SENCE no encontrado'
        });
      }

      // Eliminar el curso
      await cursoExistente.destroy();

      return res.status(200).json({
        success: true,
        message: 'Curso SENCE eliminado exitosamente'
      });
    } catch (error) {
      logError('Error al eliminar curso SENCE:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar curso SENCE',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Descargar plantilla CSV
   */
  downloadTemplate: async (req, res) => {
    try {
      const csvHeaders = [
        'codigo_curso',
        'solicitud_curso',
        'nombre_curso',
        'modalidad',
        'modo',
        'tipo',
        'nivel',
        'horas',
        'valor_franquicia',
        'valor_efectivo_participante',
        'valor_imputable_participante',
        'resolucion_autorizacion',
        'estado',
        'numero_deposito',
        'fecha_ingreso',
        'fecha_evaluacion',
        'fecha_resolucion',
        'fecha_vigencia',
        'fecha_pago'
      ];

      const csvContent = csvHeaders.join(',') + '\n';

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="plantilla_cursos_sence.csv"');

      return res.status(200).send(csvContent);
    } catch (error) {
      logError('Error al descargar plantilla CSV:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al descargar plantilla CSV',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = cursoSenceController; 