const { Contacto, Cliente, SeguimientoCliente, sequelize } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los contactos de un cliente
exports.findAllByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    const contactos = await Contacto.findAll({
      where: { cliente_id: clienteId },
      order: [
        ['es_principal', 'DESC'],
        ['nombre', 'ASC']
      ]
    });
    
    res.status(200).json(contactos);
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    res.status(500).json({ message: 'Error al obtener contactos', error: error.message });
  }
};

// Obtener un contacto específico
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contacto = await Contacto.findByPk(id, {
      include: [
        {
          model: Cliente,
          attributes: ['id', 'razon_social', 'rut']
        }
      ]
    });
    
    if (!contacto) {
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }
    
    res.status(200).json(contacto);
  } catch (error) {
    console.error('Error al obtener contacto:', error);
    res.status(500).json({ message: 'Error al obtener contacto', error: error.message });
  }
};

// Crear un nuevo contacto
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      cliente_id, 
      nombre,
      apellido, 
      cargo, 
      email, 
      telefono_directo, 
      telefono_movil, 
      es_principal, 
      departamento,
      es_decision_maker, 
      notas 
    } = req.body;
    
    // Verificar si el cliente existe
    const cliente = await Cliente.findByPk(cliente_id, { transaction: t });
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Si es contacto principal, verificar si ya existe uno y actualizar
    if (es_principal) {
      const contactoPrincipalExistente = await Contacto.findOne({
        where: { 
          cliente_id,
          es_principal: true
        },
        transaction: t
      });
      
      if (contactoPrincipalExistente) {
        await contactoPrincipalExistente.update(
          { es_principal: false },
          { transaction: t }
        );
      }
    }
    
    // Crear el contacto
    const nuevoContacto = await Contacto.create({
      cliente_id,
      nombre,
      apellido,
      cargo,
      email,
      telefono_directo,
      telefono_movil,
      es_principal: es_principal || false,
      es_decision_maker: es_decision_maker || false,
      departamento,
      notas
    }, { transaction: t });
    
    // Si es contacto principal, actualizar la información en el cliente
    if (es_principal) {
      await cliente.update({
        contacto_nombre: nombre,
        contacto_cargo: cargo,
        contacto_email: email,
        contacto_telefono: telefono_directo || telefono_movil
      }, { transaction: t });
    }
    
    await t.commit();
    
    res.status(201).json({
      message: 'Contacto creado exitosamente',
      contacto: nuevoContacto
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear contacto:', error);
    res.status(500).json({ message: 'Error al crear contacto', error: error.message });
  }
};

// Actualizar un contacto existente
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      nombre,
      apellido, 
      cargo, 
      email, 
      telefono_directo, 
      telefono_movil, 
      es_principal,
      es_decision_maker, 
      departamento, 
      notas 
    } = req.body;
    
    // Verificar si el contacto existe
    const contacto = await Contacto.findByPk(id, { transaction: t });
    if (!contacto) {
      await t.rollback();
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }
    
    // Si se está convirtiendo en contacto principal, actualizar el contacto principal existente
    if (es_principal && !contacto.es_principal) {
      const contactoPrincipalExistente = await Contacto.findOne({
        where: { 
          cliente_id: contacto.cliente_id,
          es_principal: true
        },
        transaction: t
      });
      
      if (contactoPrincipalExistente) {
        await contactoPrincipalExistente.update(
          { es_principal: false },
          { transaction: t }
        );
      }
    }
    
    // Actualizar el contacto
    await contacto.update({
      ...(nombre && { nombre }),
      ...(apellido !== undefined && { apellido }),
      ...(cargo && { cargo }),
      ...(email && { email }),
      ...(telefono_directo && { telefono_directo }),
      ...(telefono_movil && { telefono_movil }),
      ...(es_principal !== undefined && { es_principal }),
      ...(es_decision_maker !== undefined && { es_decision_maker }),
      ...(departamento && { departamento }),
      ...(notas !== undefined && { notas })
    }, { transaction: t });
    
    // Si es contacto principal, actualizar la información en el cliente
    if (es_principal) {
      const cliente = await Cliente.findByPk(contacto.cliente_id, { transaction: t });
      if (cliente) {
        await cliente.update({
          contacto_nombre: nombre || contacto.nombre,
          contacto_cargo: cargo || contacto.cargo,
          contacto_email: email || contacto.email,
          contacto_telefono: telefono_directo || contacto.telefono_directo || telefono_movil || contacto.telefono_movil
        }, { transaction: t });
      }
    }
    
    await t.commit();
    
    // Obtener el contacto actualizado con el cliente
    const contactoActualizado = await Contacto.findByPk(id, {
      include: [
        {
          model: Cliente,
          attributes: ['id', 'razon_social', 'rut']
        }
      ]
    });
    
    res.status(200).json({
      message: 'Contacto actualizado exitosamente',
      contacto: contactoActualizado
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar contacto:', error);
    res.status(500).json({ message: 'Error al actualizar contacto', error: error.message });
  }
};

// Eliminar un contacto
exports.delete = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Verificar si el contacto existe
    const contacto = await Contacto.findByPk(id, { transaction: t });
    if (!contacto) {
      await t.rollback();
      return res.status(404).json({ message: 'Contacto no encontrado' });
    }
    
    // Si es contacto principal, verificar que no sea el único
    if (contacto.es_principal) {
      const cantidadContactos = await Contacto.count({
        where: { cliente_id: contacto.cliente_id },
        transaction: t
      });
      
      if (cantidadContactos > 1) {
        // Buscar el siguiente contacto para convertirlo en principal
        const siguienteContacto = await Contacto.findOne({
          where: { 
            cliente_id: contacto.cliente_id,
            id: { [Op.ne]: id }
          },
          order: [['createdAt', 'DESC']],
          transaction: t
        });
        
        if (siguienteContacto) {
          // Actualizar el siguiente contacto como principal
          await siguienteContacto.update({ es_principal: true }, { transaction: t });
          
          // Actualizar la información en el cliente
          const cliente = await Cliente.findByPk(contacto.cliente_id, { transaction: t });
          if (cliente) {
            await cliente.update({
              contacto_nombre: siguienteContacto.nombre,
              contacto_cargo: siguienteContacto.cargo,
              contacto_email: siguienteContacto.email,
              contacto_telefono: siguienteContacto.telefono_directo || siguienteContacto.telefono_movil
            }, { transaction: t });
          }
        }
      }
    }
    
    // Eliminar los seguimientos asociados al contacto
    await SeguimientoCliente.destroy({
      where: { contacto_id: id },
      transaction: t
    });
    
    // Eliminar el contacto
    await contacto.destroy({ transaction: t });
    
    await t.commit();
    
    res.status(200).json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar contacto:', error);
    res.status(500).json({ message: 'Error al eliminar contacto', error: error.message });
  }
}; 