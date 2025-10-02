import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Avatar,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { FormField } from '../../components/common';

const ResetPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [validatingToken, setValidatingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      try {
        // Validar el token de restablecimiento
        await axios.get(`/api/auth/reset-password/${token}/validate`);
        setTokenValid(true);
      } catch (err) {
        setError(
          err.response?.data?.message || 
          'El enlace de restablecimiento es inválido o ha expirado.'
        );
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
        )
        .required('La contraseña es requerida'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Las contraseñas deben coincidir')
        .required('Confirme la contraseña'),
    }),
    onSubmit: async (values) => {
      try {
        setError('');
        // Enviar nueva contraseña
        await axios.post(`/api/auth/reset-password/${token}`, { 
          password: values.password 
        });
        setIsSubmitted(true);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setError(
          err.response?.data?.message || 
          'Error al restablecer la contraseña. Intente nuevamente.'
        );
      }
    },
  });

  // Si está validando el token, mostrar spinner
  if (validatingToken) {
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
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Verificando enlace de restablecimiento...
          </Typography>
        </Paper>
      </Container>
    );
  }

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
          <LockResetIcon />
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Restablecer Contraseña
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!tokenValid && !validatingToken ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              El enlace de restablecimiento de contraseña es inválido o ha expirado.
            </Typography>
            <Button 
              variant="contained" 
              component={RouterLink} 
              to="/forgot-password" 
              sx={{ mt: 2 }}
            >
              Solicitar nuevo enlace
            </Button>
          </Box>
        ) : isSubmitted ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Su contraseña ha sido restablecida con éxito!
            </Alert>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Será redirigido a la página de inicio de sesión en unos momentos...
            </Typography>
            <Button 
              variant="contained" 
              component={RouterLink} 
              to="/login" 
              sx={{ mt: 2 }}
            >
              Iniciar Sesión
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ingrese su nueva contraseña para restablecerla.
            </Typography>
            
            <FormField
              name="password"
              label="Nueva Contraseña"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              required
              autoFocus
            />
            
            <FormField
              name="confirmPassword"
              label="Confirmar Contraseña"
              type="password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              required
              sx={{ mt: 2 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Procesando...' : 'Restablecer Contraseña'}
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

export default ResetPassword; 