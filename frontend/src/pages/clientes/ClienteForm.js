import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Grid,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as Yup from 'yup';

import { 
  FormBuilder, 
  AlertMessage, 
  LoadingIndicator 
} from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import usuarioService from '../../services/usuarioService';

const ClienteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tipoCliente, setTipoCliente] = useState('empresa');
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  
  const isEditing = !!id;
  
  // Cargar datos del cliente si estamos editando
  useEffect(() => {
    if (isEditing) {
      fetchCliente();
    }
  }, [id]);

  // Cargar usuarios solo si es admin
  useEffect(() => {
    if (isAdmin) {
      setUsuariosLoading(true);
      usuarioService.getUsuarios({ limit: 1000 })
        .then(data => {
          setUsuarios(data.usuarios || data);
        })
        .catch(() => setUsuarios([]))
        .finally(() => setUsuariosLoading(false));
    }
  }, [isAdmin]);

  const fetchCliente = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/clientes/${id}`);
      setCliente(response.data);
      
      // Determinar tipo de cliente basado en si tiene razon_social o nombre
      if (response.data.razon_social) {
        setTipoCliente('empresa');
      } else if (response.data.nombre) {
        setTipoCliente('persona');
      }
      
      setError('');
    } catch (err) {
      setError('Error al cargar datos del cliente. ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de tipo de cliente
  const handleTipoClienteChange = (event) => {
    setTipoCliente(event.target.value);
  };

  // Manejar creación o actualización del cliente
  const handleSubmit = async (values) => {
    setSubmitting(true);
    setError('');
    
    try {
      // Transformar camelCase a snake_case para el backend
      const clienteData = {
        // Información básica
        razon_social: values.razonSocial,
        rut: values.rut,
        giro: values.giro,
        holding: values.holding !== undefined ? values.holding : null,
        estado: values.estado,
        
        // Información de contacto
        email: values.email,
        telefono: values.telefono,
        sitio_web: values.sitioWeb,
        
        // Dirección
        direccion: values.direccion,
        comuna: values.comuna,
        ciudad: values.ciudad,
        
        // Contacto principal
        contacto_nombre: values.contactoNombre,
        contacto_cargo: values.contactoCargo,
        contacto_email: values.contactoEmail,
        contacto_telefono: values.contactoTelefono,
        
        // Información adicional
        notas: values.notas,
        fecha_ultimo_contacto: values.fechaUltimoContacto instanceof Date ? values.fechaUltimoContacto.toISOString() : null,
        
        // Para personas
        ...(tipoCliente === 'persona' && {
          nombre: values.nombre,
          apellido: values.apellido,
          profesion: values.profesion,
          fecha_nacimiento: values.fechaNacimiento instanceof Date ? values.fechaNacimiento.toISOString() : null
        })
      };
      
      // Enviar owner solo si es admin
      if (isAdmin) {
        clienteData.owner = values.owner;
      } else if (!isEditing) {
        // Si no es admin y está creando, asignar el owner como el usuario autenticado
        clienteData.owner = user.id;
      }
      
      if (isEditing) {
        await axios.put(`/api/clientes/${id}`, clienteData);
        navigate(`/clientes/${id}`);
      } else {
        const response = await axios.post('/api/clientes', clienteData);
        console.log('Respuesta al crear cliente:', response.data);
        
        // Extraer el ID del cliente, considerando diferentes estructuras de respuesta
        const clienteId = response.data.cliente?.id || response.data.id;
        
        if (!clienteId) {
          console.error('No se pudo obtener el ID del cliente en la respuesta:', response.data);
          setError('Error al procesar la respuesta del servidor. ID del cliente no disponible.');
          setSubmitting(false);
          return;
        }
        
        console.log('Navegando a detalles del cliente con ID:', clienteId);
        navigate(`/clientes/${clienteId}`);
      }
    } catch (err) {
      console.error('Error al procesar la solicitud:', err);
      setError(`Error al ${isEditing ? 'actualizar' : 'crear'} cliente. ${err.response?.data?.message || ''}`);
      setSubmitting(false);
    }
  };

  // Campos comunes para ambos tipos de cliente
  const commonFields = [
    {
      name: 'rut',
      label: 'RUT',
      type: 'text',
      required: true,
      validation: Yup.string()
        .required('El RUT es requerido')
        .matches(/^\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]{1}$/, 'Formato de RUT inválido (ej: 12.345.678-9)'),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      validation: Yup.string().email('Email inválido'),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'tel',
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'sitioWeb',
      label: 'Sitio Web',
      type: 'url',
      validation: Yup.string().url('URL inválida'),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
        { value: 'prospecto', label: 'Prospecto' }
      ],
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    }
  ];

  // Campos para dirección
  const addressFields = [
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'text',
      validation: Yup.string(),
      gridProps: { xs: 12 }
    },
    {
      name: 'comuna',
      label: 'Comuna',
      type: 'text',
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'ciudad',
      label: 'Región',
      type: 'text',
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    }
  ];

  // Campos adicionales
  const additionalFields = [
    {
      name: 'notas',
      label: 'Notas',
      type: 'textarea',
      multiline: true,
      rows: 4,
      validation: Yup.string(),
      gridProps: { xs: 12 }
    },
    {
      name: 'fechaUltimoContacto',
      label: 'Fecha Último Contacto',
      type: 'date',
      validation: Yup.date().nullable(),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'contactoNombre',
      label: 'Nombre del Contacto Principal',
      type: 'text',
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'contactoCargo',
      label: 'Cargo del Contacto Principal',
      type: 'text',
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'contactoEmail',
      label: 'Email del Contacto Principal',
      type: 'email',
      validation: Yup.string().email('Email inválido'),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'contactoTelefono',
      label: 'Teléfono del Contacto Principal',
      type: 'tel',
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    }
  ];

  // Campos específicos para empresas
  const empresaFields = [
    {
      name: 'razonSocial',
      label: 'Razón Social',
      type: 'text',
      required: true,
      validation: Yup.string().required('La razón social es requerida'),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'giro',
      label: 'Giro',
      type: 'text',
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'holding',
      label: 'Holding',
      type: 'text',
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    }
  ];

  // Campos específicos para personas
  const personaFields = [
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
      name: 'profesion',
      label: 'Profesión',
      type: 'text',
      validation: Yup.string(),
      gridProps: { xs: 12, sm: 6 }
    },
    {
      name: 'fechaNacimiento',
      label: 'Fecha de Nacimiento',
      type: 'date',
      validation: Yup.date().nullable(),
      gridProps: { xs: 12, sm: 6 }
    }
  ];

  // Generamos los campos adecuados según el tipo de cliente
  const generateFields = () => {
    const typeFields = tipoCliente === 'empresa' ? empresaFields : personaFields;
    let fields = [
      ...typeFields,
      ...commonFields,
      ...addressFields,
      ...additionalFields
    ];
    // Si es admin, agregar campo owner
    if (isAdmin) {
      fields.push({
        name: 'owner',
        label: 'Propietario',
        type: 'select',
        required: true,
        options: usuarios.map(u => ({ value: u.id, label: `${u.nombre} ${u.apellido} (${u.email})` })),
        validation: Yup.number().required('El propietario es requerido'),
        gridProps: { xs: 12, sm: 6 },
        disabled: usuariosLoading
      });
    }
    return fields;
  };

  // Generamos valores iniciales
  const generateInitialValues = () => {
    const base = cliente ? {
      // Valores comunes
      rut: cliente.rut || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      sitioWeb: cliente.sitio_web || '',
      direccion: cliente.direccion || '',
      comuna: cliente.comuna || '',
      ciudad: cliente.ciudad || '',
      notas: cliente.notas || '',
      estado: cliente.estado || 'activo',
      fechaUltimoContacto: cliente.fecha_ultimo_contacto ? new Date(cliente.fecha_ultimo_contacto) : null,
      // Datos de contacto principal
      contactoNombre: cliente.contacto_nombre || '',
      contactoCargo: cliente.contacto_cargo || '',
      contactoEmail: cliente.contacto_email || '',
      contactoTelefono: cliente.contacto_telefono || '',
      // Valores específicos de empresa
      razonSocial: cliente.razon_social || '',
      giro: cliente.giro || '',
      holding: cliente.holding === null ? '' : cliente.holding,
      // Valores específicos de persona
      nombre: cliente.nombre || '',
      apellido: cliente.apellido || '',
      profesion: cliente.profesion || '',
      fechaNacimiento: cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento) : null
    } : {
      // Valores comunes
      rut: '',
      email: '',
      telefono: '',
      sitioWeb: '',
      direccion: '',
      comuna: '',
      ciudad: '',
      notas: '',
      estado: 'activo',
      fechaUltimoContacto: null,
      // Datos de contacto principal
      contactoNombre: '',
      contactoCargo: '',
      contactoEmail: '',
      contactoTelefono: '',
      // Valores específicos de empresa
      razonSocial: '',
      giro: '',
      holding: '',
      // Valores específicos de persona
      nombre: '',
      apellido: '',
      profesion: '',
      fechaNacimiento: null
    };
    // Si es admin, incluir owner
    if (isAdmin) {
      base.owner = cliente?.owner || '';
    }
    return base;
  };

  if (loading) {
    return <LoadingIndicator size="large" message="Cargando datos del cliente..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {isEditing 
              ? 'Actualiza los datos del cliente' 
              : 'Completa el formulario para registrar un nuevo cliente'}
          </Typography>
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
        
        {/* Selector de tipo de cliente (solo al crear) */}
        {!isEditing && (
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Tipo de Cliente</FormLabel>
              <RadioGroup
                row
                name="tipo-cliente"
                value={tipoCliente}
                onChange={handleTipoClienteChange}
              >
                <FormControlLabel 
                  value="empresa" 
                  control={<Radio />} 
                  label="Empresa" 
                />
                <FormControlLabel 
                  value="persona" 
                  control={<Radio />} 
                  label="Persona" 
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}
        
        {/* Formulario dinámico */}
        <FormBuilder
          fields={generateFields()}
          initialValues={{
            ...generateInitialValues(),
            tipoCliente: tipoCliente // Aseguramos que este campo se envíe siempre
          }}
          onSubmit={handleSubmit}
          submitText={isEditing ? 'Actualizar Cliente' : 'Crear Cliente'}
          cancelText="Cancelar"
          onCancel={() => isEditing ? navigate(`/clientes/${id}`) : navigate('/clientes')}
          loading={submitting}
        />
      </Paper>
    </Container>
  );
};

export default ClienteForm; 