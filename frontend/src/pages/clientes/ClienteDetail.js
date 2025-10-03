import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Divider, 
  Chip, 
  List, 
  ListItem, 
  ListItemText,
  ListItemIcon,
  Avatar,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotesIcon from '@mui/icons-material/Notes';
import ContactsIcon from '@mui/icons-material/Contacts';
import HistoryIcon from '@mui/icons-material/History';
import PaymentIcon from '@mui/icons-material/Payment';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { 
  LoadingIndicator, 
  AlertMessage, 
  Confirm, 
  EmptyState, 
  DataTable 
} from '../../components/common';

// Componente para TabPanel
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cliente-tabpanel-${index}`}
      aria-labelledby={`cliente-tab-${index}`}
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

const ClienteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openStatusConfirm, setOpenStatusConfirm] = useState(false);
  const [ventasGrouping, setVentasGrouping] = useState('ninguna');
  
  // Estados para los datos relacionados
  const [contactos, setContactos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState({
    contactos: true,
    actividades: true,
    ventas: true
  });

  // Cargar datos del cliente
  useEffect(() => {
    fetchCliente();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Función para cargar datos del cliente
  const fetchCliente = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/clientes/${id}`);
      setCliente(response.data);
      
      // Cargar datos relacionados
      fetchContactos();
      fetchActividades();
      fetchVentas();
      
      setError('');
    } catch (err) {
      setError('Error al cargar datos del cliente. ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Funciones para cargar datos relacionados
  const fetchContactos = async () => {
    setLoadingRelated(prev => ({ ...prev, contactos: true }));
    try {
      const response = await axios.get(`/api/clientes/${id}/contactos`);
      setContactos(response.data);
    } catch (err) {
      console.error('Error al cargar contactos:', err);
    } finally {
      setLoadingRelated(prev => ({ ...prev, contactos: false }));
    }
  };

  const fetchActividades = async () => {
    setLoadingRelated(prev => ({ ...prev, actividades: true }));
    try {
      const response = await axios.get(`/api/seguimientos/cliente/${id}`);
      setActividades(response.data.seguimientos || response.data || []);
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      setError(`Error al cargar actividades: ${err.response?.data?.message || err.message}`);
      setActividades([]);
    } finally {
      setLoadingRelated(prev => ({ ...prev, actividades: false }));
    }
  };

  const fetchVentas = async () => {
    setLoadingRelated(prev => ({ ...prev, ventas: true }));
    try {
      const response = await axios.get(`/api/clientes/${id}/ventas`);
      setVentas(response.data);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
    } finally {
      setLoadingRelated(prev => ({ ...prev, ventas: false }));
    }
  };

  // Manejar cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Manejar eliminación del cliente
  const handleDeleteCliente = async () => {
    try {
      await axios.delete(`/api/clientes/${id}`);
      setSuccessMessage('Cliente eliminado con éxito');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/clientes');
      }, 2000);
    } catch (err) {
      setError('Error al eliminar cliente. ' + (err.response?.data?.message || ''));
      setOpenDeleteConfirm(false);
    }
  };

  // Manejar cambio de estado del cliente
  const handleToggleStatus = async () => {
    try {
      const newStatus = cliente.estado === 'activo' ? 'inactivo' : 'activo';
      await axios.patch(`/api/clientes/${id}/status`, { estado: newStatus });
      setOpenStatusConfirm(false);
      setSuccessMessage(`Cliente ${newStatus === 'activo' ? 'activado' : 'desactivado'} con éxito`);
      
      // Actualizar datos del cliente
      fetchCliente();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al cambiar estado del cliente. ' + (err.response?.data?.message || ''));
    }
  };

  // --- Lógica de Agrupación de Ventas ---
  const groupVentas = (ventas, groupingType) => {
    if (groupingType === 'ninguna' || !ventas) {
      return { 'Todas las ventas': ventas || [] };
    }

    return ventas.reduce((acc, venta) => {
      try {
        // Parsear manualmente la fecha en formato DD-MM-YYYY
        const parts = venta.fecha.split('-');
        if (parts.length !== 3) {
          console.warn(`Formato de fecha inesperado: ${venta.fecha}`);
          throw new Error('Invalid date format');
        }
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10); // El mes aquí es 1-indexado (1=Enero, 12=Diciembre)
        const year = parseInt(parts[2], 10);

        if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
          console.warn(`Componentes de fecha inválidos: D=${day}, M=${month}, Y=${year} de ${venta.fecha}`);
          throw new Error('Invalid date components');
        }

        // Construir el objeto Date. OJO: el mes en el constructor es 0-indexado (0=Enero, 11=Diciembre)
        const fechaVenta = new Date(year, month - 1, day);
        
        // Verificar si la fecha construida es válida (evita problemas con días inválidos para el mes)
        if (isNaN(fechaVenta.getTime()) || fechaVenta.getFullYear() !== year || fechaVenta.getMonth() !== month - 1 || fechaVenta.getDate() !== day) {
            console.warn(`Fecha construida inválida para ${venta.fecha}`);
            throw new Error('Constructed date is invalid');
        }

        const extractedYear = fechaVenta.getFullYear();
        const extractedMonth = fechaVenta.getMonth() + 1; // Meses son 0-indexados para getMonth()

        let key = '';
        if (groupingType === 'mes-año') {
          key = `${extractedYear}-${extractedMonth.toString().padStart(2, '0')}`; // Formato YYYY-MM
        } else if (groupingType === 'año') {
          key = `${extractedYear}`; // Formato YYYY
        } else {
           // Si hay un tipo inválido, no agrupar (o manejar error)
           key = 'Todas las ventas';
        }

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(venta);

      } catch (e) {
          console.error("Error parsing date for venta:", venta, e);
          const key = 'Error al procesar fecha';
           if (!acc[key]) acc[key] = [];
           acc[key].push(venta);
      }
      return acc;
    }, {});
  };

  const groupedVentas = useMemo(() => {
    const groups = groupVentas(ventas, ventasGrouping);
    // Ordenar grupos: por año descendente, luego por mes descendente si aplica
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a.includes('-') && b.includes('-')) { // Formato YYYY-MM
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            if (yearB !== yearA) return yearB - yearA;
            return monthB - monthA;
        } else if (!a.includes('-') && !b.includes('-')) { // Formato YYYY o texto
             // Poner años primero, ordenados descendentemente
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
            if (!isNaN(numA)) return -1; // a es año, b es texto
            if (!isNaN(numB)) return 1;  // b es año, a es texto
            return a.localeCompare(b); // Ordenar texto alfabéticamente (o como sea necesario)
        } else {
            // Mezcla de YYYY y YYYY-MM (o texto), priorizar años completos? Ajustar según necesidad
            return b.localeCompare(a); // Orden simple por ahora
        }
    });
    const sortedGroups = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });
    return sortedGroups;
  }, [ventas, ventasGrouping]);

  // --- Fin Lógica de Agrupación ---

  // Mostrar cargando si está cargando los datos
  if (loading) {
    return <LoadingIndicator size="large" message="Cargando datos del cliente..." />;
  }

  // Mostrar mensaje si hay error
  if (error && !cliente) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <AlertMessage 
          type="error" 
          message={error} 
          show={!!error} 
          onClose={() => setError('')} 
        />
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/clientes')}
          >
            Volver a la lista de clientes
          </Button>
        </Box>
      </Container>
    );
  }

  if (!cliente) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <EmptyState
          type="notFound"
          title="Cliente no encontrado"
          message="El cliente que buscas no existe o ha sido eliminado"
          actionText="Volver a la lista de clientes"
          onAction={() => navigate('/clientes')}
        />
      </Container>
    );
  }

  // Columnas para la tabla de contactos
  const contactosColumns = [
    { 
      id: 'nombre', 
      label: 'Nombre', 
      sortable: true,
      format: (value, row) => `${value} ${row.apellido || ''}`.trim()
    },
    { id: 'cargo', label: 'Cargo', sortable: true },
    { id: 'departamento', label: 'Departamento', sortable: true },
    { id: 'email', label: 'Email', sortable: true },
    { 
      id: 'telefono', 
      label: 'Teléfono', 
      sortable: true,
      format: (value, row) => row.telefono_directo || row.telefono_movil || 'No disponible'
    },
    {
      id: 'es_principal',
      label: 'Principal',
      sortable: true,
      format: (value) => value ? 'Sí' : 'No'
    },
    {
      id: 'es_decision_maker',
      label: 'Decisor',
      sortable: true,
      format: (value) => value ? 'Sí' : 'No'
    },
    {
      id: 'ultima_interaccion',
      label: 'Última Interacción',
      sortable: true,
    }
  ];

  // Columnas para la tabla de actividades
  const actividadesColumns = [
    { 
      id: 'tipo_actividad', 
      label: 'Tipo', 
      sortable: true,
      format: (value) => {
        const tipos = {
          'llamada': 'Llamada telefónica',
          'reunion': 'Reunión',
          'email': 'Email',
          'visita': 'Visita',
          'propuesta': 'Propuesta',
          'otro': 'Otro'
        };
        return tipos[value] || value;
      }
    },
    { 
      id: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      format: (value) => value ? new Date(value).toLocaleString() : 'No disponible'
    },
    { id: 'asunto', label: 'Asunto', sortable: true },
    { 
      id: 'usuario', 
      label: 'Responsable', 
      sortable: true,
      format: (_, row) => row.Usuario ? `${row.Usuario.nombre} ${row.Usuario.apellido || ''}` : 'No asignado'
    },
    { 
      id: 'estado', 
      label: 'Estado', 
      sortable: true,
      format: (value) => {
        const estados = {
          'pendiente': 'Pendiente',
          'completada': 'Completada',
          'cancelada': 'Cancelada',
          'reprogramada': 'Reprogramada'
        };
        return estados[value] || value;
      }
    },
    { 
      id: 'prioridad', 
      label: 'Prioridad', 
      sortable: true,
      format: (value) => {
        const prioridades = {
          'baja': 'Baja',
          'media': 'Media',
          'alta': 'Alta'
        };
        return prioridades[value] || 'Normal';
      }
    }
  ];

  // Columnas para la tabla de ventas
  const ventasColumns = [
    { id: 'numero', label: 'Número', sortable: true },
    { id: 'titulo', label: 'Título', sortable: true },
    { id: 'fecha', label: 'Fecha', sortable: true },
    { id: 'total', label: 'Total', sortable: true },
    { 
      id: 'estado', 
      label: 'Estado', 
      sortable: true,
      format: (value) => {
        const estados = {
          'pendiente': 'Pendiente',
          'en_proceso': 'En proceso',
          'completada': 'Completada',
          'facturada': 'Facturada',
          'anulada': 'Anulada'
        };
        return estados[value] || value;
      }
    },
    { id: 'metodo_pago', label: 'Método de pago', sortable: true }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
      
      {/* Encabezado con información básica del cliente */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Avatar 
                sx={{ 
                  width: 70, 
                  height: 70, 
                  mr: 2,
                  bgcolor: 'primary.main'
                }}
              >
                {cliente.razon_social ? <BusinessIcon fontSize="large" /> : <PersonIcon fontSize="large" />}
              </Avatar>
              <Box>
                <Box>
                  <Typography variant="h5" component="h1" sx={{ 
                    fontWeight: 'bold',
                    mb: 1,
                    maxWidth: { xs: '100%', md: '600px' },
                    wordBreak: 'break-word'
                  }}>
                    {cliente.razon_social || `${cliente.nombre || ''} ${cliente.apellido || ''}`}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    <Chip 
                      label="Empresa" 
                      color="primary" 
                      size="small" 
                      icon={<BusinessIcon />}
                    />
                    <Chip 
                      label={cliente.estado === 'activo' ? 'Activo' : 'Inactivo'} 
                      color={cliente.estado === 'activo' ? 'success' : 'error'} 
                      size="small" 
                      icon={cliente.estado === 'activo' ? <CheckCircleIcon /> : <BlockIcon />}
                    />
                  </Box>
                </Box>
                <Typography variant="subtitle1" color="text.secondary">
                  RUT: {cliente.rut}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: { xs: 'flex-start', md: 'flex-end' }, 
              flexWrap: 'wrap',
              gap: 1,
              mt: { xs: 2, md: 0 }
            }}>
              <Button 
                variant="outlined" 
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/clientes')}
                size="small"
              >
                Volver
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/clientes/editar/${id}`)}
                size="small"
              >
                Editar
              </Button>
              <Button 
                variant="outlined" 
                color={cliente.estado === 'activo' ? 'error' : 'success'}
                startIcon={cliente.estado === 'activo' ? <BlockIcon /> : <CheckCircleIcon />}
                onClick={() => setOpenStatusConfirm(true)}
                size="small"
              >
                {cliente.estado === 'activo' ? 'Desactivar' : 'Activar'}
              </Button>
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setOpenDeleteConfirm(true)}
                size="small"
              >
                Eliminar
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmailIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">{cliente.email || 'No disponible'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">{cliente.telefono || 'No disponible'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOnIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1" noWrap>
                {cliente.direccion ? `${cliente.direccion}, ${cliente.comuna || ''}` : 'No disponible'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Cliente desde: {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString() : new Date(cliente.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Última actualización: {cliente.updated_at ? new Date(cliente.updated_at).toLocaleDateString() : new Date(cliente.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Último contacto: {cliente.fecha_ultimo_contacto ? new Date(cliente.fecha_ultimo_contacto).toLocaleDateString() : 'No registrado'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Pestañas con información detallada */}
      <Paper elevation={2}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
          aria-label="Pestañas de cliente"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Información General" icon={<BusinessIcon />} id="cliente-tab-0" />
          <Tab label="Contactos" icon={<ContactsIcon />} id="cliente-tab-1" />
          <Tab label="Actividades" icon={<HistoryIcon />} id="cliente-tab-2" />
          <Tab label="Ventas" icon={<PaymentIcon />} id="cliente-tab-3" />
        </Tabs>
        
        {/* Pestaña de Información General */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 1 }} /> Información Básica
              </Typography>
              <Paper elevation={1} sx={{ p: 2 }}>
                <List disablePadding>
                  <ListItem>
                    <ListItemText primary="Razón Social" secondary={cliente.razon_social || 'No disponible'} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Nombre Comercial" secondary={cliente.giro || 'No disponible'} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="RUT" secondary={cliente.rut || 'No disponible'} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Email" secondary={cliente.email || 'No disponible'} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Teléfono" secondary={cliente.telefono || 'No disponible'} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Sitio Web" 
                      secondary={cliente.sitio_web ? (
                        <Link href={cliente.sitio_web} target="_blank" rel="noopener noreferrer">
                          {cliente.sitio_web}
                        </Link>
                      ) : 'No disponible'} 
                    />
                  </ListItem>
                  <Grid item xs={12} md={6}>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Giro" 
                        secondary={cliente.giro || 'No especificado'} 
                      />
                    </ListItem>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Holding" 
                        secondary={cliente.holding || 'No especificado'} 
                      />
                    </ListItem>
                  </Grid>
                </List>
              </Paper>
            </Grid>
            
            {/* Dirección */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOnIcon sx={{ mr: 1 }} /> Dirección
              </Typography>
              <Paper elevation={1} sx={{ p: 2 }}>
                <List disablePadding>
                  <ListItem>
                    <ListItemText primary="Dirección" secondary={cliente.direccion || 'No disponible'} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Comuna" secondary={cliente.comuna || 'No disponible'} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Ciudad" secondary={cliente.ciudad || 'No disponible'} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Región" secondary={cliente.region || 'Santiago Metropolitan Region'} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Código Postal" secondary="8320000" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            {/* Información adicional */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <NotesIcon sx={{ mr: 1 }} /> Información Adicional
              </Typography>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="body1">
                  {cliente.notas || 'No hay notas adicionales sobre este cliente.'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Pestaña de Contactos */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">
              Contactos del Cliente
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/clientes/${id}/contactos/nuevo`)}
            >
              Nuevo Contacto
            </Button>
          </Box>
          
          {loadingRelated.contactos ? (
            <LoadingIndicator message="Cargando contactos..." />
          ) : contactos.length > 0 ? (
            <DataTable
              columns={contactosColumns}
              rows={contactos}
              actions={[
                { 
                  label: 'Editar', 
                  icon: <EditIcon />, 
                  onClick: (contacto) => navigate(`/clientes/${id}/contactos/editar/${contacto.id}`) 
                },
                { 
                  label: 'Eliminar', 
                  icon: <DeleteIcon />, 
                  onClick: (contacto) => console.log('Eliminar contacto', contacto) 
                }
              ]}
              searchPlaceholder="Buscar contacto..."
            />
          ) : (
            <EmptyState
              type="empty"
              title="No hay contactos registrados"
              message="Agrega contactos para este cliente"
              actionText="Agregar contacto"
              onAction={() => navigate(`/clientes/${id}/contactos/nuevo`)}
            />
          )}
        </TabPanel>
        
        {/* Pestaña de Actividades */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">
              Actividades del Cliente
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/clientes/${id}/actividades/nueva`)}
            >
              Nueva Actividad
            </Button>
          </Box>
          
          {loadingRelated.actividades ? (
            <LoadingIndicator message="Cargando actividades..." />
          ) : actividades.length > 0 ? (
            <DataTable
              columns={actividadesColumns}
              rows={actividades}
              actions={[
                { 
                  label: 'Ver detalles', 
                  icon: <VisibilityIcon />, 
                  onClick: (actividad) => navigate(`/clientes/${id}/actividades/${actividad.id}`) 
                },
                { 
                  label: 'Editar', 
                  icon: <EditIcon />, 
                  onClick: (actividad) => navigate(`/clientes/${id}/actividades/editar/${actividad.id}`) 
                },
                { 
                  label: 'Eliminar', 
                  icon: <DeleteIcon />, 
                  onClick: (actividad) => {
                    if (window.confirm(`¿Estás seguro de eliminar la actividad "${actividad.asunto}"?`)) {
                      axios.delete(`/api/seguimientos/${actividad.id}`)
                        .then(() => {
                          setSuccessMessage('Actividad eliminada con éxito');
                          fetchActividades();
                          setTimeout(() => setSuccessMessage(''), 3000);
                        })
                        .catch(err => {
                          setError(`Error al eliminar actividad: ${err.response?.data?.message || err.message}`);
                        });
                    }
                  } 
                }
              ]}
              searchPlaceholder="Buscar actividad..."
            />
          ) : (
            <EmptyState
              type="empty"
              title="No hay actividades registradas"
              message="Registra actividades con este cliente para dar seguimiento"
              actionText="Registrar actividad"
              onAction={() => navigate(`/clientes/${id}/actividades/nueva`)}
            />
          )}
        </TabPanel>
        
        {/* Pestaña de Ventas */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6">
              Ventas del Cliente
            </Typography>
            
            {/* Agrupar Filtro y Botón */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {/* Controles de Agrupación */}
              <FormControl sx={{ minWidth: 180 }} size="small">
                <InputLabel id="ventas-grouping-label">Agrupar por</InputLabel>
                <Select
                  labelId="ventas-grouping-label"
                  id="ventas-grouping-select"
                  value={ventasGrouping}
                  label="Agrupar por"
                  onChange={(e) => setVentasGrouping(e.target.value)}
                >
                  <MenuItem value="ninguna">Ninguna</MenuItem>
                  <MenuItem value="mes-año">Mes y Año</MenuItem>
                  <MenuItem value="año">Año</MenuItem>
                </Select>
              </FormControl>
              
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/clientes/${id}/ventas/nueva`)}
              >
                Nueva Venta
              </Button>
            </Box>
          </Box>
          
          {loadingRelated.ventas ? (
            <LoadingIndicator message="Cargando ventas..." />
          ) : Object.keys(groupedVentas).length === 0 || (Object.keys(groupedVentas).length === 1 && groupedVentas[Object.keys(groupedVentas)[0]].length === 0) ? (
             <EmptyState
              type="empty"
              title="No hay ventas registradas"
              message="Registra ventas para este cliente"
              actionText="Registrar venta"
              onAction={() => navigate(`/clientes/${id}/ventas/nueva`)}
            />
          ) : (
            // Renderizar grupos de ventas
            Object.entries(groupedVentas).map(([groupKey, groupVentas]) => (
              <Box key={groupKey} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                  {/* Formatear el título del grupo */}
                  {ventasGrouping === 'mes-año' 
                    ? new Date(`${groupKey}-01`).toLocaleString('es-ES', { month: 'long', year: 'numeric' }) 
                    : groupKey}
                </Typography>
                {groupVentas.length > 0 ? (
                  <DataTable
                    columns={ventasColumns}
                    rows={groupVentas}
                    actions={[
                      { 
                        label: 'Ver detalles', 
                        icon: <VisibilityIcon />, 
                        onClick: (venta) => navigate(`/ventas/${venta.id}`) 
                      },
                      { 
                        label: 'Editar', 
                        icon: <EditIcon />, 
                        onClick: (venta) => navigate(`/ventas/editar/${venta.id}`) 
                      }
                    ]}
                    searchPlaceholder={`Buscar en ${groupKey}...`}
                    // Deshabilitar búsqueda global si mostramos tablas separadas
                    disableGlobalSearch={true} 
                  />
                ) : (
                  <Typography sx={{ ml: 1, fontStyle: 'italic' }}>No hay ventas en este período.</Typography>
                )}
              </Box>
            ))
          )}
        </TabPanel>
      </Paper>
      
      {/* Diálogos de confirmación */}
      <Confirm
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteCliente}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar al cliente "${cliente.razon_social}"? 
          Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="error"
      />
      
      <Confirm
        open={openStatusConfirm}
        onClose={() => setOpenStatusConfirm(false)}
        onConfirm={handleToggleStatus}
        title={cliente.estado === 'activo' ? "Desactivar Cliente" : "Activar Cliente"}
        message={`¿Estás seguro de ${cliente.estado === 'activo' ? 'desactivar' : 'activar'} al cliente "${cliente.razon_social}"?`}
        confirmText={cliente.estado === 'activo' ? "Desactivar" : "Activar"}
        cancelText="Cancelar"
        type={cliente.estado === 'activo' ? "warning" : "info"}
      />
    </Container>
  );
};

export default ClienteDetail; 