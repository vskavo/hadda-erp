import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ingresoService, clienteService, proyectoService, cuentaBancariaService } from '../../services';
import LoadingIndicator from '../../components/common/LoadingIndicator';

// Componente para crear/editar ingresos
const IngresoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  // Estados para los datos del formulario
  const [formData, setFormData] = useState({
    fecha: new Date(),
    descripcion: '',
    monto: '',
    tipo_ingreso: 'TRANSFERENCIA',
    estado: 'PENDIENTE',
    cliente_id: '',
    proyecto_id: '',
    cuenta_bancaria_id: '',
    observaciones: ''
  });

  // Estados para las opciones de los selectores
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [cuentasBancarias, setCuentasBancarias] = useState([]);

  // Estados para la gestión de la interfaz
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setLoading(true);
      try {
        // Cargar listas de opciones en paralelo
        const [clientesResponse, proyectosResponse, cuentasResponse] = await Promise.all([
          clienteService.getClientes({ limit: 1000 }),
          proyectoService.getProyectos({ limit: 1000 }),
          cuentaBancariaService.getCuentasBancarias()
        ]);

        setClientes(clientesResponse.clientes || clientesResponse.rows || []);
        setProyectos(proyectosResponse.proyectos || proyectosResponse.rows || []);
        setCuentasBancarias(cuentasResponse.cuentas || cuentasResponse.rows || []);

        // Si estamos editando, cargar los datos del ingreso
        if (isEditing) {
          const ingresoResponse = await ingresoService.getIngreso(id);
          const ingreso = ingresoResponse.ingreso || ingresoResponse;

          setFormData({
            fecha: ingreso.fecha ? new Date(ingreso.fecha) : new Date(),
            descripcion: ingreso.descripcion || '',
            monto: ingreso.monto || '',
            tipo_ingreso: ingreso.tipo_ingreso || 'TRANSFERENCIA',
            estado: ingreso.estado || 'PENDIENTE',
            cliente_id: ingreso.cliente_id || '',
            proyecto_id: ingreso.proyecto_id || '',
            cuenta_bancaria_id: ingreso.cuenta_bancaria_id || '',
            observaciones: ingreso.observaciones || ''
          });
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar los datos',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatosIniciales();
  }, [id, isEditing]);

  // Función para manejar cambios en los campos del formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Función para validar el formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.fecha) {
      nuevosErrores.fecha = 'La fecha es obligatoria';
    }

    if (!formData.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción es obligatoria';
    }

    if (!formData.monto || isNaN(formData.monto) || parseFloat(formData.monto) <= 0) {
      nuevosErrores.monto = 'El monto debe ser un número positivo';
    }

    if (!formData.tipo_ingreso) {
      nuevosErrores.tipo_ingreso = 'El tipo de ingreso es obligatorio';
    }

    if (!formData.estado) {
      nuevosErrores.estado = 'El estado es obligatorio';
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Función para guardar el ingreso
  const handleGuardar = async () => {
    if (!validarFormulario()) {
      setSnackbar({
        open: true,
        message: 'Por favor, complete todos los campos obligatorios',
        severity: 'warning'
      });
      return;
    }

    setSaving(true);
    try {
      const datosAGuardar = {
        ...formData,
        fecha: format(formData.fecha, 'yyyy-MM-dd'),
        monto: parseFloat(formData.monto)
      };

      if (isEditing) {
        await ingresoService.updateIngreso(id, datosAGuardar);
        setSnackbar({
          open: true,
          message: 'Ingreso actualizado exitosamente',
          severity: 'success'
        });
      } else {
        await ingresoService.createIngreso(datosAGuardar);
        setSnackbar({
          open: true,
          message: 'Ingreso creado exitosamente',
          severity: 'success'
        });
      }

      // Redirigir después de un breve delay
      setTimeout(() => {
        navigate('/finanzas/movimientos');
      }, 1500);

    } catch (error) {
      console.error('Error al guardar ingreso:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al guardar el ingreso',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Función para cancelar y volver
  const handleCancelar = () => {
    navigate('/finanzas/movimientos');
  };

  // Función para cerrar el snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Formatear montos para visualización
  const formatMonto = (monto) => {
    if (!monto) return '';
    const numMonto = parseFloat(monto);
    if (isNaN(numMonto)) return monto;
    return numMonto.toLocaleString('es-CL');
  };

  // Función para manejar cambios en el monto con formato
  const handleMontoChange = (value) => {
    // Remover caracteres no numéricos excepto punto y coma
    const cleanValue = value.replace(/[^\d.,]/g, '');
    handleInputChange('monto', cleanValue);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LoadingIndicator message={isEditing ? "Cargando ingreso..." : "Cargando formulario..."} fullPage={false} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditing ? 'Editar Ingreso' : 'Nuevo Ingreso'}
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={3}>
          {/* Fecha */}
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Fecha *"
              value={formData.fecha}
              onChange={(date) => handleInputChange('fecha', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: Boolean(errors.fecha),
                  helperText: errors.fecha,
                  size: 'small'
                }
              }}
            />
          </Grid>

          {/* Tipo de ingreso */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small" error={Boolean(errors.tipo_ingreso)}>
              <InputLabel>Tipo de Ingreso *</InputLabel>
              <Select
                value={formData.tipo_ingreso}
                label="Tipo de Ingreso *"
                onChange={(e) => handleInputChange('tipo_ingreso', e.target.value)}
              >
                <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
                <MenuItem value="OTRO">Otro</MenuItem>
              </Select>
              {errors.tipo_ingreso && <FormHelperText>{errors.tipo_ingreso}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Monto */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Monto *"
              value={formData.monto}
              onChange={(e) => handleMontoChange(e.target.value)}
              error={Boolean(errors.monto)}
              helperText={errors.monto}
              size="small"
              placeholder="0"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
          </Grid>

          {/* Estado */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small" error={Boolean(errors.estado)}>
              <InputLabel>Estado *</InputLabel>
              <Select
                value={formData.estado}
                label="Estado *"
                onChange={(e) => handleInputChange('estado', e.target.value)}
              >
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="CONFIRMADO">Confirmado</MenuItem>
                <MenuItem value="ANULADO">Anulado</MenuItem>
                <MenuItem value="RECHAZADO">Rechazado</MenuItem>
              </Select>
              {errors.estado && <FormHelperText>{errors.estado}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Descripción */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción *"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              error={Boolean(errors.descripcion)}
              helperText={errors.descripcion}
              size="small"
              multiline
              rows={2}
            />
          </Grid>

          {/* Cliente */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Cliente</InputLabel>
              <Select
                value={formData.cliente_id}
                label="Cliente"
                onChange={(e) => handleInputChange('cliente_id', e.target.value)}
              >
                <MenuItem value="">
                  <em>Seleccionar cliente</em>
                </MenuItem>
                {clientes.map(cliente => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    {cliente.razon_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Proyecto */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Proyecto</InputLabel>
              <Select
                value={formData.proyecto_id}
                label="Proyecto"
                onChange={(e) => handleInputChange('proyecto_id', e.target.value)}
              >
                <MenuItem value="">
                  <em>Seleccionar proyecto</em>
                </MenuItem>
                {proyectos.map(proyecto => (
                  <MenuItem key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Cuenta bancaria */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Cuenta Bancaria</InputLabel>
              <Select
                value={formData.cuenta_bancaria_id}
                label="Cuenta Bancaria"
                onChange={(e) => handleInputChange('cuenta_bancaria_id', e.target.value)}
              >
                <MenuItem value="">
                  <em>Seleccionar cuenta</em>
                </MenuItem>
                {cuentasBancarias.map(cuenta => (
                  <MenuItem key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre} - {cuenta.banco}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Observaciones */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              size="small"
              multiline
              rows={3}
            />
          </Grid>
        </Grid>

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleCancelar}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardar}
            disabled={saving}
          >
            {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IngresoForm;
