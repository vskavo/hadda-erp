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
  }
};

module.exports = cursoSenceController; 