import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Divider,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import { LoadingIndicator, AlertMessage } from '../../components/common';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';

const VentaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { clienteId: urlClienteId } = useParams();
  
  // Obtener clienteId del estado de navegación o de los parámetros de URL
  const clienteId = urlClienteId || location.state?.clienteId;
  
  const [formData, setFormData] = useState({
    cliente_id: clienteId || '',
    titulo: '',
    descripcion: '',
    fecha_venta: new Date().toISOString().split('T')[0],
    monto_neto: '',
    incluye_iva: true,
    iva: '',
    monto_total: '',
    estado: 'pendiente',
    forma_pago: 'transferencia',
    descuento_porcentaje: 0,
    descuento_monto: 0,
    proyecto_id: '',
    cotizacion_id: '',
    usuario_id: '',
    observaciones: '',
    factura_id: ''
  });
  
  const [cliente, setCliente] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const isEditing = !!id;
  const title = isEditing ? 'Editar Venta' : 'Registrar Nueva Venta';

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, [id, clienteId]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Cargar catálogos
      await Promise.all([
        fetchClientes(),
        fetchProyectos(),
        fetchUsuarios()
      ]);
      
      // Si es edición, cargar datos de la venta
      if (isEditing) {
        await fetchVenta();
      } else if (clienteId) {
        // Si hay un clienteId, cargar información del cliente
        await fetchCliente(clienteId);
      }
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      setError('Error al cargar datos iniciales');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchVenta = async () => {
    try {
      const response = await axios.get(`/api/ventas/${id}`);
      setFormData({
        ...response.data,
        fecha_venta: response.data.fecha_venta ? new Date(response.data.fecha_venta).toISOString().split('T')[0] : ''
      });
      
      // Si la venta tiene un cliente, cargamos sus cotizaciones
      if (response.data.cliente_id) {
        fetchCotizacionesPorCliente(response.data.cliente_id);
      }
    } catch (err) {
      console.error('Error al cargar datos de la venta:', err);
      setError('Error al cargar datos de la venta');
    }
  };

  const fetchCliente = async (id) => {
    try {
      const response = await axios.get(`/api/clientes/${id}`);
      setCliente(response.data);
      
      // Cargar cotizaciones del cliente
      fetchCotizacionesPorCliente(id);
    } catch (err) {
      console.error('Error al cargar datos del cliente:', err);
      setError('Error al cargar datos del cliente');
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await axios.get('/api/clientes?estado=activo');
      if (Array.isArray(response.data)) {
        setClientes(response.data);
      } else {
        console.error('Los datos de clientes no son un array:', response.data);
        setClientes([]);
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setClientes([]);
    }
  };

  const fetchProyectos = async () => {
    try {
      const response = await axios.get('/api/proyectos?estado=activo');
      if (Array.isArray(response.data)) {
        setProyectos(response.data);
      } else {
        console.error('Los datos de proyectos no son un array:', response.data);
        setProyectos([]);
      }
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
      setProyectos([]);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get('/api/usuarios');
      if (Array.isArray(response.data)) {
        setUsuarios(response.data);
      } else {
        console.error('Los datos de usuarios no son un array:', response.data);
        setUsuarios([]);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setUsuarios([]);
    }
  };

  const fetchCotizacionesPorCliente = async (clienteId) => {
    try {
      const response = await axios.get(`/api/clientes/${clienteId}/cotizaciones?estado=aprobada`);
      if (Array.isArray(response.data)) {
        setCotizaciones(response.data);
      } else {
        console.error('Los datos de cotizaciones no son un array:', response.data);
        setCotizaciones([]);
      }
    } catch (err) {
      console.error('Error al cargar cotizaciones del cliente:', err);
      setCotizaciones([]);
    }
  };

  // Manejador de cambio en los campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    // Actualizar el valor en el estado
    setFormData(prev => {
      const newData = { ...prev, [name]: val };
      
      // Si cambia el cliente, cargar sus cotizaciones
      if (name === 'cliente_id' && val) {
        fetchCotizacionesPorCliente(val);
      }
      
      // Si cambia el monto neto o el IVA, calcular totales
      if (name === 'monto_neto' || name === 'incluye_iva' || name === 'descuento_porcentaje') {
        return calcularMontos(newData);
      }
      
      return newData;
    });
  };

  // Calcular montos basados en monto neto, IVA y descuentos
  const calcularMontos = (data) => {
    const montoNeto = parseFloat(data.monto_neto) || 0;
    const descuentoPorcentaje = parseFloat(data.descuento_porcentaje) || 0;
    
    // Calcular descuento
    const descuentoMonto = (montoNeto * descuentoPorcentaje / 100).toFixed(2);
    const montoNetoConDescuento = montoNeto - descuentoMonto;
    
    // Calcular IVA y total
    const iva = data.incluye_iva ? (montoNetoConDescuento * 0.19).toFixed(2) : 0;
    const montoTotal = (montoNetoConDescuento + parseFloat(iva)).toFixed(2);
    
    return {
      ...data,
      descuento_monto: descuentoMonto,
      iva,
      monto_total: montoTotal
    };
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validar campos obligatorios
      if (!formData.cliente_id || !formData.titulo || !formData.monto_neto) {
        setError('Por favor complete los campos obligatorios: Cliente, Título y Monto Neto');
        setLoading(false);
        return;
      }
      
      const dataToSend = {
        ...formData,
        monto_neto: parseFloat(formData.monto_neto),
        iva: parseFloat(formData.iva || 0),
        monto_total: parseFloat(formData.monto_total || 0),
        descuento_porcentaje: parseFloat(formData.descuento_porcentaje || 0),
        descuento_monto: parseFloat(formData.descuento_monto || 0)
      };
      
      let response;
      if (isEditing) {
        response = await axios.put(`/api/ventas/${id}`, dataToSend);
        setSuccess('Venta actualizada correctamente');
      } else {
        response = await axios.post('/api/ventas', dataToSend);
        setSuccess('Venta registrada correctamente');
      }
      
      // Redireccionar después de 2 segundos
      setTimeout(() => {
        if (clienteId) {
          navigate(`/clientes/${clienteId}`);
        } else {
          navigate(`/ventas/${response.data.id}`);
        }
      }, 2000);
    } catch (err) {
      console.error('Error al guardar la venta:', err);
      setError('Error al guardar la venta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <LoadingIndicator message="Cargando datos..." />;
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3, mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {title}
        </Typography>
        
        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
              <Divider />
            </Grid>
            
            {/* Cliente */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!formData.cliente_id}>
                <InputLabel id="cliente-label">Cliente</InputLabel>
                <Select
                  labelId="cliente-label"
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChange}
                  disabled={!!clienteId || loading}
                >
                  <MenuItem value="">Seleccione un cliente</MenuItem>
                  {clientes.map(cliente => (
                    <MenuItem key={cliente.id} value={cliente.id}>
                      {cliente.razon_social} ({cliente.rut})
                    </MenuItem>
                  ))}
                </Select>
                {!formData.cliente_id && (
                  <FormHelperText>Seleccione un cliente</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Título */}
            <Grid item xs={12} md={6}>
              <TextField
                name="titulo"
                label="Título de la Venta"
                fullWidth
                required
                value={formData.titulo}
                onChange={handleChange}
                disabled={loading}
                error={!formData.titulo}
                helperText={!formData.titulo ? "Ingrese un título" : ""}
              />
            </Grid>
            
            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                name="descripcion"
                label="Descripción"
                fullWidth
                multiline
                rows={3}
                value={formData.descripcion || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            {/* Fecha de Venta */}
            <Grid item xs={12} md={6}>
              <TextField
                name="fecha_venta"
                label="Fecha de Venta"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.fecha_venta}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            {/* Estado */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="en_proceso">En Proceso</MenuItem>
                  <MenuItem value="completada">Completada</MenuItem>
                  <MenuItem value="facturada">Facturada</MenuItem>
                  <MenuItem value="anulada">Anulada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Información financiera */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Información Financiera
              </Typography>
              <Divider />
            </Grid>
            
            {/* Monto Neto */}
            <Grid item xs={12} md={4}>
              <TextField
                name="monto_neto"
                label="Monto Neto"
                type="number"
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={formData.monto_neto}
                onChange={handleChange}
                disabled={loading}
                error={!formData.monto_neto}
                helperText={!formData.monto_neto ? "Ingrese monto neto" : ""}
              />
            </Grid>
            
            {/* Incluye IVA */}
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    name="incluye_iva"
                    checked={formData.incluye_iva}
                    onChange={handleChange}
                    disabled={loading}
                  />
                }
                label="Incluye IVA"
              />
            </Grid>
            
            {/* Descuento */}
            <Grid item xs={12} md={4}>
              <TextField
                name="descuento_porcentaje"
                label="Descuento (%)"
                type="number"
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                value={formData.descuento_porcentaje}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            {/* IVA calculado */}
            <Grid item xs={12} md={4}>
              <TextField
                name="iva"
                label="IVA"
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  readOnly: true,
                }}
                value={formData.iva}
                disabled={true}
              />
            </Grid>
            
            {/* Descuento en monto */}
            <Grid item xs={12} md={4}>
              <TextField
                name="descuento_monto"
                label="Descuento (Monto)"
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  readOnly: true,
                }}
                value={formData.descuento_monto}
                disabled={true}
              />
            </Grid>
            
            {/* Monto Total */}
            <Grid item xs={12} md={4}>
              <TextField
                name="monto_total"
                label="Monto Total"
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  readOnly: true,
                }}
                value={formData.monto_total}
                disabled={true}
              />
            </Grid>
            
            {/* Forma de Pago */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="forma-pago-label">Forma de Pago</InputLabel>
                <Select
                  labelId="forma-pago-label"
                  name="forma_pago"
                  value={formData.forma_pago}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <MenuItem value="contado">Contado</MenuItem>
                  <MenuItem value="credito">Crédito</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Referencias */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Referencias
              </Typography>
              <Divider />
            </Grid>
            
            {/* Proyecto */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="proyecto-label">Proyecto</InputLabel>
                <Select
                  labelId="proyecto-label"
                  name="proyecto_id"
                  value={formData.proyecto_id || ''}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <MenuItem value="">Ninguno</MenuItem>
                  {proyectos.map(proyecto => (
                    <MenuItem key={proyecto.id} value={proyecto.id}>
                      {proyecto.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Cotización */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="cotizacion-label">Cotización</InputLabel>
                <Select
                  labelId="cotizacion-label"
                  name="cotizacion_id"
                  value={formData.cotizacion_id || ''}
                  onChange={handleChange}
                  disabled={loading || !formData.cliente_id}
                >
                  <MenuItem value="">Ninguna</MenuItem>
                  {cotizaciones.map(cotizacion => (
                    <MenuItem key={cotizacion.id} value={cotizacion.id}>
                      {cotizacion.numero_cotizacion} - {cotizacion.titulo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Observaciones */}
            <Grid item xs={12}>
              <TextField
                name="observaciones"
                label="Observaciones"
                fullWidth
                multiline
                rows={3}
                value={formData.observaciones || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            {/* Botones */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => clienteId ? navigate(`/clientes/${clienteId}`) : navigate('/ventas')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default VentaForm; 