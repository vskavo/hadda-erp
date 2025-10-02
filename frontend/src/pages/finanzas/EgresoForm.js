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
import { egresoService, proyectoService, cuentaBancariaService } from '../../services';
import LoadingIndicator from '../../components/common/LoadingIndicator';

// Componente para crear/editar egresos
const EgresoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  // Estados para los datos del formulario
  const [formData, setFormData] = useState({
    fecha: new Date(),
    descripcion: '',
    monto: '',
    categoria: 'SERVICIOS',
    estado: 'PENDIENTE',
    proveedor_nombre: '',
    proyecto_id: '',
    cuenta_bancaria_id: '',
    observaciones: ''
  });

  // Estados para las opciones de los selectores
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
        const [proyectosResponse, cuentasResponse] = await Promise.all([
          proyectoService.getProyectos({ limit: 1000 }),
          cuentaBancariaService.getCuentasBancarias()
        ]);

        setProyectos(proyectosResponse.proyectos || proyectosResponse.rows || []);
        setCuentasBancarias(cuentasResponse.cuentas || cuentasResponse.rows || []);

        // Si estamos editando, cargar los datos del egreso
        if (isEditing) {
          const egresoResponse = await egresoService.getEgreso(id);
          const egreso = egresoResponse.egreso || egresoResponse;

          setFormData({
            fecha: egreso.fecha ? new Date(egreso.fecha) : new Date(),
            descripcion: egreso.descripcion || '',
            monto: egreso.monto || '',
            categoria: egreso.categoria || 'SERVICIOS',
            estado: egreso.estado || 'PENDIENTE',
            proveedor_nombre: egreso.proveedor_nombre || '',
            proyecto_id: egreso.proyecto_id || '',
            cuenta_bancaria_id: egreso.cuenta_bancaria_id || '',
            observaciones: egreso.observaciones || ''
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

    if (!formData.categoria) {
      nuevosErrores.categoria = 'La categoría es obligatoria';
    }

    if (!formData.estado) {
      nuevosErrores.estado = 'El estado es obligatorio';
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Función para guardar el egreso
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
        await egresoService.updateEgreso(id, datosAGuardar);
        setSnackbar({
          open: true,
          message: 'Egreso actualizado exitosamente',
          severity: 'success'
        });
      } else {
        await egresoService.createEgreso(datosAGuardar);
        setSnackbar({
          open: true,
          message: 'Egreso creado exitosamente',
          severity: 'success'
        });
      }

      // Redirigir después de un breve delay
      setTimeout(() => {
        navigate('/finanzas/movimientos');
      }, 1500);

    } catch (error) {
      console.error('Error al guardar egreso:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al guardar el egreso',
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

  // Función para manejar cambios en el monto con formato
  const handleMontoChange = (value) => {
    // Remover caracteres no numéricos excepto punto y coma
    const cleanValue = value.replace(/[^\d.,]/g, '');
    handleInputChange('monto', cleanValue);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LoadingIndicator message={isEditing ? "Cargando egreso..." : "Cargando formulario..."} fullPage={false} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditing ? 'Editar Egreso' : 'Nuevo Egreso'}
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

          {/* Categoría */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small" error={Boolean(errors.categoria)}>
              <InputLabel>Categoría *</InputLabel>
              <Select
                value={formData.categoria}
                label="Categoría *"
                onChange={(e) => handleInputChange('categoria', e.target.value)}
              >
                <MenuItem value="ARRIENDO">Arriendo</MenuItem>
                <MenuItem value="SERVICIOS">Servicios</MenuItem>
                <MenuItem value="MATERIALES">Materiales</MenuItem>
                <MenuItem value="PERSONAL">Personal</MenuItem>
                <MenuItem value="OTROS">Otros</MenuItem>
              </Select>
              {errors.categoria && <FormHelperText>{errors.categoria}</FormHelperText>}
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
                <MenuItem value="PAGADO">Pagado</MenuItem>
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

          {/* Proveedor */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Proveedor"
              value={formData.proveedor_nombre}
              onChange={(e) => handleInputChange('proveedor_nombre', e.target.value)}
              size="small"
            />
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

export default EgresoForm;
