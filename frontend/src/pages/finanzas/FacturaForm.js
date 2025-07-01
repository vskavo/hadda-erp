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
  TableRow
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { DatePicker } from '@mui/x-date-pickers';

const FacturaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [items, setItems] = useState([{ descripcion: '', cantidad: 1, precio_unitario: 0, descuento: 0, total: 0 }]);
  const isEditing = Boolean(id);
  
  // Valores iniciales del formulario
  const initialValues = {
    numero_factura: '',
    fecha_emision: new Date(),
    fecha_vencimiento: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 días de plazo por defecto
    cliente_id: '',
    proyecto_id: '',
    condiciones_pago: 'CONTADO',
    observaciones: '',
    estado: 'PENDIENTE',
    iva: 19, // Porcentaje de IVA por defecto
    monto_neto: 0,
    monto_iva: 0,
    monto_total: 0
  };

  // Esquema de validación con Yup
  const validationSchema = Yup.object({
    numero_factura: Yup.string().required('El número de factura es requerido'),
    fecha_emision: Yup.date().required('La fecha de emisión es requerida'),
    fecha_vencimiento: Yup.date().required('La fecha de vencimiento es requerida'),
    cliente_id: Yup.string().required('El cliente es requerido'),
    condiciones_pago: Yup.string().required('Las condiciones de pago son requeridas')
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Aquí cargaríamos los clientes y proyectos desde la API
        // Por ahora usamos datos ficticios
        setClientes([
          { id: 1, razon_social: 'Cliente Empresa A', rut: '76.123.456-7' },
          { id: 2, razon_social: 'Cliente Empresa B', rut: '76.234.567-8' },
          { id: 3, razon_social: 'Cliente Empresa C', rut: '76.345.678-9' },
          { id: 4, razon_social: 'Cliente Empresa D', rut: '76.456.789-0' },
          { id: 5, razon_social: 'Cliente Empresa E', rut: '76.567.890-1' }
        ]);
        
        setProyectos([
          { id: 1, nombre: 'Proyecto 1', codigo: 'P001' },
          { id: 2, nombre: 'Proyecto 2', codigo: 'P002' },
          { id: 3, nombre: 'Proyecto 3', codigo: 'P003' },
          { id: 4, nombre: 'Proyecto 4', codigo: 'P004' },
          { id: 5, nombre: 'Proyecto 5', codigo: 'P005' }
        ]);
        
        // Si estamos editando, cargar la factura existente
        if (isEditing) {
          // Aquí cargaríamos los datos de la factura desde la API
          // Por ahora usamos datos ficticios
          const facturaData = {
            id: parseInt(id),
            numero_factura: `F-${2023000 + parseInt(id)}`,
            fecha_emision: new Date(2023, 0, parseInt(id)),
            fecha_vencimiento: new Date(2023, 1, parseInt(id)),
            cliente_id: (parseInt(id) % 5) + 1,
            proyecto_id: parseInt(id) % 3 === 0 ? Math.floor(parseInt(id) / 3) + 1 : '',
            condiciones_pago: 'CREDITO',
            observaciones: 'Observaciones de ejemplo para la factura',
            estado: 'PENDIENTE',
            iva: 19,
            monto_neto: 100000 * parseInt(id),
            monto_iva: 19000 * parseInt(id),
            monto_total: 119000 * parseInt(id)
          };
          
          const facturaItems = [
            { 
              id: 1, 
              descripcion: 'Servicio de capacitación', 
              cantidad: 1, 
              precio_unitario: 100000 * parseInt(id), 
              descuento: 0, 
              total: 100000 * parseInt(id) 
            }
          ];
          
          formik.setValues({
            ...facturaData
          });
          
          setItems(facturaItems);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Configuración de Formik
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Aquí enviaríamos los datos a la API
        // Por ahora solo mostramos los datos en consola
        const facturaData = {
          ...values,
          items
        };
        console.log('Datos de la factura a guardar:', facturaData);
        
        // Simular guardado exitoso
        setTimeout(() => {
          setLoading(false);
          navigate('/finanzas/facturas');
        }, 1000);
      } catch (error) {
        console.error('Error al guardar la factura:', error);
        setLoading(false);
      }
    }
  });

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

  // Recalcular totales de la factura
  const recalcularTotales = (itemsList) => {
    const montoNeto = itemsList.reduce((sum, item) => sum + Number(item.total), 0);
    const montoIva = montoNeto * (formik.values.iva / 100);
    const montoTotal = montoNeto + montoIva;
    
    formik.setFieldValue('monto_neto', montoNeto);
    formik.setFieldValue('monto_iva', montoIva);
    formik.setFieldValue('monto_total', montoTotal);
  };

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

      <form onSubmit={formik.handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Información General
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                id="numero_factura"
                name="numero_factura"
                label="Número de Factura"
                value={formik.values.numero_factura}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.numero_factura && Boolean(formik.errors.numero_factura)}
                helperText={formik.touched.numero_factura && formik.errors.numero_factura}
                disabled={isEditing}
              />
            </Grid>
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
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="PAGADA">Pagada</MenuItem>
                <MenuItem value="VENCIDA">Vencida</MenuItem>
                <MenuItem value="ANULADA">Anulada</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="cliente_id"
                name="cliente_id"
                label="Cliente"
                value={formik.values.cliente_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.cliente_id && Boolean(formik.errors.cliente_id)}
                helperText={formik.touched.cliente_id && formik.errors.cliente_id}
              >
                <MenuItem value="">Seleccione un cliente</MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    {cliente.razon_social} ({cliente.rut})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="proyecto_id"
                name="proyecto_id"
                label="Proyecto (Opcional)"
                value={formik.values.proyecto_id}
                onChange={formik.handleChange}
              >
                <MenuItem value="">Sin proyecto asociado</MenuItem>
                {proyectos.map((proyecto) => (
                  <MenuItem key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre} ({proyecto.codigo})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="condiciones_pago"
                name="condiciones_pago"
                label="Condiciones de Pago"
                value={formik.values.condiciones_pago}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.condiciones_pago && Boolean(formik.errors.condiciones_pago)}
                helperText={formik.touched.condiciones_pago && formik.errors.condiciones_pago}
              >
                <MenuItem value="CONTADO">Contado</MenuItem>
                <MenuItem value="CREDITO">Crédito</MenuItem>
                <MenuItem value="30_DIAS">30 Días</MenuItem>
                <MenuItem value="60_DIAS">60 Días</MenuItem>
                <MenuItem value="90_DIAS">90 Días</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="iva"
                name="iva"
                label="IVA (%)"
                type="number"
                value={formik.values.iva}
                onChange={(e) => {
                  formik.handleChange(e);
                  recalcularTotales(items);
                }}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
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
                <Typography variant="body1">IVA ({formik.values.iva}%):</Typography>
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
            disabled={loading}
          >
            {isEditing ? 'Actualizar' : 'Crear'} Factura
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default FacturaForm; 