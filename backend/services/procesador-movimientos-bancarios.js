// backend/services/procesador-movimientos-bancarios.js
const procesarMovimientosPendientes = async () => {
    const t = await sequelize.transaction();
    try {
      // Obtener movimientos pendientes
      const movimientosPendientes = await MovimientoBancarioRaw.findAll({
        where: { estado_procesamiento: 'pendiente' },
        order: [['fecha_movimiento', 'ASC'], ['created_at', 'ASC']],
        limit: 100 // Procesar en lotes
      });
      
      for (const movimiento of movimientosPendientes) {
        try {
          // Comprobar si ya existe un ingreso/egreso con esta referencia
          const existeMovimiento = await verificarMovimientoExistente(
            movimiento.hash_movimiento, 
            movimiento.cuenta_bancaria_id
          );
          
          if (!existeMovimiento) {
            // Crear el registro correspondiente
            if (movimiento.tipo_movimiento === 'abono') {
              await Ingreso.create({
                monto: Math.abs(movimiento.monto),
                descripcion: movimiento.descripcion,
                fecha: movimiento.fecha_movimiento,
                tipo: 'bancario',
                cuenta_bancaria_id: movimiento.cuenta_bancaria_id,
                estado: 'confirmado',
                referencia_externa: movimiento.referencia,
                hash_origen: movimiento.hash_movimiento,
                datos_adicionales: movimiento.datos_adicionales
              }, { transaction: t });
            } else {
              await Egreso.create({
                monto: Math.abs(movimiento.monto),
                descripcion: movimiento.descripcion,
                fecha: movimiento.fecha_movimiento,
                tipo: 'bancario',
                cuenta_bancaria_id: movimiento.cuenta_bancaria_id,
                estado: 'pagado',
                referencia_externa: movimiento.referencia,
                hash_origen: movimiento.hash_movimiento,
                datos_adicionales: movimiento.datos_adicionales
              }, { transaction: t });
            }
          }
          
          // Marcar como procesado
          await movimiento.update({ 
            estado_procesamiento: 'procesado',
            procesado_at: new Date()
          }, { transaction: t });
        } catch (err) {
          console.error(`Error procesando movimiento ID ${movimiento.id}:`, err);
          await movimiento.update({ 
            estado_procesamiento: 'error',
            datos_adicionales: {
              ...movimiento.datos_adicionales,
              error_procesamiento: err.message
            }
          }, { transaction: t });
        }
      }
      
      await t.commit();
      return { procesados: movimientosPendientes.length };
    } catch (error) {
      await t.rollback();
      console.error('Error en procesamiento de movimientos bancarios:', error);
      throw error;
    }
  };