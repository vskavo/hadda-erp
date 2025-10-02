const { sequelize } = require('../models');
const { Proyecto, CostoProyecto } = sequelize.models;

/**
 * Este script recalcula el campo `costo_real` de todos los proyectos
 * basándose en la suma de sus costos asociados en la tabla `CostoProyectos`.
 */
const recalcularCostosReales = async () => {
  console.log('Iniciando la recalculación de costos reales de proyectos...');
  const t = await sequelize.transaction();

  try {
    // Obtener todos los proyectos
    const proyectos = await Proyecto.findAll({ transaction: t });
    console.log(`Se encontraron ${proyectos.length} proyectos para procesar.`);

    let proyectosActualizados = 0;

    // Iterar sobre cada proyecto
    for (const proyecto of proyectos) {
      // Calcular la suma de los montos de sus costos asociados
      const totalCostos = await CostoProyecto.sum('monto', {
        where: { proyecto_id: proyecto.id },
        transaction: t
      });
      
      const nuevoCostoReal = totalCostos || 0;

      // Si el costo real calculado es diferente al almacenado, actualizarlo
      if (parseFloat(proyecto.costo_real) !== parseFloat(nuevoCostoReal)) {
        console.log(`Actualizando proyecto ID ${proyecto.id}: ${proyecto.costo_real} -> ${nuevoCostoReal}`);
        await proyecto.update({ costo_real: nuevoCostoReal }, { transaction: t });
        proyectosActualizados++;
      }
    }

    await t.commit();
    console.log('--------------------------------------------------');
    console.log('Recalculación completada exitosamente.');
    console.log(`${proyectosActualizados} de ${proyectos.length} proyectos fueron actualizados.`);
    console.log('--------------------------------------------------');

  } catch (error) {
    await t.rollback();
    console.error('Error durante la recalculación de costos:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

recalcularCostosReales();
