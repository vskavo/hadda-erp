import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  TextField, 
  Button, 
  FormControlLabel, 
  Checkbox,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingIndicator, AlertMessage } from '../../../components/common';
import axios from 'axios';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ContactoForm = () => {
  const { clienteId, id } = useParams(); // id es opcional, solo para edición
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cargo: '',
    departamento: '',
    email: '',
    telefono_directo: '',
    telefono_movil: '',
    es_principal: false,
    es_decision_maker: false,
    notas: ''
  });

  // Cargar datos del cliente y del contacto (si es edición)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar datos del cliente
        const clienteResponse = await axios.get(`/api/clientes/${clienteId}`);
        setCliente(clienteResponse.data);
        
        // Si es edición, cargar datos del contacto
        if (id) {
          const contactoResponse = await axios.get(`/api/contactos/${id}`);
          const contacto = contactoResponse.data;
          
          setFormData({
            nombre: contacto.nombre || '',
            apellido: contacto.apellido || '',
            cargo: contacto.cargo || '',
            departamento: contacto.departamento || '',
            email: contacto.email || '',
            telefono_directo: contacto.telefono_directo || '',
            telefono_movil: contacto.telefono_movil || '',
            es_principal: contacto.es_principal || false,
            es_decision_maker: contacto.es_decision_maker || false,
            notas: contacto.notas || ''
          });
        }
        
        setError('');
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(`Error al cargar datos: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [clienteId, id]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = {
        ...formData,
        cliente_id: parseInt(clienteId)
      };
      
      let response;
      
      if (id) {
        // Actualizar contacto existente
        response = await axios.put(`/api/contactos/${id}`, data);
        setSuccess('Contacto actualizado exitosamente');
      } else {
        // Crear nuevo contacto
        response = await axios.post('/api/contactos', data);
        setSuccess('Contacto creado exitosamente');
      }
      
      // Redireccionar después de 1.5 segundos
      setTimeout(() => {
        navigate(`/clientes/${clienteId}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error al guardar contacto:', err);
      setError(`Error al guardar contacto: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingIndicator size="large" message="Cargando datos..." />;
  }
  
  if (!cliente) {
    return (
      <Container>
        <AlertMessage 
          type="error" 
          message="Cliente no encontrado" 
          show={true} 
        />
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/clientes')}
          sx={{ mt: 2 }}
        >
          Volver a la lista de clientes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {id ? 'Editar Contacto' : 'Nuevo Contacto'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Cliente: {cliente.razon_social || cliente.nombre}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
              />
            </Grid>
            
            {/* Información laboral */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Departamento"
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
              />
            </Grid>
            
            {/* Información de contacto */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono Directo"
                name="telefono_directo"
                value={formData.telefono_directo}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono Móvil"
                name="telefono_movil"
                value={formData.telefono_movil}
                onChange={handleChange}
              />
            </Grid>
            
            {/* Opciones adicionales */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.es_principal}
                    onChange={handleChange}
                    name="es_principal"
                  />
                }
                label="Contacto Principal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.es_decision_maker}
                    onChange={handleChange}
                    name="es_decision_maker"
                  />
                }
                label="Decisor"
              />
            </Grid>
            
            {/* Notas */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas"
                name="notas"
                multiline
                rows={4}
                value={formData.notas}
                onChange={handleChange}
                placeholder="Información adicional sobre el contacto..."
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/clientes/${clienteId}`)}
            >
              Volver
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Contacto'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ContactoForm; 