/**
 * Controlador de Costos de Proyectos
 */
const { models } = require('./proyecto.utils');
const { Proyecto, CostoProyecto, sequelize } = models;

// Añadir un costo a un proyecto
exports.addCosto = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Verificar que el proyecto existe
    const proyecto = await Proyecto.findByPk(id);
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    console.log('Estado inicial del proyecto:', {
      id: proyecto.id,
      presupuesto: proyecto.presupuesto,
      costo_real: proyecto.costo_real
    });
    
    // Preparar los datos del costo
    let {
      concepto, 
      tipo_costo, 
      monto, 
      fecha, 
      proveedor,
      aprobado,
      aprobado_por,
      tipo_documento,
      fecha_documento,
      observaciones,
      incluido_rentabilidad = true,
      aplica_iva = true,
      aplica_honorarios = false 
    } = req.body;
    
    // Forzar regla de negocio: si aplica_honorarios es true, aplica_iva debe ser false
    if (aplica_honorarios === true) {
        aplica_iva = false;
    }
    
    // Definir solo los campos que existen en la tabla
    const dataCosto = {
      proyecto_id: id,
      concepto: concepto, 
      tipo_costo,
      monto,
      fecha,
      proveedor,
      estado: 'ejecutado', 
      usuario_id: req.usuario?.id || 1, 
      aplica_iva: aplica_iva,
      aplica_honorarios: aplica_honorarios,
      aprobado: aprobado || false, 
      aprobado_por: aprobado ? (aprobado_por || null) : null
    };
    
    // Añadir campos opcionales adicionales si están presentes
    if (tipo_documento) dataCosto.tipo_documento = tipo_documento;
    if (fecha_documento) dataCosto.fecha_documento = fecha_documento;
    if (observaciones) dataCosto.observaciones = observaciones;
    if (incluido_rentabilidad !== undefined) dataCosto.incluido_rentabilidad = incluido_rentabilidad;
    
    // Crear el registro de costo
    const costoProyecto = await CostoProyecto.create(dataCosto, { transaction: t });
    
    // Obtener el proyecto actualizado para verificar el costo_real
    const proyectoActualizado = await Proyecto.findByPk(id, { transaction: t });
    
    console.log('Estado final del proyecto después de añadir el costo:', {
      id: proyectoActualizado.id,
      presupuesto: proyectoActualizado.presupuesto,
      costo_real: proyectoActualizado.costo_real
    });
    
    await t.commit();
    
    res.status(201).json({
      message: 'Costo añadido exitosamente',
      costo: costoProyecto,
      proyecto: {
        id: proyectoActualizado.id,
        presupuesto: proyectoActualizado.presupuesto,
        costo_real: proyectoActualizado.costo_real
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al añadir costo:', error);
    res.status(500).json({ message: 'Error al añadir costo', error: error.message });
  }
};

// Actualizar un costo de un proyecto
exports.updateCosto = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id, costoId } = req.params;
    
    // Verificar que el proyecto existe
    const proyecto = await Proyecto.findByPk(id);
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Verificar que el costo existe y pertenece al proyecto
    const costoExistente = await CostoProyecto.findOne({
      where: { id: costoId, proyecto_id: id }
    });
    
    if (!costoExistente) {
      await t.rollback();
      return res.status(404).json({ message: 'Costo no encontrado para este proyecto' });
    }
    
    // Preparar los datos actualizados del costo
    let {
      concepto, 
      tipo_costo, 
      monto, 
      fecha, 
      proveedor,
      aprobado,
      aprobado_por,
      tipo_documento,
      fecha_documento,
      observaciones,
      incluido_rentabilidad = true,
      aplica_iva = true,
      aplica_honorarios = false 
    } = req.body;
    
    // Forzar regla de negocio: si aplica_honorarios es true, aplica_iva debe ser false
    if (aplica_honorarios === true) {
        aplica_iva = false;
    }
    
    // Definir solo los campos que se van a actualizar
    const dataCosto = {
      concepto: concepto, 
      tipo_costo,
      monto,
      fecha,
      proveedor,
      usuario_id: req.usuario?.id || costoExistente.usuario_id, 
      aplica_iva: aplica_iva,
      aplica_honorarios: aplica_honorarios
    };
    
    // Añadir campos opcionales si están presentes
    if (aprobado !== undefined) dataCosto.aprobado = aprobado;

    // Manejo de aprobado_por:
    // Si 'aprobado' es true y 'aprobado_por' tiene un valor, se usa ese valor.
    // Si 'aprobado' es true pero 'aprobado_por' está vacío o no definido, se usa null (o se podría tomar del usuario actual si la lógica de negocio lo requiere).
    // Si 'aprobado' es false, 'aprobado_por' debe ser null.
    if (aprobado === true) {
      if (aprobado_por !== undefined && aprobado_por !== '') {
        dataCosto.aprobado_por = aprobado_por;
      } else {
        // Si aprobado es true pero no se especifica quién aprueba, se podría asignar el usuario actual
        // o dejarlo como null si la lógica permite que un costo sea aprobado sin especificar por quién.
        // Por ahora, lo dejamos como null si no se proporciona explícitamente.
        dataCosto.aprobado_por = null; 
      }
    } else if (aprobado === false) {
      dataCosto.aprobado_por = null;
    } else if (aprobado_por !== undefined && aprobado_por !== '') {
        // Si el estado de 'aprobado' no cambia, pero se envía un 'aprobado_por'
        dataCosto.aprobado_por = aprobado_por;
    } else if (aprobado_por === '') {
        // Si se envía un string vacío para aprobado_por y 'aprobado' no cambia (o es undefined), se establece a null.
        dataCosto.aprobado_por = null;
    }

    if (tipo_documento) dataCosto.tipo_documento = tipo_documento;
    if (fecha_documento) dataCosto.fecha_documento = fecha_documento;
    if (observaciones) dataCosto.observaciones = observaciones;
    if (incluido_rentabilidad !== undefined) dataCosto.incluido_rentabilidad = incluido_rentabilidad;
    
    // Actualizar el registro de costo
    await CostoProyecto.update(dataCosto, { 
      where: { id: costoId, proyecto_id: id },
      transaction: t 
    });
    
    // Obtener el costo actualizado
    const costoActualizado = await CostoProyecto.findByPk(costoId, { transaction: t });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Costo actualizado exitosamente',
      costo: costoActualizado
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar costo:', error);
    res.status(500).json({ message: 'Error al actualizar costo', error: error.message });
  }
};

// Eliminar un costo de un proyecto
exports.deleteCosto = async (req, res) => {
  const { id, costoId } = req.params;
  const t = await sequelize.transaction();
  
  try {
    // Verificar si el proyecto existe
    const proyecto = await Proyecto.findByPk(id);
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Buscar el costo para obtener su monto antes de eliminarlo
    const costo = await CostoProyecto.findOne({
      where: { id: costoId, proyecto_id: id }
    });
    
    if (!costo) {
      await t.rollback();
      return res.status(404).json({ message: 'Costo no encontrado para este proyecto' });
    }
    
    // Eliminar el costo
    await CostoProyecto.destroy({
      where: { id: costoId, proyecto_id: id },
      transaction: t
    });
    
    await t.commit();
    return res.status(200).json({ 
      message: 'Costo eliminado correctamente',
      costoId
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar costo del proyecto:', error);
    return res.status(500).json({ 
      message: 'Error al eliminar costo del proyecto',
      error: error.message 
    });
  }
}; 