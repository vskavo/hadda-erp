import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Avatar, 
  Button, 
  Divider,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { 
  FormBuilder, 
  LoadingIndicator, 
  AlertMessage, 
  Confirm 
} from '../../components/common';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import * as Yup from 'yup';

// Componente para TabPanel
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [openChangePasswordConfirm, setOpenChangePasswordConfirm] = useState(false);
  const [passwordValues, setPasswordValues] = useState(null);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Campos para el formulario de información personal
  const personalInfoFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      validation: Yup.string().required('El nombre es requerido'),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'apellido',
      label: 'Apellido',
      type: 'text',
      required: true,
      validation: Yup.string().required('El apellido es requerido'),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      disabled: true, // El email no debería cambiar fácilmente
      validation: Yup.string().email('Email inválido').required('Email es requerido'),
      gridProps: { xs: 12 }
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'tel',
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'cargo',
      label: 'Cargo',
      type: 'text',
      gridProps: { xs: 12, sm: 6 }
    },
  ];

  // Campos para el formulario de cambio de contraseña
  const passwordFields = [
    {
      name: 'currentPassword',
      label: 'Contraseña Actual',
      type: 'password',
      required: true,
      validation: Yup.string().required('La contraseña actual es requerida'),
      gridProps: { xs: 12 }
    },
    {
      name: 'newPassword',
      label: 'Nueva Contraseña',
      type: 'password',
      required: true,
      validation: Yup.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
        )
        .required('La nueva contraseña es requerida'),
      gridProps: { xs: 12 }
    },
    {
      name: 'confirmPassword',
      label: 'Confirmar Contraseña',
      type: 'password',
      required: true,
      validation: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Las contraseñas deben coincidir')
        .required('Confirme la contraseña'),
      gridProps: { xs: 12 }
    }
  ];

  // Manejar actualización de información personal
  const handleUpdatePersonalInfo = async (values) => {
    setLoading(true);
    setUpdateSuccess(false);
    setUpdateError('');

    try {
      const response = await axios.put('/api/users/profile', values);
      updateUser(response.data.user);
      setUpdateSuccess(true);
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      setUpdateError(
        error.response?.data?.message || 
        'Error al actualizar la información. Por favor, intente nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de contraseña
  const handleUpdatePassword = async (values) => {
    setPasswordValues(values); // Guardar los valores del formulario
    setOpenChangePasswordConfirm(true);
  };

  // Confirmar cambio de contraseña
  const confirmPasswordChange = async () => {
    if (!passwordValues) return;
    
    setLoading(true);
    setUpdateSuccess(false);
    setUpdateError('');

    try {
      await axios.put('/api/users/change-password', {
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword
      });
      
      setUpdateSuccess(true);
      setOpenChangePasswordConfirm(false);
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      setUpdateError(
        error.response?.data?.message || 
        'Error al cambiar la contraseña. Por favor, intente nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoadingIndicator />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Encabezado de perfil */}
        <Grid item xs={12}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              alignItems: 'center',
              gap: 3
            }}
          >
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'primary.main',
                fontSize: 40
              }}
            >
              {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" gutterBottom>
                {user.nombre} {user.apellido}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user.email}
              </Typography>
              {user.cargo && (
                <Typography variant="body2">
                  {user.cargo}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Pestañas de perfil */}
        <Grid item xs={12}>
          <Paper elevation={2}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              aria-label="Pestañas de perfil"
            >
              <Tab icon={<PersonIcon />} label="Información Personal" id="profile-tab-0" />
              <Tab icon={<SecurityIcon />} label="Seguridad" id="profile-tab-1" />
            </Tabs>
            
            {/* Información Personal */}
            <TabPanel value={tabValue} index={0}>
              {updateSuccess && (
                <AlertMessage 
                  type="success" 
                  message="Información actualizada con éxito" 
                  show={updateSuccess} 
                />
              )}
              
              {updateError && (
                <AlertMessage 
                  type="error" 
                  message={updateError} 
                  show={!!updateError} 
                  onClose={() => setUpdateError('')} 
                />
              )}
              
              <FormBuilder
                fields={personalInfoFields}
                initialValues={{
                  nombre: user.nombre || '',
                  apellido: user.apellido || '',
                  email: user.email || '',
                  telefono: user.telefono || '',
                  cargo: user.cargo || ''
                }}
                onSubmit={handleUpdatePersonalInfo}
                loading={loading}
                submitText="Actualizar Información"
                showCancelButton={false}
                paperProps={{ elevation: 0, sx: { p: 0 } }}
              />
            </TabPanel>
            
            {/* Seguridad */}
            <TabPanel value={tabValue} index={1}>
              {updateSuccess && (
                <AlertMessage 
                  type="success" 
                  message="Contraseña actualizada con éxito" 
                  show={updateSuccess} 
                />
              )}
              
              {updateError && (
                <AlertMessage 
                  type="error" 
                  message={updateError} 
                  show={!!updateError} 
                  onClose={() => setUpdateError('')} 
                />
              )}
              
              <FormBuilder
                fields={passwordFields}
                initialValues={{
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                }}
                onSubmit={handleUpdatePassword}
                loading={loading}
                submitText="Cambiar Contraseña"
                showCancelButton={false}
                paperProps={{ elevation: 0, sx: { p: 0 } }}
              />
              
              <Confirm
                open={openChangePasswordConfirm}
                onClose={() => setOpenChangePasswordConfirm(false)}
                onConfirm={confirmPasswordChange}
                title="Cambiar Contraseña"
                message="¿Estás seguro de que deseas cambiar tu contraseña? Tendrás que iniciar sesión nuevamente con la nueva contraseña."
                confirmText="Cambiar"
                cancelText="Cancelar"
                type="warning"
                loading={loading}
              />
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserProfile; 