import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertMessage, LoadingIndicator } from '../../../components/common';

// Esquema de validación
const validationSchema = yup.object({
  fecha: yup
    .date()
    .required('La fecha es obligatoria')
    .nullable(),
  horaInicio: yup
    .date()
    .required('La hora de inicio es obligatoria')
    .nullable(),
  horaFin: yup
    .date()
    .required('La hora de fin es obligatoria')
    .nullable()
    .test('is-greater', 'La hora de fin debe ser posterior a la hora de inicio', function(value) {
      const { horaInicio } = this.parent;
      if (!horaInicio || !value) return true;
      return value > horaInicio;
    }),
  modalidad: yup
    .string()
    .required('La modalidad es obligatoria')
    .oneOf(['presencial', 'online', 'mixta'], 'Modalidad no válida'),
  ubicacion: yup
    .string()
    .max(200, 'La ubicación no debe exceder los 200 caracteres')
    .when('modalidad', {
      is: (modalidad) => modalidad === 'presencial' || modalidad === 'mixta',
      then: yup.string().required('La ubicación es obligatoria para modalidad presencial o mixta')
    }),
  linkAcceso: yup
    .string()
    .max(500, 'El enlace no debe exceder los 500 caracteres')
    .when('modalidad', {
      is: (modalidad) => modalidad === 'online' || modalidad === 'mixta',
      then: yup.string().required('El enlace de acceso es obligatorio para modalidad online o mixta')
    }),
  tema: yup
    .string()
    .max(200, 'El tema no debe exceder los 200 caracteres'),
  descripcion: yup
    .string()
    .max(1000, 'La descripción no debe exceder los 1000 caracteres')
});

