class EntityNotFoundError extends Error {
  constructor(entityName, entityId) {
    super(`${entityName} con ID ${entityId} no encontrado/a.`);
    this.name = 'EntityNotFoundError';
    this.statusCode = 404; // Estándar para 'Not Found'
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

async function validarExistenciaEntidad(Model, id, entityNameForError, transaction = null) {
  if (id === null || id === undefined) {
    // Si el ID es opcional y no se proporciona, no hay nada que validar.
    // Devolver null o undefined según se prefiera para indicar que no se encontró o no se validó.
    return null; 
  }
  const options = transaction ? { transaction } : {};
  const entidad = await Model.findByPk(id, options);
  if (!entidad) {
    throw new EntityNotFoundError(entityNameForError, id);
  }
  return entidad; // Devolver la entidad encontrada puede ser útil para el servicio.
}

module.exports = {
  EntityNotFoundError,
  validarExistenciaEntidad
}; 