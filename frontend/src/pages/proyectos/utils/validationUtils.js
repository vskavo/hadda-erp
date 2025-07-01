// Validación de campos obligatorios para el formulario de proyecto
export const validateProyectoForm = (formData) => {
  const errors = {};

  if (!formData.nombre) {
    errors.nombre = 'El nombre del proyecto es obligatorio';
  }

  if (!formData.cliente_id) {
    errors.cliente_id = 'Debe seleccionar un cliente';
  }

  if (!formData.fecha_inicio) {
    errors.fecha_inicio = 'La fecha de inicio es obligatoria';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validación para el formulario de costo
export const validateCostoForm = (costoData) => {
  const errors = {};

  if (!costoData.concepto) {
    errors.concepto = 'El concepto es obligatorio';
  }

  if (!costoData.monto) {
    errors.monto = 'El monto es obligatorio';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validación para el formulario de curso
export const validateCursoForm = (cursoData) => {
  const errors = {};

  if (!cursoData.curso_sence_id) {
    errors.curso_sence_id = 'Debe seleccionar un curso';
  }

  if (!cursoData.cantidad_participantes) {
    errors.cantidad_participantes = 'La cantidad de participantes es obligatoria';
  }

  // Validar límites de la base de datos
  if (parseFloat(cursoData.valor_total) >= 100000000) {
    errors.valor_total = 'El valor total no puede ser mayor a $99,999,999.99';
  }

  if (parseFloat(cursoData.valor_participante) >= 100000000) {
    errors.valor_participante = 'El valor por participante no puede ser mayor a $99,999,999.99';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 