import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  IconButton,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import * as Yup from 'yup';

import { 
  DataTable, 
  Modal, 
  FormBuilder, 
  AlertMessage, 
  Confirm, 
  LoadingIndicator, 
  EmptyState 
} from '../../components/common';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
  const [openStatusConfirm, setOpenStatusConfirm] = useState(false);
  
  // Usuario seleccionado para operaciones
  const [selectedUser, setSelectedUser] = useState(null);

  // Estados para el modal de cambio de contraseña
  const [passwordValues, setPasswordValues] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });

  // Cargar usuarios
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/usuarios');
      const usuariosData = response.data.usuarios || response.data;
      setUsers(usuariosData);
      setError('');
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios. ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await axios.get('/api/roles');
      const rolesData = Array.isArray(response.data) ? response.data : response.data.roles || [];
      const formattedRoles = rolesData.map(rol => ({
        value: rol.nombre,
        label: rol.descripcion || rol.nombre
      }));
      setRolesList(formattedRoles);
      setError('');
    } catch (err) {
      console.error("Error al cargar roles:", err);
      setError(prevError => prevError || 'Error al cargar roles. ' + (err.response?.data?.message || ''));
      setRolesList([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Manejo de acciones sobre usuarios
  const handleCreateUser = async (userData) => {
    try {
      await axios.post('/api/usuarios', userData);
      setOpenCreateModal(false);
      setSuccessMessage('Usuario creado con éxito');
      fetchUsers();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al crear usuario. ' + (err.response?.data?.message || ''));
    }
  };

  const handleEditUser = async (userData) => {
    try {
      await axios.put(`/api/usuarios/${selectedUser.id}`, userData);
      setOpenEditModal(false);
      setSuccessMessage('Usuario actualizado con éxito');
      fetchUsers();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al actualizar usuario. ' + (err.response?.data?.message || ''));
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(`/api/usuarios/${selectedUser.id}`);
      setOpenDeleteConfirm(false);
      setSuccessMessage('Usuario eliminado con éxito');
      fetchUsers();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al eliminar usuario. ' + (err.response?.data?.message || ''));
    }
  };

  const handleOpenChangePasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordValues({ newPassword: '', confirmPassword: '' });
    setShowPassword({ new: false, confirm: false });
    setOpenChangePasswordModal(true);
  };

  const handleChangePasswordInput = (e) => {
    const { name, value } = e.target;
    setPasswordValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = (password) => {
    // Al menos 8 caracteres, una mayúscula, una minúscula y un número
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  };

  const handleChangePassword = async () => {
    if (!validatePassword(passwordValues.newPassword)) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.');
      return;
    }
    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    try {
      await axios.put(`/api/usuarios/${selectedUser.id}/password`, {
        newPassword: passwordValues.newPassword
      });
      setOpenChangePasswordModal(false);
      setSuccessMessage('Contraseña cambiada correctamente.');
      setError('');
      setPasswordValues({ newPassword: '', confirmPassword: '' });
      setSelectedUser(null);
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al cambiar la contraseña. ' + (err.response?.data?.message || ''));
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = selectedUser.activo ? 'inactive' : 'active';
      await axios.patch(`/api/usuarios/${selectedUser.id}/status`, { status: newStatus });
      setOpenStatusConfirm(false);
      setSuccessMessage(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'} con éxito`);
      fetchUsers();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al cambiar estado del usuario. ' + (err.response?.data?.message || ''));
    }
  };

  // Campos para formularios
  const userFields = [
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
    {
      name: 'role',
      id: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      validation: Yup.string().required('El rol es requerido'),
      options: loadingRoles ? [] : rolesList,
      disabled: loadingRoles,
      gridProps: { xs: 12 },
      inputProps: {
        name: 'role',
        id: 'role'
      }
    }
  ];

  // Campos adicionales para creación de usuario
  const createUserFields = [
    ...userFields,
    {
      name: 'password',
      label: 'Contraseña',
      type: 'password',
      required: true,
      validation: Yup.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
        )
        .required('La contraseña es requerida'),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'confirmPassword',
      label: 'Confirmar Contraseña',
      type: 'password',
      required: true,
      validation: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Las contraseñas deben coincidir')
        .required('Confirme la contraseña'),
      gridProps: { xs: 12, sm: 6 }
    }
  ];

  // Configuración de la tabla
  const columns = [
    { id: 'nombre', label: 'Nombre', sortable: true },
    { id: 'apellido', label: 'Apellido', sortable: true },
    { id: 'email', label: 'Email', sortable: true },
    { id: 'cargo', label: 'Cargo', sortable: true },
    { 
      id: 'role', 
      label: 'Rol', 
      sortable: true, 
      format: (value) => {
        const roleData = rolesList.find(r => r.value === value);
        return roleData ? roleData.label : value;
      }
    },
    { 
      id: 'activo', 
      label: 'Estado', 
      sortable: true,
      format: (value) => {
        return value ? (
          <Chip 
            label="Activo" 
            color="success" 
            size="small" 
            icon={<CheckCircleIcon />} 
          />
        ) : (
          <Chip 
            label="Inactivo" 
            color="error" 
            size="small" 
            icon={<BlockIcon />} 
          />
        );
      }
    },
  ];

  // Acciones para los usuarios
  const actions = [
    { 
      label: 'Editar', 
      icon: <EditIcon />, 
      onClick: (user) => {
        setSelectedUser(user);
        setOpenEditModal(true);
      }
    },
    { 
      label: 'Eliminar', 
      icon: <DeleteIcon />, 
      onClick: (user) => {
        setSelectedUser(user);
        setOpenDeleteConfirm(true);
      }
    },
    { 
      label: 'Restablecer Contraseña', 
      icon: <LockResetIcon />, 
      onClick: (user) => {
        handleOpenChangePasswordModal(user);
      }
    },
    { 
      label: (user) => user.activo ? 'Desactivar' : 'Activar', 
      icon: (user) => user.activo ? <BlockIcon /> : <CheckCircleIcon />, 
      onClick: (user) => {
        setSelectedUser(user);
        setOpenStatusConfirm(true);
      }
    }
  ];

  if (loading && users.length === 0) {
    return <LoadingIndicator size="large" message="Cargando usuarios..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Administración de Usuarios
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateModal(true)}
        >
          Nuevo Usuario
        </Button>
      </Box>
      
      {/* Alertas */}
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
      
      {/* Tabla de usuarios */}
      {users.length > 0 ? (
        <Paper sx={{ width: '100%', mb: 2 }}>
          <DataTable
            columns={columns}
            rows={users}
            title="Usuarios"
            actions={actions}
            initialOrderBy="nombre"
          />
        </Paper>
      ) : !loading ? (
        <EmptyState
          type="empty"
          title="No hay usuarios registrados"
          message="Comienza creando un nuevo usuario"
          actionText="Crear Usuario"
          onAction={() => setOpenCreateModal(true)}
        />
      ) : null}
      
      {/* Modal para crear usuario */}
      <Modal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Nuevo Usuario"
        maxWidth="md"
      >
        <FormBuilder
          fields={createUserFields}
          initialValues={{
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
            cargo: '',
            role: rolesList.length > 0 ? rolesList[0].value : '',
            password: '',
            confirmPassword: ''
          }}
          onSubmit={handleCreateUser}
          submitText="Crear Usuario"
          cancelText="Cancelar"
          onCancel={() => setOpenCreateModal(false)}
          paperProps={{ elevation: 0, sx: { p: 0 } }}
        />
      </Modal>
      
      {/* Modal para editar usuario */}
      <Modal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        title="Editar Usuario"
        maxWidth="md"
      >
        {selectedUser && (
          <FormBuilder
            fields={userFields}
            initialValues={{
              nombre: selectedUser.nombre || '',
              apellido: selectedUser.apellido || '',
              email: selectedUser.email || '',
              telefono: selectedUser.telefono || '',
              cargo: selectedUser.cargo || '',
              role: selectedUser.role || (rolesList.length > 0 ? rolesList[0].value : '')
            }}
            onSubmit={handleEditUser}
            submitText="Actualizar Usuario"
            cancelText="Cancelar"
            onCancel={() => setOpenEditModal(false)}
            paperProps={{ elevation: 0, sx: { p: 0 } }}
          />
        )}
      </Modal>
      
      {/* Diálogo de confirmación para eliminar */}
      <Confirm
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteUser}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar al usuario ${selectedUser?.nombre} ${selectedUser?.apellido}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="error"
      />
      
      {/* Diálogo de confirmación para cambiar estado */}
      <Confirm
        open={openStatusConfirm}
        onClose={() => setOpenStatusConfirm(false)}
        onConfirm={handleToggleStatus}
        title={selectedUser?.activo ? "Desactivar Usuario" : "Activar Usuario"}
        message={`¿Estás seguro de ${selectedUser?.activo ? 'desactivar' : 'activar'} al usuario ${selectedUser?.nombre} ${selectedUser?.apellido}?`}
        confirmText={selectedUser?.activo ? "Desactivar" : "Activar"}
        cancelText="Cancelar"
        type={selectedUser?.activo ? "warning" : "info"}
      />
      
      {/* Modal para cambiar contraseña (admin) */}
      <Modal
        open={openChangePasswordModal}
        onClose={() => setOpenChangePasswordModal(false)}
        title={`Cambiar contraseña de ${selectedUser?.nombre || ''} ${selectedUser?.apellido || ''}`}
        maxWidth="xs"
      >
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ position: 'relative' }}>
            <label htmlFor="newPassword">Nueva Contraseña</label>
            <input
              id="newPassword"
              name="newPassword"
              type={showPassword.new ? 'text' : 'password'}
              value={passwordValues.newPassword}
              onChange={handleChangePasswordInput}
              style={{ width: '100%', paddingRight: 36, marginTop: 4, height: 40, fontSize: 16 }}
              autoComplete="new-password"
            />
            <IconButton
              aria-label="toggle password visibility"
              onClick={() => handleToggleShowPassword('new')}
              edge="end"
              size="small"
              sx={{ position: 'absolute', right: 0, top: 24 }}
            >
              {showPassword.new ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Box>
          <Box sx={{ position: 'relative' }}>
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword.confirm ? 'text' : 'password'}
              value={passwordValues.confirmPassword}
              onChange={handleChangePasswordInput}
              style={{ width: '100%', paddingRight: 36, marginTop: 4, height: 40, fontSize: 16 }}
              autoComplete="new-password"
            />
            <IconButton
              aria-label="toggle password visibility"
              onClick={() => handleToggleShowPassword('confirm')}
              edge="end"
              size="small"
              sx={{ position: 'absolute', right: 0, top: 24 }}
            >
              {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleChangePassword}
            disabled={!passwordValues.newPassword || !passwordValues.confirmPassword}
          >
            Cambiar Contraseña
          </Button>
          <Button
            variant="text"
            color="secondary"
            onClick={() => setOpenChangePasswordModal(false)}
          >
            Cancelar
          </Button>
        </Box>
      </Modal>
    </Container>
  );
};

export default UserManagement; 