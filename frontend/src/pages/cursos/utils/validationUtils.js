import * as yup from 'yup';

/**
 * Esquemas de validación Yup y funciones auxiliares para validaciones del formulario de cursos.
 */

export const cursoValidationSchema = yup.object({
  // Solo validamos id_sence cuando estamos editando
  id_sence: yup
    .string()
    .max(50, 'El ID SENCE no debe exceder los 50 caracteres'),
  // El resto de validaciones solo aplican para nuevo curso
  nombre: yup.string().when('$isEditing', {
    is: false,
    then: () => yup
    .string()
    .required('El nombre del curso es obligatorio')
    .max(200, 'El nombre no debe exceder los 200 caracteres'),
  }),
  codigo_sence: yup.string().when('$isEditing', {
    is: false,
    then: () => yup
    .string()
      .max(50, 'El código SENCE no debe exceder los 50 caracteres'),
  }),
  duracion_horas: yup.number().when('$isEditing', {
    is: false,
    then: () => yup
    .number()
    .positive('La duración debe ser un número positivo')
    .integer('La duración debe ser un número entero')
      .required('La duración en horas es obligatoria')
    .typeError('La duración debe ser un número'),
  }),
  valor_hora: yup.number().when('$isEditing', {
    is: false,
    then: () => yup
    .number()
      .positive('El valor por hora debe ser un número positivo')
      .required('El valor por hora es obligatorio')
      .typeError('El valor por hora debe ser un número'),
  }),
  valor_total: yup.number().when('$isEditing', {
    is: false,
    then: () => yup
    .number()
      .positive('El valor total debe ser un número positivo')
      .required('El valor total es obligatorio')
      .typeError('El valor total debe ser un número'),
  }),
  modalidad: yup.string().when('$isEditing', {
    is: false,
    then: () => yup
    .string()
    .required('La modalidad es obligatoria'),
  }),
  nro_participantes: yup.number().when('$isEditing', {
    is: false,
    then: () => yup
      .number()
      .min(0, 'El número de participantes no puede ser negativo')
      .integer('El número de participantes debe ser un número entero')
      .typeError('El número de participantes debe ser un número'),
  }),
  estado_sence: yup.string().oneOf(
    ['pendiente', 'aprobado', 'rechazado', 'en_revision'],
    'Estado SENCE no válido'
  ),
  tipo_de_contrato: yup.string().max(100, 'El tipo de contrato no debe exceder los 100 caracteres'),
  estado_pre_contrato: yup.string().max(100, 'El estado de pre-contrato no debe exceder los 100 caracteres')
});

/**
 * Genera valores iniciales para el formulario de curso
 */
export const getInitialValues = (isEditing = false) => ({
  nombre: '',
  codigo_sence: '',
  id_sence: '',
  duracion_horas: '',
  valor_hora: '',
  valor_total: '',
  modalidad: '',
  descripcion: '',
  objetivos: '',
  contenidos: '',
  requisitos: '',
  materiales: '',
  nro_participantes: '',
  fecha_inicio: null,
  fecha_fin: null,
  participantes_aprobados: 0,
  participantes_reprobados: 0,
  participantes_eliminados: 0,
  estado: 'activo',
  estado_sence: 'pendiente',
  tipo_de_contrato: '',
  estado_pre_contrato: '',
  proyecto_id: null,
  owner_operaciones: '',
  owner_operaciones_nombre: ''
});

// Aquí se pueden agregar más funciones de validación si es necesario 