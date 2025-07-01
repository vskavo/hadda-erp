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
  MenuItem,
  Select,
  FormHelperText,
  Divider
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertMessage, LoadingIndicator } from '../../../components/common';

// Esquema de validación
const validationSchema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .max(100, 'El nombre no debe exceder los 100 caracteres'),
  apellido: yup
    .string()
    .required('El apellido es obligatorio')
    .max(100, 'El apellido no debe exceder los 100 caracteres'),
  rut: yup
    .string()
    .required('El RUT es obligatorio')
    .matches(/^[0-9]{1,2}(?:\.[0-9]{3}){2}-[0-9kK]$/, 'Formato de RUT inválido (ej: 12.345.678-9)'),
  email: yup
    .string()
    .email('Ingrese un email válido')
    .required('El email es obligatorio'),
  telefono: yup
    .string()
    .matches(/^(\+?56)?(\s?)(0?9)(\s?)[9876543]\d{7}$/, 'Formato de teléfono inválido (ej: +56 9 12345678)')
    .nullable(),
  empresa: yup
    .string()
    .max(200, 'El nombre de la empresa no debe exceder los 200 caracteres')
    .nullable(),
  cargo: yup
    .string()
    .max(100, 'El cargo no debe exceder los 100 caracteres')
    .nullable(),
});

const ParticipanteForm = () => {
  const { cursoId, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false);
  const [curso, setCurso] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Formik para manejar el formulario
  const formik = useFormik({
    initialValues: {
      nombre: '',
      apellido: '',
      rut: '',
      email: '',
      telefono: '',
      empresa: '',
      cargo: '',
      cursoId
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (id) {
          // Actualizar participante existente
          await axios.put(`/api/participantes/${id}`, values);
          setSuccessMessage('Participante actualizado con éxito');
        } else {
          // Crear nuevo participante
          await axios.post('/api/participantes', values);
          setSuccessMessage('Participante agregado con éxito');
        }

        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate(`/cursos/${cursoId}`);
        }, 2000);
      } catch (err) {
        setError('Error al guardar el participante: ' + (err.response?.data?.message || err.message));
      }
    },
  });

  // Cargar datos del curso y del participante si estamos editando
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar información del curso
        const cursoResponse = await axios.get(`/api/cursos/${cursoId}`);
        setCurso(cursoResponse.data);

        // Si estamos editando, cargar datos del participante
        if (id) {
          const participanteResponse = await axios.get(`/api/participantes/${id}`);
          formik.setValues({
            ...participanteResponse.data,
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
          {id ? 'Editar Participante' : 'Agregar Participante'}
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
            {/* Datos personales */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Datos Personales
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="nombre"
                name="nombre"
                label="Nombre"
                value={formik.values.nombre}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                helperText={formik.touched.nombre && formik.errors.nombre}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="apellido"
                name="apellido"
                label="Apellido"
                value={formik.values.apellido}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                helperText={formik.touched.apellido && formik.errors.apellido}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="rut"
                name="rut"
                label="RUT"
                placeholder="12.345.678-9"
                value={formik.values.rut}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.rut && Boolean(formik.errors.rut)}
                helperText={formik.touched.rut && formik.errors.rut}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="telefono"
                name="telefono"
                label="Teléfono"
                placeholder="+56 9 12345678"
                value={formik.values.telefono}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.telefono && Boolean(formik.errors.telefono)}
                helperText={formik.touched.telefono && formik.errors.telefono}
              />
            </Grid>
            
            {/* Datos laborales */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Datos Laborales
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="empresa"
                name="empresa"
                label="Empresa"
                value={formik.values.empresa}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.empresa && Boolean(formik.errors.empresa)}
                helperText={formik.touched.empresa && formik.errors.empresa}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="cargo"
                name="cargo"
                label="Cargo"
                value={formik.values.cargo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.cargo && Boolean(formik.errors.cargo)}
                helperText={formik.touched.cargo && formik.errors.cargo}
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
                  {id ? 'Actualizar Participante' : 'Agregar Participante'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ParticipanteForm; 