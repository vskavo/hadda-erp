import React, { useState } from 'react';
import { 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import FormBuilder from '../../../components/common/FormBuilder';
import * as Yup from 'yup';
import clienteService from '../../../services/clienteService';

const commonFields = [
  {
    name: 'rut',
    label: 'RUT',
    type: 'text',
    required: true,
    validation: Yup.string()
      .required('El RUT es requerido')
      .matches(/^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$/, 'Formato de RUT inválido (ej: 12.345.678-9)'),
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

const initialEmpresa = {
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
  contactoNombre: '',
  contactoCargo: '',
  contactoEmail: '',
  contactoTelefono: '',
  razonSocial: '',
  giro: '',
  holding: ''
};
const initialPersona = {
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
  contactoNombre: '',
  contactoCargo: '',
  contactoEmail: '',
  contactoTelefono: '',
  nombre: '',
  apellido: '',
  profesion: '',
  fechaNacimiento: null
};

const ClienteSelector = ({ 
  formData,
  clientes,
  holdings,
  holdingFilter,
  empresaFilter,
  rutFilter,
  filteredClientes,
  handleHoldingChange,
  handleEmpresaChange,
  handleRutChange,
  saving,
  setClientes,
  setFormData
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [tipoCliente, setTipoCliente] = useState('empresa');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenModal = () => {
    setTipoCliente('empresa');
    setOpenModal(true);
    setError('');
    setSuccess('');
  };
  const handleCloseModal = () => {
    setOpenModal(false);
    setError('');
    setSuccess('');
  };

  const handleTipoClienteChange = (event) => {
    setTipoCliente(event.target.value);
  };

  const handleCrearCliente = async (values) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Transformar camelCase a snake_case para el backend
      const clienteData = {
        razon_social: values.razonSocial,
        rut: values.rut,
        giro: values.giro,
        holding: values.holding !== undefined ? values.holding : null,
        estado: values.estado,
        email: values.email ? values.email : null,
        telefono: values.telefono,
        sitio_web: values.sitioWeb,
        direccion: values.direccion,
        comuna: values.comuna,
        ciudad: values.ciudad,
        contacto_nombre: values.contactoNombre,
        contacto_cargo: values.contactoCargo,
        contacto_email: values.contactoEmail ? values.contactoEmail : null,
        contacto_telefono: values.contactoTelefono,
        notas: values.notas,
        fecha_ultimo_contacto: values.fechaUltimoContacto instanceof Date ? values.fechaUltimoContacto.toISOString() : null,
        ...(tipoCliente === 'persona' && {
          nombre: values.nombre,
          apellido: values.apellido,
          profesion: values.profesion,
          fecha_nacimiento: values.fechaNacimiento instanceof Date ? values.fechaNacimiento.toISOString() : null
        })
      };
      const response = await clienteService.createCliente(clienteData);
      const clienteId = response.cliente?.id || response.id;
      if (!clienteId) {
        setError('No se pudo obtener el ID del cliente creado.');
        setLoading(false);
        return;
      }
      setSuccess('Cliente creado exitosamente.');
      // Actualizar lista de clientes y seleccionar el nuevo
      const nuevosClientes = await clienteService.getClientes();
      setClientes(nuevosClientes.clientes || nuevosClientes.data || nuevosClientes);
      setFormData((prev) => ({ ...prev, cliente_id: clienteId }));
      setTimeout(() => {
        setOpenModal(false);
      }, 1000);
    } catch (err) {
      setError('Error al crear cliente: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fields = tipoCliente === 'empresa'
    ? [...empresaFields, ...commonFields, ...addressFields, ...additionalFields]
    : [...personaFields, ...commonFields, ...addressFields, ...additionalFields];
  const initialValues = tipoCliente === 'empresa' ? initialEmpresa : initialPersona;

  return (
    <>
      {/* Fila 1: Holding */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Filtrar por Holding</InputLabel>
          <Select
            value={holdingFilter}
            onChange={handleHoldingChange}
            disabled={saving}
            label="Filtrar por Holding"
          >
            <MenuItem value="">Todos los holdings</MenuItem>
            {holdings.map(holding => (
              <MenuItem key={holding} value={holding}>
                {holding}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {/* Fila 2: Empresa y RUT */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Empresa</InputLabel>
          <Select
            value={empresaFilter}
            onChange={handleEmpresaChange}
            disabled={saving}
            label="Empresa"
          >
            <MenuItem value="">Todas las empresas</MenuItem>
            {filteredClientes
              .filter((cliente, index, self) => 
                // Filtrar solo clientes únicos basados en razón social
                cliente.razon_social && 
                index === self.findIndex(c => c.razon_social === cliente.razon_social)
              )
              .map(cliente => (
                <MenuItem key={cliente.id} value={cliente.razon_social}>
                  {cliente.razon_social}
                </MenuItem>
              ))
            }
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>RUT</InputLabel>
          <Select
            value={rutFilter}
            onChange={handleRutChange}
            disabled={saving}
            label="RUT"
          >
            <MenuItem value="">Todos los RUTs</MenuItem>
            {filteredClientes
              .filter((cliente, index, self) => 
                // Filtrar solo clientes únicos basados en RUT
                cliente.rut && 
                index === self.findIndex(c => c.rut === cliente.rut)
              )
              .map(cliente => (
                <MenuItem key={cliente.id} value={cliente.rut}>
                  {cliente.rut} - {cliente.razon_social}
                </MenuItem>
              ))
            }
          </Select>
        </FormControl>
      </Grid>
      
      {/* Cliente seleccionado */}
      <Grid item xs={12}>
        {/* Campo oculto */}
        <input 
          type="hidden" 
          name="cliente_id" 
          value={formData.cliente_id} 
        />
        {/* Box de información */}
        {formData.cliente_id ? (
          <Box sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f5f5f5' }}>
            <Typography variant="body1" color="primary" fontWeight="500">
              Cliente seleccionado:
            </Typography>
            <Typography variant="body1">
              {clientes.find(c => c.id === formData.cliente_id)?.razon_social || 'Cliente no encontrado'}
            </Typography>
            {clientes.find(c => c.id === formData.cliente_id)?.rut && (
              <Typography variant="body2" color="text.secondary">
                RUT: {clientes.find(c => c.id === formData.cliente_id)?.rut}
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fff8e1' }}>
            <Typography variant="body2" color="warning.main">
              Seleccione un cliente utilizando los filtros anteriores
            </Typography>
          </Box>
        )}
      </Grid>
      <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="primary" onClick={handleOpenModal} disabled={saving}>
          ¿No encuentras el cliente? Crear nuevo cliente
        </Button>
      </Grid>
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>Crear nuevo cliente</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <FormControl component="fieldset">
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Tipo de Cliente</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant={tipoCliente === 'empresa' ? 'contained' : 'outlined'}
                  onClick={() => setTipoCliente('empresa')}
                  disabled={loading}
                >
                  Empresa
                </Button>
                <Button
                  variant={tipoCliente === 'persona' ? 'contained' : 'outlined'}
                  onClick={() => setTipoCliente('persona')}
                  disabled={loading}
                >
                  Persona
                </Button>
              </Box>
            </FormControl>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <FormBuilder
            fields={fields}
            initialValues={initialValues}
            onSubmit={handleCrearCliente}
            submitText={loading ? 'Guardando...' : 'Crear Cliente'}
            cancelText="Cancelar"
            onCancel={handleCloseModal}
            loading={loading}
            showCancelButton={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit" disabled={loading}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClienteSelector; 