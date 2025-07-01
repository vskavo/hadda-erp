/**
 * Controlador para obtener detalles completos de proyectos
 */
const { models } = require('./proyecto.utils');
const { Proyecto, Cliente, Usuario, Curso } = models;

/**
 * Obtiene los detalles completos de un proyecto incluyendo cliente y responsable
 */
exports.getDetallesCompletos = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proyecto = await Proyecto.findByPk(id, {
      include: [
        {
          model: Cliente,
          attributes: ['id', 'razon_social', 'rut', 'contacto_email', 'contacto_nombre', 'contacto_telefono']
        },
        {
          model: Usuario,
          as: 'Responsable',
          attributes: ['id', 'nombre', 'apellido', 'email']
        },
        {
          model: Curso,
          as: 'Cursos',
          attributes: [
            'id', 'nombre', 'codigo_sence', 'duracion_horas', 'valor_total', 
            'nro_participantes', 'modalidad', 'estado_sence', 
            'tipo_de_contrato', 'estado_pre_contrato'
          ]
        }
      ]
    });
    
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: proyecto
    });
  } catch (error) {
    console.error('Error al obtener detalles completos del proyecto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener detalles completos del proyecto',
      error: error.message
    });
  }
}; 