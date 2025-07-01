const { Comision, Rol } = require('../models'); 
const { Op } = require("sequelize");

exports.findAllComisiones = async (req, res) => {
  try {
    const comisiones = await Comision.findAll({
      include: [{
        model: Rol,
        attributes: ['id', 'nombre']
      }],
      order: [
        [Rol, 'nombre', 'ASC'], 
        ['margen_desde', 'ASC']
      ]
    });
    // Log para depuración
    console.log('Datos de comisiones a enviar:', JSON.stringify(comisiones, null, 2));
    res.status(200).json(comisiones);
  } catch (error) {
    console.error('Error al obtener rangos de comisión:', error);
    res.status(500).json({ message: 'Error interno al obtener rangos de comisión', error: error.message });
  }
};

exports.createComision = async (req, res) => {
  const { margen_desde, margen_hasta, rol_id, comision } = req.body;

  if (margen_desde === undefined || margen_hasta === undefined || rol_id === undefined || comision === undefined) {
    return res.status(400).json({ message: 'Los campos margen_desde, margen_hasta, rol_id y comision son requeridos.' });
  }

  if (isNaN(parseInt(rol_id))) {
    return res.status(400).json({ message: 'El rol_id debe ser un número válido.' });
  }

  try {
    const nuevaComision = await Comision.create({ 
      margen_desde,
      margen_hasta,
      rol_id,
      comision
    });
    
    const comisionCreada = await Comision.findByPk(nuevaComision.margen_id, {
        include: [{ model: Rol, attributes: ['id', 'nombre'] }]
    });
    
    res.status(201).json({ message: 'Rango de comisión creado exitosamente', comision: comisionCreada });
  } catch (error) {
    console.error('Error al crear rango de comisión:', error);
    if (error.name === 'SequelizeValidationError' || error.message.includes('menor que el margen') || error.message.includes('solapa') || error.message.includes('negativos')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: `El rol con ID ${rol_id} no existe.` });
    }
    res.status(500).json({ message: 'Error interno al crear rango de comisión', error: error.message });
  }
};

exports.updateComision = async (req, res) => {
  const id = req.params.id;
  const { margen_desde, margen_hasta, rol_id, comision } = req.body;

  if (margen_desde === undefined || margen_hasta === undefined || rol_id === undefined || comision === undefined) {
    return res.status(400).json({ message: 'Los campos margen_desde, margen_hasta, rol_id y comision son requeridos.' });
  }

  if (isNaN(parseInt(rol_id))) {
    return res.status(400).json({ message: 'El rol_id debe ser un número válido.' });
  }

  try {
    const comisionRecord = await Comision.findByPk(id);
    if (!comisionRecord) {
      return res.status(404).json({ message: 'Rango de comisión no encontrado.' });
    }

    comisionRecord.margen_desde = margen_desde;
    comisionRecord.margen_hasta = margen_hasta;
    comisionRecord.rol_id = rol_id;
    comisionRecord.comision = comision;
    await comisionRecord.save();

    const comisionActualizada = await Comision.findByPk(id, {
        include: [{ model: Rol, attributes: ['id', 'nombre'] }]
    });

    res.status(200).json({ message: 'Rango de comisión actualizado exitosamente', comision: comisionActualizada });
  } catch (error) {
    console.error('Error al actualizar rango de comisión:', error);
    if (error.name === 'SequelizeValidationError' || error.message.includes('menor que el margen') || error.message.includes('solapa') || error.message.includes('negativos')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: `El rol con ID ${rol_id} no existe.` });
    }
    res.status(500).json({ message: 'Error interno al actualizar rango de comisión', error: error.message });
  }
};

