import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Box, 
  Typography, 
  Grid, 
  TextField, 
  MenuItem, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  FormHelperText,
  Autocomplete,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import axios from 'axios';
import AlertMessage from '../../../components/common/AlertMessage';
import LoadingIndicator from '../../../components/common/LoadingIndicator';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BusinessIcon from '@mui/icons-material/Business';

const tiposActividad = [
  { value: 'llamada', label: 'Llamada telefónica' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'email', label: 'Email' },
  { value: 'visita', label: 'Visita a cliente' },
  { value: 'propuesta', label: 'Envío de propuesta' },
  { value: 'otro', label: 'Otro' }
];

const estadosActividad = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'reprogramada', label: 'Reprogramada' }
];

const prioridades = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' }
];

const ActividadForm = () => {
  const { clienteId, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    tipo_actividad: 'llamada',
    fecha: new Date(),
    asunto: '',
    descripcion: '',
    resultado: '',
    estado: 'pendiente',
    contacto_id: null,
    prioridad: 'media',
    recordatorio: false,
    fecha_siguiente: null,
    accion_siguiente: '',
    fecha_recordatorio: null
  });
  
  const [contactos, setContactos] = useState([]);
  const [selectedContacto, setSelectedContacto] = useState(null);
  const [cliente, setCliente] = useState(null);
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar datos del cliente
        const clienteResponse = await axios.get(`/api/clientes/${clienteId}`);
        setCliente(clienteResponse.data);
        
        // Cargar contactos del cliente
        const contactosResponse = await axios.get(`/api/clientes/${clienteId}/contactos`);
        setContactos(contactosResponse.data);
        
        // Si está editando, cargar datos de la actividad
        if (isEditing) {
          const actividadResponse = await axios.get(`/api/seguimientos/${id}`);
          const actividad = actividadResponse.data;
          
          // Formatear datos de la actividad
          setFormData({
            tipo_actividad: actividad.tipo_actividad,
            fecha: new Date(actividad.fecha),
            asunto: actividad.asunto,
            descripcion: actividad.descripcion || '',
            resultado: actividad.resultado || '',
            estado: actividad.estado,
            contacto_id: actividad.contacto_id,
            prioridad: actividad.prioridad,
            recordatorio: actividad.recordatorio || false,
            fecha_siguiente: actividad.fecha_siguiente ? new Date(actividad.fecha_siguiente) : null,
            accion_siguiente: actividad.accion_siguiente || '',
            fecha_recordatorio: actividad.fecha_recordatorio ? new Date(actividad.fecha_recordatorio) : null
          });
          
          // Establecer contacto seleccionado
          if (actividad.contacto_id) {
            const contacto = contactosResponse.data.find(c => c.id === actividad.contacto_id);
            setSelectedContacto(contacto || null);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
        setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [clienteId, id, isEditing]);
  
  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  // Manejar cambios en fechas
  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };
  
  // Manejar cambio de contacto
  const handleContactoChange = (event, newValue) => {
    setSelectedContacto(newValue);
    setFormData(prev => ({ ...prev, contacto_id: newValue?.id || null }));
  };
  
  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const dataToSend = {
        ...formData,
        cliente_id: parseInt(clienteId)
      };
      
      console.log('Enviando datos:', dataToSend);
      
      let response;
      
      if (isEditing) {
        response = await axios.put(`/api/seguimientos/${id}`, dataToSend);
        setSuccess('Actividad actualizada con éxito');
      } else {
        response = await axios.post('/api/seguimientos', dataToSend);
        setSuccess('Actividad creada con éxito');
      }
      
      console.log('Respuesta:', response.data);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(`/clientes/${clienteId}`);
      }, 2000);
    } catch (err) {
      console.error('Error al guardar actividad:', err);
      setError('Error al guardar: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <LoadingIndicator message="Cargando datos..." />;
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <AlertMessage
          type="error"
          message={error}
          show={!!error}
          onClose={() => setError('')}
          sx={{ mb: 2 }}
        />
      )}
      
      {success && (
        <AlertMessage
          type="success"
          message={success}
          show={!!success}
          onClose={() => setSuccess('')}
          sx={{ mb: 2 }}
        />
      )}
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h1">
            {isEditing ? 'Editar Actividad' : 'Nueva Actividad'}
          </Typography>
          {cliente && (
            <Typography variant="subtitle1" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <BusinessIcon sx={{ mr: 1, fontSize: 20 }} />
              Cliente: {cliente.razon_social || cliente.nombre}
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="tipo-actividad-label">Tipo de actividad</InputLabel>
                <Select
                  labelId="tipo-actividad-label"
                  id="tipo_actividad"
                  name="tipo_actividad"
                  value={formData.tipo_actividad}
                  onChange={handleChange}
                  label="Tipo de actividad"
                >
                  {tiposActividad.map(tipo => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Fecha y hora"
                value={formData.fecha}
                onChange={(date) => handleDateChange('fecha', date)}
                format="dd/MM/yyyy HH:mm"
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                id="asunto"
                name="asunto"
                label="Asunto"
                fullWidth
                required
                value={formData.asunto}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                id="contacto"
                options={contactos}
                value={selectedContacto}
                onChange={handleContactoChange}
                getOptionLabel={(option) => `${option.nombre} ${option.apellido || ''} (${option.cargo || 'Sin cargo'})`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Contacto relacionado"
                    fullWidth
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                id="descripcion"
                name="descripcion"
                label="Descripción"
                fullWidth
                multiline
                rows={4}
                value={formData.descripcion}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  label="Estado"
                >
                  {estadosActividad.map(estado => (
                    <MenuItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="prioridad-label">Prioridad</InputLabel>
                <Select
                  labelId="prioridad-label"
                  id="prioridad"
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  label="Prioridad"
                >
                  {prioridades.map(prioridad => (
                    <MenuItem key={prioridad.value} value={prioridad.value}>
                      {prioridad.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {formData.estado === 'completada' && (
              <Grid item xs={12}>
                <TextField
                  id="resultado"
                  name="resultado"
                  label="Resultado"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.resultado}
                  onChange={handleChange}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ mr: 1 }} /> Seguimiento posterior
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Fecha de siguiente actividad"
                value={formData.fecha_siguiente}
                onChange={(date) => handleDateChange('fecha_siguiente', date)}
                format="dd/MM/yyyy HH:mm"
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
              <FormHelperText>Opcional</FormHelperText>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="accion_siguiente"
                name="accion_siguiente"
                label="Acción siguiente"
                fullWidth
                value={formData.accion_siguiente}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.recordatorio}
                    onChange={handleChange}
                    name="recordatorio"
                    color="primary"
                  />
                }
                label="Crear recordatorio para la próxima actividad"
              />
            </Grid>
            
            {formData.recordatorio && (
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Fecha de recordatorio"
                  value={formData.fecha_recordatorio}
                  onChange={(date) => handleDateChange('fecha_recordatorio', date)}
                  format="dd/MM/yyyy HH:mm"
                  ampm={false}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Fecha en la que deseas recibir el recordatorio"
                    }
                  }}
                />
              </Grid>
            )}
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate(`/clientes/${clienteId}`)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ActividadForm; 