const SesionForm = () => {
  const { cursoId, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false);
  const [curso, setCurso] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Formik para manejar el formulario
  const formik = useFormik({
    initialValues: {
      fecha: null,
      horaInicio: null,
      horaFin: null,
      modalidad: 'presencial',
      ubicacion: '',
      linkAcceso: '',
      tema: '',
      descripcion: '',
      cursoId
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Formatear fechas y horas para el envío
        const formattedValues = {
          ...values,
          fecha: values.fecha ? values.fecha.toISOString().split('T')[0] : null,
          horaInicio: values.horaInicio ? values.horaInicio.toTimeString().slice(0, 5) : null,
          horaFin: values.horaFin ? values.horaFin.toTimeString().slice(0, 5) : null,
        };

        if (id) {
          // Actualizar sesión existente
          await axios.put(`/api/sesiones/${id}`, formattedValues);
          setSuccessMessage('Sesión actualizada con éxito');
        } else {
          // Crear nueva sesión
          await axios.post('/api/sesiones', formattedValues);
          setSuccessMessage('Sesión agregada con éxito');
        }

        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate(`/cursos/${cursoId}`);
        }, 2000);
      } catch (err) {
        setError('Error al guardar la sesión: ' + (err.response?.data?.message || err.message));
      }
    },
  });

  // Cargar datos del curso y de la sesión si estamos editando
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar información del curso
        const cursoResponse = await axios.get(`/api/cursos/${cursoId}`);
        setCurso(cursoResponse.data);

        // Si estamos editando, cargar datos de la sesión
        if (id) {
          const sesionResponse = await axios.get(`/api/sesiones/${id}`);
          const sesion = sesionResponse.data;
          
          // Convertir strings a objetos Date
          const fechaObj = sesion.fecha ? new Date(sesion.fecha) : null;
          
          // Para las horas, necesitamos crear objetos Date completos
          let horaInicioObj = null;
          let horaFinObj = null;
          
          if (sesion.horaInicio) {
            horaInicioObj = new Date();
            const [hours, minutes] = sesion.horaInicio.split(':');
            horaInicioObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
          }
          
          if (sesion.horaFin) {
            horaFinObj = new Date();
            const [hours, minutes] = sesion.horaFin.split(':');
            horaFinObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
          }
          
          formik.setValues({
            ...sesion,
            fecha: fechaObj,
            horaInicio: horaInicioObj,
            horaFin: horaFinObj,
            cursoId
          });
        }
      } catch (err) {
        setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cursoId, id]);

  // Manejar cambios de modalidad para mostrar/ocultar campos específicos
  const handleModalidadChange = (event) => {
    const modalidad = event.target.value;
    formik.setFieldValue('modalidad', modalidad);
    
    // Limpiar campos no relevantes según la modalidad
    if (modalidad === 'online') {
      formik.setFieldValue('ubicacion', '');
    } else if (modalidad === 'presencial') {
      formik.setFieldValue('linkAcceso', '');
    }
  };

  if (loading) {
    return <LoadingIndicator message="Cargando datos..." />;
  }

  if (!curso) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <AlertMessage
          type="error"
          message="No se pudo encontrar el curso solicitado"
          show={true}
        />
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained"
            onClick={() => navigate('/cursos')}
          >
            Volver a Cursos
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {id ? 'Editar Sesión' : 'Agregar Sesión'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Curso: {curso.nombre}
        </Typography>
        
        {error && (
          <AlertMessage
            type="error"
            message={error}
            show={!!error}
            onClose={() => setError('')}
            sx={{ mb: 2 }}
          />
        )}
        
        {successMessage && (
          <AlertMessage
            type="success"
            message={successMessage}
            show={!!successMessage}
            onClose={() => setSuccessMessage('')}
            sx={{ mb: 2 }}
          />
        )}
        
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Fecha y horario */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Fecha y Horario
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Fecha"
                value={formik.values.fecha}
                onChange={(date) => formik.setFieldValue('fecha', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.fecha && Boolean(formik.errors.fecha),
                    helperText: formik.touched.fecha && formik.errors.fecha,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TimePicker
                label="Hora Inicio"
                value={formik.values.horaInicio}
                onChange={(time) => formik.setFieldValue('horaInicio', time)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.horaInicio && Boolean(formik.errors.horaInicio),
                    helperText: formik.touched.horaInicio && formik.errors.horaInicio,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TimePicker
                label="Hora Fin"
                value={formik.values.horaFin}
                onChange={(time) => formik.setFieldValue('horaFin', time)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.horaFin && Boolean(formik.errors.horaFin),
                    helperText: formik.touched.horaFin && formik.errors.horaFin,
                  },
                }}
              />
            </Grid>
            
            {/* Modalidad y ubicación */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Modalidad y Ubicación
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.modalidad && Boolean(formik.errors.modalidad)}>
                <InputLabel id="modalidad-label">Modalidad</InputLabel>
                <Select
                  labelId="modalidad-label"
                  id="modalidad"
                  name="modalidad"
                  value={formik.values.modalidad}
                  onChange={handleModalidadChange}
                  onBlur={formik.handleBlur}
                  label="Modalidad"
                >
                  <MenuItem value="presencial">Presencial</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="mixta">Mixta</MenuItem>
                </Select>
                {formik.touched.modalidad && formik.errors.modalidad && (
                  <FormHelperText>{formik.errors.modalidad}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {(formik.values.modalidad === 'presencial' || formik.values.modalidad === 'mixta') && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="ubicacion"
                  name="ubicacion"
                  label="Ubicación"
                  value={formik.values.ubicacion}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.ubicacion && Boolean(formik.errors.ubicacion)}
                  helperText={formik.touched.ubicacion && formik.errors.ubicacion}
                  required={formik.values.modalidad === 'presencial' || formik.values.modalidad === 'mixta'}
                />
              </Grid>
            )}
            
            {(formik.values.modalidad === 'online' || formik.values.modalidad === 'mixta') && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="linkAcceso"
                  name="linkAcceso"
                  label="Enlace de Acceso"
                  value={formik.values.linkAcceso}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.linkAcceso && Boolean(formik.errors.linkAcceso)}
                  helperText={formik.touched.linkAcceso && formik.errors.linkAcceso}
                  required={formik.values.modalidad === 'online' || formik.values.modalidad === 'mixta'}
                />
              </Grid>
            )}
            
            {/* Contenido de la sesión */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Contenido de la Sesión
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="tema"
                name="tema"
                label="Tema"
                value={formik.values.tema}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.tema && Boolean(formik.errors.tema)}
                helperText={formik.touched.tema && formik.errors.tema}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="descripcion"
                name="descripcion"
                label="Descripción"
                multiline
                rows={4}
                value={formik.values.descripcion}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.descripcion && Boolean(formik.errors.descripcion)}
                helperText={formik.touched.descripcion && formik.errors.descripcion}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/cursos/${cursoId}`)}
                  sx={{ mr: 2 }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={formik.isSubmitting}
                >
                  {id ? 'Actualizar Sesión' : 'Agregar Sesión'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default SesionForm; 