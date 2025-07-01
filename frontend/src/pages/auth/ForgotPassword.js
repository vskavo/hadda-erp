import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Avatar,
  Link,
  Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { FormField } from '../../components/common';

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Email inválido')
        .required('Email es requerido'),
    }),
    onSubmit: async (values) => {
      try {
        setError('');
        // Enviar solicitud de recuperación de contraseña
        await axios.post('/api/auth/forgot-password', { email: values.email });
        setIsSubmitted(true);
      } catch (err) {
        setError(
          err.response?.data?.message || 
          'Error al enviar la solicitud. Intente nuevamente.'
        );
      }
    },
  });

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3} 
        sx={{ 
          mt: 8, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Recuperar Contraseña
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {isSubmitted ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Hemos enviado instrucciones para restablecer su contraseña a su correo electrónico.<br />
              <b>El enlace de recuperación es válido por 15 minutos.</b>
            </Alert>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Revise su bandeja de entrada y siga las instrucciones proporcionadas.
            </Typography>
            <Button 
              variant="outlined" 
              component={RouterLink} 
              to="/login" 
              sx={{ mt: 2 }}
            >
              Volver a Iniciar Sesión
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ingrese su dirección de correo electrónico y le enviaremos instrucciones para restablecer su contraseña. <b>El enlace será válido por 15 minutos.</b>
            </Typography>
            
            <FormField
              name="email"
              label="Email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              required
              autoFocus
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Enviando...' : 'Enviar Instrucciones'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Volver a iniciar sesión
              </Link>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword; 