import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import NoteIcon from '@mui/icons-material/Note';
import { LoadingIndicator, AlertMessage, Confirm } from '../../components/common';
import axios from 'axios';

const VentaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchVenta();
  }, [id]);

  const fetchVenta = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/ventas/${id}`);
      setVenta(response.data);
    } catch (err) {
      console.error('Error al cargar la venta:', err);
      setError('Error al cargar la venta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setOpenDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/ventas/${id}`);
      setSuccess('Venta eliminada correctamente');
      setTimeout(() => {
        navigate('/ventas');
      }, 2000);
    } catch (err) {
      console.error('Error al eliminar la venta:', err);
      setError('Error al eliminar la venta: ' + (err.response?.data?.message || err.message));
      setOpenDeleteConfirm(false);
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      await axios.put(`/api/ventas/${id}/estado`, { estado: newStatus });
      setSuccess(`Estado actualizado a "${getEstadoLabel(newStatus)}"`);
      fetchVenta();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al cambiar el estado:', err);
      setError('Error al cambiar el estado: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'en_proceso': return 'info';
      case 'completada': return 'success';
      case 'facturada': return 'primary';
      case 'anulada': return 'error';
      default: return 'default';
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En Proceso';
      case 'completada': return 'Completada';
      case 'facturada': return 'Facturada';
      case 'anulada': return 'Anulada';
      default: return estado;
    }
  };

  if (loading) {
    return <LoadingIndicator message="Cargando información de la venta..." />;
  }

  if (!venta && !loading) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" color="error">
            Venta no encontrada
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/ventas')}
            sx={{ mt: 2 }}
          >
            Volver a ventas
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {error && <AlertMessage type="error" message={error} />}
      {success && <AlertMessage type="success" message={success} />}
      
      <Paper elevation={3} sx={{ p: 3, mt: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" component="h1" sx={{ mr: 2 }}>
              {venta.titulo}
            </Typography>
            <Chip
              label={getEstadoLabel(venta.estado)}
              color={getEstadoColor(venta.estado)}
            />
          </Box>
          
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/ventas')}
              sx={{ mr: 2 }}
            >
              Volver
            </Button>
            <Button
              startIcon={<EditIcon />}
              color="primary"
              onClick={() => navigate(`/ventas/editar/${id}`)}
              sx={{ mr: 2 }}
            >
              Editar
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              onClick={handleDelete}
              disabled={venta.estado === 'facturada'}
            >
              Eliminar
            </Button>
          </Box>
        </Box>
        
        <Divider />
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Información del cliente */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 1 }} /> Información del Cliente
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Cliente" 
                    secondary={venta.cliente ? venta.cliente.razon_social : 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="RUT" 
                    secondary={venta.cliente ? venta.cliente.rut : 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Email" 
                    secondary={venta.cliente ? venta.cliente.email : 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Teléfono" 
                    secondary={venta.cliente ? venta.cliente.telefono : 'N/A'} 
                  />
                </ListItem>
                {venta.contacto_nombre && (
                  <ListItem>
                    <ListItemText 
                      primary="Contacto" 
                      secondary={`${venta.contacto_nombre} (${venta.contacto_email || 'Sin email'})`} 
                    />
                  </ListItem>
                )}
              </List>
              {venta.cliente && (
                <Button 
                  size="small" 
                  onClick={() => navigate(`/clientes/${venta.cliente.id}`)}
                  sx={{ mt: 1 }}
                >
                  Ver ficha del cliente
                </Button>
              )}
            </Paper>
          </Grid>
          
          {/* Información financiera */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon sx={{ mr: 1 }} /> Información Financiera
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Monto Neto" 
                    secondary={formatCurrency(venta.monto_neto)} 
                  />
                </ListItem>
                {venta.descuento_porcentaje > 0 && (
                  <>
                    <ListItem>
                      <ListItemText 
                        primary="Descuento" 
                        secondary={`${venta.descuento_porcentaje}% (${formatCurrency(venta.descuento_monto)})`} 
                      />
                    </ListItem>
                  </>
                )}
                <ListItem>
                  <ListItemText 
                    primary="IVA" 
                    secondary={`${formatCurrency(venta.iva)} ${venta.incluye_iva ? '(Incluido)' : ''}`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Monto Total" 
                    secondary={formatCurrency(venta.monto_total)} 
                    primaryTypographyProps={{ variant: 'subtitle1', color: 'primary' }}
                    secondaryTypographyProps={{ variant: 'h6', color: 'primary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Forma de Pago" 
                    secondary={venta.forma_pago ? venta.forma_pago.replace('_', ' ').charAt(0).toUpperCase() + venta.forma_pago.slice(1) : 'N/A'} 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          {/* Detalles de la venta */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <DescriptionIcon sx={{ mr: 1 }} /> Detalles de la Venta
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Número de Venta" 
                        secondary={venta.numero_venta || `Venta #${venta.id}`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Fecha de Venta" 
                        secondary={formatDate(venta.fecha_venta)} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Vendedor" 
                        secondary={venta.usuario ? `${venta.usuario.nombre} ${venta.usuario.apellido}` : 'No asignado'} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <List dense>
                    {venta.proyecto && (
                      <ListItem>
                        <ListItemText 
                          primary="Proyecto" 
                          secondary={venta.proyecto.nombre} 
                        />
                      </ListItem>
                    )}
                    {venta.cotizacion && (
                      <ListItem>
                        <ListItemText 
                          primary="Cotización" 
                          secondary={venta.cotizacion.numero_cotizacion} 
                        />
                      </ListItem>
                    )}
                    {venta.factura && (
                      <ListItem>
                        <ListItemText 
                          primary="Factura" 
                          secondary={venta.factura.numero_factura} 
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Descripción y Observaciones */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <NoteIcon sx={{ mr: 1 }} /> Descripción y Observaciones
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Descripción:
              </Typography>
              <Typography variant="body1" paragraph>
                {venta.descripcion || 'Sin descripción.'}
              </Typography>
              
              {venta.observaciones && (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Observaciones:
                  </Typography>
                  <Typography variant="body1">
                    {venta.observaciones}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>
          
          {/* Cambio de estado */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                Cambiar Estado
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  variant={venta.estado === 'pendiente' ? 'contained' : 'outlined'}
                  color="warning"
                  onClick={() => handleChangeStatus('pendiente')}
                  disabled={venta.estado === 'pendiente' || venta.estado === 'facturada' || venta.estado === 'anulada'}
                >
                  Pendiente
                </Button>
                <Button 
                  variant={venta.estado === 'en_proceso' ? 'contained' : 'outlined'}
                  color="info"
                  onClick={() => handleChangeStatus('en_proceso')}
                  disabled={venta.estado === 'en_proceso' || venta.estado === 'facturada' || venta.estado === 'anulada'}
                >
                  En Proceso
                </Button>
                <Button 
                  variant={venta.estado === 'completada' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => handleChangeStatus('completada')}
                  disabled={venta.estado === 'completada' || venta.estado === 'facturada' || venta.estado === 'anulada'}
                >
                  Completada
                </Button>
                <Button 
                  variant={venta.estado === 'facturada' ? 'contained' : 'outlined'}
                  color="primary"
                  onClick={() => handleChangeStatus('facturada')}
                  disabled={venta.estado === 'facturada' || venta.estado === 'anulada'}
                >
                  Facturada
                </Button>
                <Button 
                  variant={venta.estado === 'anulada' ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => handleChangeStatus('anulada')}
                  disabled={venta.estado === 'anulada'}
                >
                  Anulada
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      
      <Confirm
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar Venta"
        message={`¿Estás seguro de eliminar la venta "${venta.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="error"
      />
    </Container>
  );
};

export default VentaDetail; 