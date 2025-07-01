/**
 * Controlador de Cursos de Proyectos
 */
const { models } = require('./proyecto.utils');
const { Proyecto, Curso } = models;

// Obtener cursos asociados a un proyecto
exports.getCursos = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el proyecto existe
    const proyecto = await Proyecto.findByPk(id);
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Buscar los cursos relacionados con este proyecto
    const cursos = await Curso.findAll({
      where: { proyecto_id: id },
      attributes: [
        'id', 'nombre', 'codigo_sence', 'id_sence', 'duracion_horas', 'valor_total', 'valor_participante',
        'nro_participantes', 'modalidad', 'estado_sence', 'fecha_inicio', 'fecha_fin',
        'tipo_de_contrato', 'estado_pre_contrato', 'fecha_creacion', 'fecha_actualizacion'
      ]
    });
    
    res.status(200).json({
      proyecto_id: id,
      cursos
    });
  } catch (error) {
    console.error('Error al obtener cursos del proyecto:', error);
    res.status(500).json({ message: 'Error al obtener cursos del proyecto', error: error.message });
  }
}; 