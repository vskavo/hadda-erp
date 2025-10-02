import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Modal,
  CircularProgress,
  Fade,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Link
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { DatePicker } from '@mui/x-date-pickers';
import clienteService from '../../services/clienteService';
import facturaService from '../../services/facturaService';
import proyectoService from '../../services/proyectoService';

const FacturaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [items, setItems] = useState([{ descripcion: '', cantidad: 1, precio_unitario: 0, descuento: 0, total: 0 }]);
  const [error, setError] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingProyectos, setLoadingProyectos] = useState(true);

  // Estados para el modal de progreso del SII
  const [modalOpen, setModalOpen] = useState(false);
  const [modalState, setModalState] = useState('loading'); // 'loading', 'success', 'error'
  const [modalMessage, setModalMessage] = useState('');
  const [siiResponse, setSiiResponse] = useState(null);
  const isEditing = Boolean(id);
  
  // Función para manejar cambio del checkbox de IVA
  const handleIvaChange = (event) => {
    const incluirIva = event.target.checked;
    const nuevoIva = incluirIva ? 19 : 0;

    formik.setFieldValue('incluir_iva', incluirIva);
    formik.setFieldValue('iva', nuevoIva);

    // Recalcular totales con el nuevo IVA
    recalcularTotales(items, nuevoIva);
  };

  // Recalcular totales de la factura
  const recalcularTotales = (itemsList, ivaPorcentaje = null) => {
    const ivaActual = ivaPorcentaje !== null ? ivaPorcentaje : formik.values.iva;
    const montoNeto = itemsList.reduce((sum, item) => sum + Number(item.total), 0);
    const montoIva = montoNeto * (ivaActual / 100);
    const montoTotal = montoNeto + montoIva;

    formik.setFieldValue('monto_neto', montoNeto);
    formik.setFieldValue('monto_iva', montoIva);
    formik.setFieldValue('monto_total', montoTotal);
  };

  // Manejar cambios en los items de la factura
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Recalcular el total del item
    if (field === 'cantidad' || field === 'precio_unitario' || field === 'descuento') {
      const cantidad = Number(newItems[index].cantidad);
      const precioUnitario = Number(newItems[index].precio_unitario);
      const descuento = Number(newItems[index].descuento);
      
      const subtotal = cantidad * precioUnitario;
      const totalDescuento = subtotal * (descuento / 100);
      newItems[index].total = subtotal - totalDescuento;
    }
    
    setItems(newItems);
    recalcularTotales(newItems);
  };

  // Agregar un nuevo item
  const handleAddItem = () => {
    setItems([...items, { descripcion: '', cantidad: 1, precio_unitario: 0, descuento: 0, total: 0 }]);
  };

  // Eliminar un item
  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    recalcularTotales(newItems);
  };

  // Valores iniciales del formulario
  const initialValues = {
    fecha_emision: new Date(),
    fecha_vencimiento: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 días de plazo por defecto
    cliente_id: '',
    proyecto_id: '',
    condiciones_pago: 'CREDITO',
    observaciones: '',
    estado: 'borrador',
    ciudad_emision: '',
    ciudad_receptor: '',
    incluir_iva: false, // Checkbox para incluir IVA
    iva: 0, // Porcentaje de IVA (0 o 19)
    monto_neto: 0,
    monto_iva: 0,
    monto_total: 0
  };

  // Esquema de validación con Yup
  const validationSchema = Yup.object({
    fecha_emision: Yup.date().required('La fecha de emisión es requerida'),
    fecha_vencimiento: Yup.date().required('La fecha de vencimiento es requerida'),
    cliente_id: Yup.string().required('El cliente es requerido'),
    ciudad_emision: Yup.string().required('La ciudad de emisión es requerida'),
    ciudad_receptor: Yup.string().required('La ciudad del receptor es requerida')
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadingClientes(true);
      setError('');

      try {
        // Cargar clientes desde la API
        const clientesResponse = await clienteService.getClientes();
        if (clientesResponse && clientesResponse.clientes) {
          setClientes(clientesResponse.clientes);
        }

        // Cargar proyectos desde la API
        const proyectosResponse = await proyectoService.getProyectos();
        if (proyectosResponse && proyectosResponse.proyectos) {
          setProyectos(proyectosResponse.proyectos);
        }

        // Si estamos editando, cargar la factura existente
        if (isEditing) {
          try {
            const facturaData = await facturaService.getFacturaById(id);
            if (facturaData) {
              // Si la factura tiene un cliente asociado, cargarlo
              if (facturaData.cliente_id) {
                const cliente = clientesResponse.clientes.find(c => c.id === facturaData.cliente_id);
                if (cliente) {
                  setClienteSeleccionado(cliente);
                }
              }

              // Si la factura tiene un proyecto asociado, cargarlo
              if (facturaData.proyecto_id) {
                const proyecto = proyectosResponse.proyectos.find(p => p.id === facturaData.proyecto_id);
                if (proyecto) {
                  setProyectoSeleccionado(proyecto);
                }
              }

              formik.setValues({
                fecha_emision: facturaData.fecha_emision ? new Date(facturaData.fecha_emision) : new Date(),
                fecha_vencimiento: facturaData.fecha_vencimiento ? new Date(facturaData.fecha_vencimiento) : new Date(new Date().setDate(new Date().getDate() + 30)),
                cliente_id: facturaData.cliente_id || '',
                proyecto_id: facturaData.proyecto_id || '',
                condiciones_pago: 'CREDITO',
                observaciones: facturaData.observaciones || '',
                estado: facturaData.estado || 'borrador',
                ciudad_emision: facturaData.ciudad_emision || '',
                ciudad_receptor: facturaData.ciudad_receptor || '',
                incluir_iva: (facturaData.iva || 0) > 0, // Checkbox activado si hay IVA
                iva: facturaData.iva || 0,
                monto_neto: facturaData.monto_neto || 0,
                monto_iva: facturaData.monto_iva || 0,
                monto_total: facturaData.monto_total || 0
              });

              // Aquí podríamos cargar los items de la factura si existen en el backend
              // Por ahora mantenemos los items por defecto
            }
          } catch (facturaError) {
            console.error('Error al cargar factura:', facturaError);
            setError('Error al cargar los datos de la factura');
          }
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        setError('Error al cargar los datos iniciales. Verifique su conexión a internet.');
      } finally {
        setLoading(false);
        setLoadingClientes(false);
        setLoadingProyectos(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Configuración de Formik
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      // Solo mostrar modal si no es edición (solo para creación)
      if (!isEditing) {
        setModalOpen(true);
        setModalState('loading');
        setModalMessage('Emitiendo boleta en el Servicio de Impuestos Internos...');
        setSiiResponse(null);
      }

      setLoading(true);
      setError('');

      try {
        // Convertir items del formulario al formato que espera el SII
        const productos = items.map(item => ({
          descripcion: item.descripcion,
          cantidad: parseFloat(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          monto: parseFloat(item.total)
        }));

        const facturaData = {
          cliente_id: values.cliente_id,
          fecha_emision: values.fecha_emision,
          fecha_vencimiento: values.fecha_vencimiento,
          monto_neto: values.monto_neto,
          iva: values.iva,
          monto_total: values.monto_total,
          estado: values.estado,
          metodo_pago: values.condiciones_pago,
          observaciones: values.observaciones,
          proyecto_id: values.proyecto_id || null,
          ciudad_emision: values.ciudad_emision,
          ciudad_receptor: values.ciudad_receptor,
          productos: productos
        };

        if (isEditing) {
          await facturaService.updateFactura(id, facturaData);
          navigate('/finanzas/facturas');
        } else {
          const response = await facturaService.createFactura(facturaData);

          // Actualizar modal con respuesta exitosa
          setModalState('success');
          setModalMessage(response.message);
          setSiiResponse(response.sii_response);
        }
      } catch (error) {
        console.error('Error al guardar la factura:', error);

        if (!isEditing) {
          // Mostrar error en el modal
          setModalState('error');
          setModalMessage(error.response?.data?.message || 'Error al emitir la boleta en el SII');
          setSiiResponse(null);
        } else {
          setError(error.response?.data?.message || 'Error al guardar la factura. Intente nuevamente.');
        }

        setLoading(false);
      }
    }
  });

  // Función para cerrar el modal manualmente
  const handleCloseModal = () => {
    setModalOpen(false);
    if (modalState === 'success') {
      navigate('/finanzas/facturas');
    }
  };

  // Componente del Modal de progreso del SII
  const SiiProgressModal = () => (
    <Dialog
      open={modalOpen}
      onClose={handleCloseModal}
      maxWidth="sm"
      fullWidth
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <DialogTitle sx={{
        textAlign: 'center',
        bgcolor: modalState === 'success' ? 'success.main' :
                 modalState === 'error' ? 'error.main' : 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {modalState === 'loading' && <CircularProgress size={24} sx={{ color: 'white' }} />}
          {modalState === 'success' && '✅'}
          {modalState === 'error' && '❌'}
          <Typography variant="h6">
            {modalState === 'loading' && 'Procesando...'}
            {modalState === 'success' && '¡Éxito!'}
            {modalState === 'error' && 'Error'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {modalMessage}
        </Typography>

        {modalState === 'loading' && (
          <Box sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Esto puede tomar hasta 60 segundos...
            </Typography>
            <CircularProgress size={40} />
          </Box>
        )}

        {modalState === 'success' && siiResponse && (
          <Box sx={{ textAlign: 'left', mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Estado:</strong> {siiResponse.message}
            </Typography>
            {siiResponse.detalles && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Detalles:</strong> {siiResponse.detalles.mensaje_confirmacion}
              </Typography>
            )}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                📋 <strong>Puede revisar su borrador en:</strong>
              </Typography>
              <Link
                href={siiResponse.url_borradores}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ wordBreak: 'break-all' }}
              >
                {siiResponse.url_borradores}
              </Link>
            </Box>
          </Box>
        )}

        {modalState === 'error' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              La factura no fue guardada. Por favor, verifica tu conexión y vuelve a intentar.
            </Typography>
            <Chip
              label="Intentar nuevamente"
              onClick={() => setModalOpen(false)}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        {modalState !== 'loading' && (
          <Button
            onClick={handleCloseModal}
            variant="contained"
            color={modalState === 'success' ? 'success' : 'primary'}
          >
            {modalState === 'success' ? 'Ir a Facturas' : 'Cerrar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/finanzas/facturas')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Editar Factura' : 'Nueva Factura'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Información General
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Fecha de Emisión"
                value={formik.values.fecha_emision}
                onChange={(date) => formik.setFieldValue('fecha_emision', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.fecha_emision && Boolean(formik.errors.fecha_emision),
                    helperText: formik.touched.fecha_emision && formik.errors.fecha_emision,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Fecha de Vencimiento"
                value={formik.values.fecha_vencimiento}
                onChange={(date) => formik.setFieldValue('fecha_vencimiento', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.fecha_vencimiento && Boolean(formik.errors.fecha_vencimiento),
                    helperText: formik.touched.fecha_vencimiento && formik.errors.fecha_vencimiento,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                id="estado"
                name="estado"
                label="Estado"
                value={formik.values.estado}
                onChange={formik.handleChange}
                disabled={!isEditing}
              >
                <MenuItem value="borrador">Borrador</MenuItem>
                <MenuItem value="emitida">Emitida</MenuItem>
                <MenuItem value="pagada">Pagada</MenuItem>
                <MenuItem value="vencida">Vencida</MenuItem>
                <MenuItem value="anulada">Anulada</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="cliente_id"
                options={clientes}
                loading={loadingClientes}
                getOptionLabel={(option) =>
                  option.rut ? `${option.rut} - ${option.razon_social}` : ''
                }
                value={clienteSeleccionado}
                onChange={(event, newValue) => {
                  setClienteSeleccionado(newValue);
                  formik.setFieldValue('cliente_id', newValue ? newValue.id : '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar cliente por RUT"
                    placeholder="Ingrese RUT del cliente"
                error={formik.touched.cliente_id && Boolean(formik.errors.cliente_id)}
                helperText={formik.touched.cliente_id && formik.errors.cliente_id}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingClientes ? <div>...</div> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.rut} - {option.razon_social}
                      </Typography>
                      {option.giro && (
                        <Typography variant="caption" color="text.secondary">
                          Giro: {option.giro}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
                noOptionsText="No se encontraron clientes"
                clearText="Limpiar"
                closeText="Cerrar"
                openText="Abrir"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="proyecto_id"
                options={proyectos}
                loading={loadingProyectos}
                getOptionLabel={(option) =>
                  option.nombre ? `${option.nombre} (${option.proyect_id})` : ''
                }
                value={proyectoSeleccionado}
                onChange={(event, newValue) => {
                  setProyectoSeleccionado(newValue);
                  formik.setFieldValue('proyecto_id', newValue ? newValue.id : '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar proyecto (Opcional)"
                    placeholder="Seleccione un proyecto"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingProyectos ? <div>...</div> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Typography variant="body2">
                      {option.nombre} ({option.proyect_id})
                    </Typography>
                  </li>
                )}
                noOptionsText="No se encontraron proyectos"
                clearText="Limpiar"
                closeText="Cerrar"
                openText="Abrir"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="condiciones_pago"
                name="condiciones_pago"
                label="Condiciones de Pago"
                value="Crédito"
                InputProps={{
                  readOnly: true,
                }}
                helperText="Todas las facturas se emiten a crédito"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="ciudad_emision"
                name="ciudad_emision"
                label="Ciudad de Emisión"
                value={formik.values.ciudad_emision}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.ciudad_emision && Boolean(formik.errors.ciudad_emision)}
                helperText={formik.touched.ciudad_emision && formik.errors.ciudad_emision}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="ciudad_receptor"
                name="ciudad_receptor"
                label="Ciudad del Receptor"
                value={formik.values.ciudad_receptor}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.ciudad_receptor && Boolean(formik.errors.ciudad_receptor)}
                helperText={formik.touched.ciudad_receptor && formik.errors.ciudad_receptor}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formik.values.incluir_iva}
                    onChange={handleIvaChange}
                    name="incluir_iva"
                    color="primary"
                  />
                }
                label="¿Incluir IVA? (19%)"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                Si está marcado, se aplicará IVA del 19%. Si no, la factura será exenta.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="observaciones"
                name="observaciones"
                label="Observaciones"
                multiline
                rows={3}
                value={formik.values.observaciones}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
        </Paper>

        {clienteSeleccionado && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información del Cliente
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  RUT
                </Typography>
                <Typography variant="body1">
                  {clienteSeleccionado.rut}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Razón Social
                </Typography>
                <Typography variant="body1">
                  {clienteSeleccionado.razon_social}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Giro
                </Typography>
                <Typography variant="body1">
                  {clienteSeleccionado.giro || 'No especificado'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Estado
                </Typography>
                <Typography variant="body1">
                  {clienteSeleccionado.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </Typography>
              </Grid>
              {clienteSeleccionado.direccion && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Dirección
                  </Typography>
                  <Typography variant="body1">
                    {clienteSeleccionado.direccion}
                    {clienteSeleccionado.comuna && `, ${clienteSeleccionado.comuna}`}
                    {clienteSeleccionado.ciudad && `, ${clienteSeleccionado.ciudad}`}
                  </Typography>
                </Grid>
              )}
              {clienteSeleccionado.telefono && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Teléfono
                  </Typography>
                  <Typography variant="body1">
                    {clienteSeleccionado.telefono}
                  </Typography>
                </Grid>
              )}
              {clienteSeleccionado.email && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {clienteSeleccionado.email}
                  </Typography>
                </Grid>
              )}
              {clienteSeleccionado.contacto_nombre && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Contacto
                  </Typography>
                  <Typography variant="body1">
                    {clienteSeleccionado.contacto_nombre}
                    {clienteSeleccionado.contacto_cargo && ` - ${clienteSeleccionado.contacto_cargo}`}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Detalle de Items
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={handleAddItem}
            >
              Agregar Item
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="40%">Descripción</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Precio Unitario</TableCell>
                  <TableCell align="right">Descuento (%)</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={item.descripcion}
                        onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                        placeholder="Descripción del item"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        InputProps={{ inputProps: { min: 1 } }}
                        size="small"
                        sx={{ width: '80px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.precio_unitario}
                        onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                        InputProps={{ inputProps: { min: 0 } }}
                        size="small"
                        sx={{ width: '120px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.descuento}
                        onChange={(e) => handleItemChange(index, 'descuento', e.target.value)}
                        InputProps={{ inputProps: { min: 0, max: 100 } }}
                        size="small"
                        sx={{ width: '80px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${item.total.toLocaleString('es-CL')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="error" 
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2} justifyContent="flex-end">
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1">${formik.values.monto_neto.toLocaleString('es-CL')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">
                  {formik.values.iva > 0 ? `IVA (${formik.values.iva}%):` : 'Exento de IVA:'}
                </Typography>
                <Typography variant="body1">${formik.values.monto_iva.toLocaleString('es-CL')}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  ${formik.values.monto_total.toLocaleString('es-CL')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/finanzas/facturas')}
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || modalOpen}
          >
            {isEditing ? 'Actualizar' : (modalOpen ? 'Procesando...' : 'Crear Factura')}
          </Button>
        </Box>
      </form>

      {/* Modal de progreso del SII */}
      <SiiProgressModal />
    </Box>
  );
};

export default FacturaForm; 