exports.deleteComision = async (req, res) => {
  const id = req.params.id;

  try {
    const comision = await Comision.findByPk(id);
    if (!comision) {
      return res.status(404).json({ message: 'Rango de comisión no encontrado.' });
    }

    await comision.destroy();
    res.status(200).json({ message: 'Rango de comisión eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar rango de comisión:', error);
    res.status(500).json({ message: 'Error interno al eliminar rango de comisión', error: error.message });
  }
}; 

// Nueva función para calcular la comisión basada en el margen y rol
exports.calcularComision = async (req, res) => {
  const { margen, rol_id } = req.query;
  
  console.log('Solicitud de cálculo de comisión recibida con parámetros:', { margen, rol_id });
  
  if (!margen || !rol_id) {
    console.log('Error: Faltan parámetros requeridos');
    return res.status(400).json({ message: 'Los parámetros margen y rol_id son requeridos.' });
  }

  // Convertir parámetros a números
  let margenNumeric = parseFloat(margen); // Cambiado a let para poder reasignar
  const rolIdNumeric = parseInt(rol_id);
  
  console.log('Parámetros convertidos (antes de redondear):', { margenNumeric, rolIdNumeric });
  
  if (isNaN(margenNumeric) || isNaN(rolIdNumeric)) {
    console.log('Error: Conversión de parámetros inválida');
    return res.status(400).json({ message: 'Los parámetros margen y rol_id deben ser números válidos.' });
  }

  // Redondear margenNumeric al entero más cercano
  margenNumeric = Math.round(margenNumeric);
  console.log('Margen numérico redondeado:', margenNumeric);

  try {
    // Buscar el rango de comisión que corresponde al margen y rol
    console.log('Buscando comisión para margen', margenNumeric, 'y rol_id', rolIdNumeric);
    
    const comisionRecord = await Comision.findOne({
      where: {
        rol_id: rolIdNumeric,
        margen_desde: { [Op.lte]: margenNumeric },
        [Op.or]: [
          { margen_hasta: { [Op.gte]: margenNumeric } },
          { margen_hasta: { [Op.is]: null } } // Para rangos abiertos (sin límite superior)
        ]
      },
      include: [{ model: Rol, attributes: ['id', 'nombre'] }]
    });

    console.log('Resultado de búsqueda de comisión:', comisionRecord ? {
      id: comisionRecord.margen_id,
      margen_desde: comisionRecord.margen_desde,
      margen_hasta: comisionRecord.margen_hasta,
      comision: comisionRecord.comision,
      rol_id: comisionRecord.rol_id
    } : 'No encontrado');

    if (!comisionRecord) {
      console.log('No se encontró un rango de comisión para los valores proporcionados');
      return res.status(404).json({ 
        message: 'No se encontró un rango de comisión para los valores proporcionados',
        comisionPorcentaje: 0,
        comision: 0
      });
    }

    // Devolver el porcentaje de comisión encontrado
    const respuesta = {
      message: 'Comisión calculada exitosamente',
      comisionPorcentaje: parseFloat(comisionRecord.comision),
      comision: comisionRecord
    };
    
    console.log('Respuesta enviada:', respuesta);
    
    res.status(200).json(respuesta);
    
  } catch (error) {
    console.error('Error al calcular comisión:', error);
    res.status(500).json({ message: 'Error interno al calcular comisión', error: error.message });
  }
};

// Nueva función para comprobar las comisiones existentes para un rol específico
exports.verificarComisionesRol = async (req, res) => {
  const { rol_id } = req.query;
  
  console.log('Verificando comisiones para rol:', rol_id);
  
  if (!rol_id) {
    return res.status(400).json({ message: 'El parámetro rol_id es requerido.' });
  }
  
  try {
    const rolIdNumeric = parseInt(rol_id);
    
    if (isNaN(rolIdNumeric)) {
      return res.status(400).json({ message: 'El rol_id debe ser un número válido.' });
    }
    
    // Buscar todas las comisiones para este rol
    const comisiones = await Comision.findAll({
      where: { rol_id: rolIdNumeric },
      order: [['margen_desde', 'ASC']],
      include: [{ model: Rol, attributes: ['id', 'nombre'] }]
    });
    
    console.log(`Se encontraron ${comisiones.length} rangos de comisión para el rol ${rol_id}`);
    
    // Formatear para salida más legible
    const comisionesFormateadas = comisiones.map(c => ({
      id: c.margen_id,
      margen_desde: parseFloat(c.margen_desde),
      margen_hasta: c.margen_hasta !== null ? parseFloat(c.margen_hasta) : null,
      comision: parseFloat(c.comision),
      rol: c.Rol ? { id: c.Rol.id, nombre: c.Rol.nombre } : null
    }));
    
    res.status(200).json({
      message: `Se encontraron ${comisiones.length} rangos de comisión`,
      comisiones: comisionesFormateadas
    });
    
  } catch (error) {
    console.error('Error al verificar comisiones por rol:', error);
    res.status(500).json({ message: 'Error interno al verificar comisiones', error: error.message });
  }
}; 