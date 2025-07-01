/**
 * Controlador para gestionar la aprobación de proyectos y conversión a ventas
 */
const { models } = require('./proyecto.utils');
const { Proyecto, CostoProyecto, Ingreso, Egreso, sequelize, Usuario } = models;
const emailService = require('../../services/email.service');

// Aprobar o desaprobar un proyecto
exports.aprobarProyecto = async (req, res) => {
  const t = await sequelize.transaction();
  let committed = false;

  try {
    const { id } = req.params;
    const { aprobado } = req.body; // Espera un booleano: true o false

    // Validar que `aprobado` sea un booleano
    if (typeof aprobado !== 'boolean') {
      await t.rollback();
      return res.status(400).json({ message: 'El estado de aprobación debe ser un valor booleano (true o false).' });
    }

    // Buscar el proyecto
    const proyecto = await Proyecto.findByPk(id, { transaction: t });
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Actualizar el estado de aprobación
    await proyecto.update({
      aprobado,
      usuario_modificacion_id: req.usuario.id,
      fecha_actualizacion: new Date()
    }, { transaction: t });

    // Si se aprueba el proyecto, crear ingreso si no existe Y NOTIFICAR
    if (aprobado) {
      // Buscar si ya existe un ingreso para este proyecto
      const ingresoExistente = await Ingreso.findOne({
        where: { proyecto_id: proyecto.id },
        transaction: t
      });
      if (!ingresoExistente) {
        // Crear el ingreso con los datos del proyecto
        await Ingreso.create({
          descripcion: `Ingreso por proyecto: ${proyecto.nombre}`,
          monto: proyecto.presupuesto,
          fecha: new Date(),
          proyecto_id: proyecto.id,
          cliente_id: proyecto.cliente_id,
          tipo_ingreso: 'factura',
          estado: 'pendiente',
          usuario_id: req.usuario.id
        }, { transaction: t });
      }
      // --- Sincronizar egresos con costos ejecutados ---
      const costosEjecutados = await CostoProyecto.findAll({
        where: { proyecto_id: proyecto.id, estado: 'ejecutado' },
        transaction: t
      });
      for (const costo of costosEjecutados) {
        const egresoData = {
          descripcion: costo.concepto || costo.descripcion || 'Costo de proyecto',
          monto: costo.monto,
          fecha: costo.fecha,
          proyecto_id: costo.proyecto_id,
          proveedor_nombre: costo.proveedor,
          tipo_documento: costo.tipo_documento || 'factura',
          numero_documento: costo.numero_documento,
          fecha_documento: costo.fecha_documento,
          observaciones: costo.observaciones,
          usuario_id: costo.usuario_id || req.usuario.id,
          estado: 'pendiente',
        };
        if (costo.egreso_id) {
          await Egreso.update(egresoData, { where: { id: costo.egreso_id }, transaction: t });
        } else {
          const nuevoEgreso = await Egreso.create(egresoData, { transaction: t });
          await costo.update({ egreso_id: nuevoEgreso.id }, { transaction: t });
        }
      }

      // Notificar a los administradores que el proyecto fue aprobado
      const admins = await Usuario.findAll({
        include: [{
          association: Usuario.associations.Rol || 'Rol',
          where: { nombre: 'administrador' },
          required: true
        }],
        where: { activo: true },
        attributes: ['email', 'nombre', 'apellido'],
        transaction: t
      });
      const adminEmails = admins.map(a => a.email).filter(Boolean);
      if (adminEmails.length > 0) {
        await emailService.enviarCorreo({
          to: adminEmails,
          subject: 'Proyecto aprobado exitosamente',
          text: `El proyecto "${proyecto.nombre}" ha sido aprobado exitosamente.`,
          html: `<p>El proyecto "<strong>${proyecto.nombre}</strong>" ha sido aprobado exitosamente.</p>`
        });
      }
    }

    await t.commit();
    committed = true;

    res.status(200).json({
      message: `Proyecto ${aprobado ? 'aprobado' : 'desaprobado'} exitosamente`,
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        aprobado: proyecto.aprobado
      }
    });

  } catch (error) {
    console.error('Error al cambiar estado de aprobación del proyecto:', error);
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Error al hacer rollback:', rollbackError);
      }
    }
    res.status(500).json({ message: 'Error al cambiar estado de aprobación del proyecto', error: error.message });
  }
};

// Convertir proyecto a venta
exports.convertirAVenta = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Buscar el proyecto
    const proyecto = await Proyecto.findByPk(id, {
      include: [
        {
          model: models.Cliente,
          as: 'Cliente',
          attributes: ['id', 'razon_social']
        }
      ]
    });
    
    if (!proyecto) {
      await t.rollback();
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Ya no bloqueamos si está en curso, solo actualizamos si es necesario
    if (proyecto.estado !== 'En curso') {
      await proyecto.update({
        estado: 'En curso',
        usuario_modificacion_id: req.usuario.id
      }, { transaction: t });
    }

    // Crear registro de venta
    const Venta = sequelize.models.Venta;
    
    if (!Venta) {
      await t.rollback();
      return res.status(500).json({ message: 'Error en el modelo de Venta' });
    }

    // Verificar si ya existe una venta para este proyecto
    const ventaExistente = await Venta.findOne({
      where: { proyecto_id: proyecto.id },
      transaction: t
    });
    if (ventaExistente) {
      await t.rollback();
      return res.status(400).json({ message: 'Ya existe una venta para este proyecto' });
    }

    // Definir solo los campos que existen en la tabla real
    const ventaData = {
      cliente_id: proyecto.cliente_id,
      proyecto_id: proyecto.id,
      titulo: `Venta de proyecto: ${proyecto.nombre}`,
      descripcion: proyecto.descripcion,
      fecha_venta: new Date(),
      monto_neto: proyecto.presupuesto,
      iva: proyecto.presupuesto * 0.19, // IVA 19%
      monto_total: proyecto.presupuesto * 1.19,
      estado: 'en_proceso',
      usuario_id: req.usuario.id
    };
    
    // Especificar exactamente los campos existentes en la tabla
    const venta = await Venta.create(ventaData, { 
      transaction: t,
      fields: [
        'cliente_id',
        'proyecto_id',
        'titulo',
        'descripcion',
        'fecha_venta',
        'monto_neto',
        'iva',
        'monto_total',
        'estado',
        'usuario_id'
      ]
    });
    
    await t.commit();
    
    res.status(200).json({
      message: 'Proyecto convertido a venta exitosamente',
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        estado: proyecto.estado
      },
      venta: {
        id: venta.id,
        monto_total: venta.monto_total
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al convertir proyecto a venta:', error);
    res.status(500).json({ 
      message: 'Error al convertir proyecto a venta', 
      error: error.message 
    });
  }
};

// Saber si un proyecto tiene venta asociada
exports.tieneVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const Venta = sequelize.models.Venta;
    if (!Venta) {
      return res.status(500).json({ message: 'Error en el modelo de Venta' });
    }
    const venta = await Venta.findOne({ where: { proyecto_id: id } });
    res.json({ tieneVenta: !!venta });
  } catch (error) {
    console.error('Error al consultar si el proyecto tiene venta:', error);
    res.status(500).json({ message: 'Error al consultar si el proyecto tiene venta', error: error.message });
  }
}; 