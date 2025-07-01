import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Divider,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import SyncIcon from '@mui/icons-material/Sync';
import CircularProgress from '@mui/material/CircularProgress';
import { formatFechaUI } from '../utils/formatUtils';

/**
 * Sección de información general del curso (nombre, fechas, modalidad, etc.).
 * Recibe props desde el hook principal useCursoForm.
 */
const CursoInfoSection = ({
  formik,
  isEditing,
  handleSyncSence,
  syncLoading,
  syncResult,
  usuarios,
  loadingUsuarios
}) => {
  // Renderizar un campo de texto de solo lectura
  const renderReadOnlyField = (label, value, gridSize = { xs: 12, sm: 6 }) => {
    let displayValue = value;
    if ((label === 'Fecha de Inicio' || label === 'Fecha de Fin') && value instanceof Date && !isNaN(value)) {
      displayValue = formatFechaUI(value);
    } else if (label === 'Fecha de Inicio' || label === 'Fecha de Fin') {
      displayValue = value || 'No definida';
    } else {
      displayValue = value || 'No disponible';
    }

    return (
      <Grid item xs={gridSize.xs} sm={gridSize.sm}>
        <TextField
          fullWidth
          label={label}
          value={displayValue}
          InputProps={{
            readOnly: true,
          }}
          variant="filled"
        />
      </Grid>
    );
  };
  
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Información del curso
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        {isEditing ? (
          // Modo visualización para edición
          <>
            {renderReadOnlyField('Nombre del Curso', formik.values.nombre, { xs: 12, sm: 12 })}
            {renderReadOnlyField('Código SENCE', formik.values.codigo_sence)}
            
            {/* Campo editable de ID SENCE */}
            <Grid item xs={12} sm={6} style={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                id="id_sence"
                name="id_sence"
                label="ID SENCE"
                value={formik.values.id_sence || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.id_sence && Boolean(formik.errors.id_sence)}
                helperText={(formik.touched.id_sence && formik.errors.id_sence) || "Si no tiene ID SENCE ingrese un valor como 'N/A' o similar"}
              />
              {isEditing && (
                <Tooltip title="Sincronizar con SENCE">
                  <span>
                    <IconButton
                      color="primary"
                      onClick={handleSyncSence}
                      disabled={syncLoading || !formik.values.id_sence}
                      sx={{ ml: 1 }}
                    >
                      {syncLoading ? <CircularProgress size={24} /> : <SyncIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Grid>
            
            {syncResult && (
              <Grid item xs={12}>
                <Alert severity={syncResult.success ? 'success' : 'error'} sx={{ mt: 1 }}>
                  {syncResult.message || (syncResult.success ? 'Sincronización exitosa' : 'Error al sincronizar')}
                </Alert>
              </Grid>
            )}
            
            {renderReadOnlyField('Duración (horas)', formik.values.duracion_horas)}
            {renderReadOnlyField('Modalidad', formik.values.modalidad)}
            {renderReadOnlyField('Número de Participantes', formik.values.nro_participantes)}
            {renderReadOnlyField('Estado', formik.values.estado)}
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="estado-sence-label">Estado SENCE</InputLabel>
                <Select
                  labelId="estado-sence-label"
                  id="estado_sence"
                  name="estado_sence"
                  value={formik.values.estado_sence || 'pendiente'}
                  onChange={formik.handleChange}
                  label="Estado SENCE"
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="aprobado">Aprobado</MenuItem>
                  <MenuItem value="rechazado">Rechazado</MenuItem>
                  <MenuItem value="en_revision">En Revisión</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="tipo-contrato-label">Tipo de Contrato</InputLabel>
                <Select
                  labelId="tipo-contrato-label"
                  id="tipo_de_contrato"
                  name="tipo_de_contrato"
                  value={formik.values.tipo_de_contrato || ''}
                  onChange={formik.handleChange}
                  label="Tipo de Contrato"
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="Pre-Contrato">Pre-Contrato</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="estado-pre-contrato-label">Estado Pre-Contrato</InputLabel>
                <Select
                  labelId="estado-pre-contrato-label"
                  id="estado_pre_contrato"
                  name="estado_pre_contrato"
                  value={formik.values.estado_pre_contrato || ''}
                  onChange={formik.handleChange}
                  label="Estado Pre-Contrato"
                >
                  <MenuItem value="No Aplica">No Aplica</MenuItem>
                  <MenuItem value="Enviado">Enviado</MenuItem>
                  <MenuItem value="Aprobado">Aprobado</MenuItem>
                  <MenuItem value="Con Observación">Con Observación</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Inicio"
                value={formik.values.fecha_inicio}
                onChange={(date) => formik.setFieldValue('fecha_inicio', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio),
                    helperText: formik.touched.fecha_inicio && formik.errors.fecha_inicio,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Fin"
                value={formik.values.fecha_fin}
                onChange={(date) => formik.setFieldValue('fecha_fin', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.fecha_fin && Boolean(formik.errors.fecha_fin),
                    helperText: formik.touched.fecha_fin && formik.errors.fecha_fin,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              {/* Campo Responsable de Operaciones */}
              {(!formik.values.owner_operaciones || formik.values.owner_operaciones === '') ? (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="owner-operaciones-label">Responsable de Operaciones</InputLabel>
                  <Select
                    labelId="owner-operaciones-label"
                    id="owner_operaciones"
                    name="owner_operaciones"
                    value={formik.values.owner_operaciones || ''}
                    onChange={formik.handleChange}
                    label="Responsable de Operaciones"
                    disabled={loadingUsuarios}
                  >
                    <MenuItem value=""><em>Sin asignar</em></MenuItem>
                    {usuarios.map((usuario) => (
                      <MenuItem key={usuario.id} value={usuario.id}>
                        {usuario.nombre} {usuario.apellido} ({usuario.email})
                      </MenuItem>
                    ))}
                  </Select>
                  {loadingUsuarios && <FormHelperText>Cargando usuarios...</FormHelperText>}
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label="Responsable de Operaciones"
                  value={(() => {
                    const usuario = usuarios.find(u => u.id === formik.values.owner_operaciones);
                    return usuario ? `${usuario.nombre} ${usuario.apellido} (${usuario.email})` : 'No asignado';
                  })()}
                  InputProps={{ readOnly: true }}
                  variant="filled"
                  sx={{ mt: 2 }}
                />
              )}
            </Grid>
          </>
        ) : (
          // Modo edición para nuevo curso
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="nombre"
                name="nombre"
                label="Nombre del Curso"
                value={formik.values.nombre}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                helperText={formik.touched.nombre && formik.errors.nombre}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="codigo_sence"
                name="codigo_sence"
                label="Código SENCE"
                value={formik.values.codigo_sence}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.codigo_sence && Boolean(formik.errors.codigo_sence)}
                helperText={formik.touched.codigo_sence && formik.errors.codigo_sence}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="id_sence"
                name="id_sence"
                label="ID SENCE"
                value={formik.values.id_sence}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.id_sence && Boolean(formik.errors.id_sence)}
                helperText={formik.touched.id_sence && formik.errors.id_sence}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="duracion_horas"
                name="duracion_horas"
                label="Duración (horas)"
                type="number"
                InputProps={{ inputProps: { min: 1 } }}
                value={formik.values.duracion_horas}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.duracion_horas && Boolean(formik.errors.duracion_horas)}
                helperText={formik.touched.duracion_horas && formik.errors.duracion_horas}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="modalidad-label">Modalidad</InputLabel>
                <Select
                  labelId="modalidad-label"
                  id="modalidad"
                  name="modalidad"
                  value={formik.values.modalidad}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.modalidad && Boolean(formik.errors.modalidad)}
                  label="Modalidad"
                  required
                >
                  <MenuItem value="presencial">Presencial</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="mixta">Mixta</MenuItem>
                </Select>
                {formik.touched.modalidad && formik.errors.modalidad && (
                  <FormHelperText error>{formik.errors.modalidad}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="nro_participantes"
                name="nro_participantes"
                label="Número de Participantes"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                value={formik.values.nro_participantes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.nro_participantes && Boolean(formik.errors.nro_participantes)}
                helperText={formik.touched.nro_participantes && formik.errors.nro_participantes}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  id="estado"
                  name="estado"
                  value={formik.values.estado}
                  onChange={formik.handleChange}
                  label="Estado"
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                  <MenuItem value="en_revision">En Revisión</MenuItem>
                  <MenuItem value="finalizado">Finalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="estado-sence-label">Estado SENCE</InputLabel>
                <Select
                  labelId="estado-sence-label"
                  id="estado_sence"
                  name="estado_sence"
                  value={formik.values.estado_sence || 'pendiente'}
                  onChange={formik.handleChange}
                  label="Estado SENCE"
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="aprobado">Aprobado</MenuItem>
                  <MenuItem value="rechazado">Rechazado</MenuItem>
                  <MenuItem value="en_revision">En Revisión</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="tipo-contrato-label">Tipo de Contrato</InputLabel>
                <Select
                  labelId="tipo-contrato-label"
                  id="tipo_de_contrato"
                  name="tipo_de_contrato"
                  value={formik.values.tipo_de_contrato || ''}
                  onChange={formik.handleChange}
                  label="Tipo de Contrato"
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="Pre-Contrato">Pre-Contrato</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="estado-pre-contrato-label">Estado Pre-Contrato</InputLabel>
                <Select
                  labelId="estado-pre-contrato-label"
                  id="estado_pre_contrato"
                  name="estado_pre_contrato"
                  value={formik.values.estado_pre_contrato || ''}
                  onChange={formik.handleChange}
                  label="Estado Pre-Contrato"
                >
                  <MenuItem value="No Aplica">No Aplica</MenuItem>
                  <MenuItem value="Enviado">Enviado</MenuItem>
                  <MenuItem value="Aprobado">Aprobado</MenuItem>
                  <MenuItem value="Con Observación">Con Observación</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Inicio"
                value={formik.values.fecha_inicio}
                onChange={(date) => formik.setFieldValue('fecha_inicio', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio),
                    helperText: formik.touched.fecha_inicio && formik.errors.fecha_inicio,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Fin"
                value={formik.values.fecha_fin}
                onChange={(date) => formik.setFieldValue('fecha_fin', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.fecha_fin && Boolean(formik.errors.fecha_fin),
                    helperText: formik.touched.fecha_fin && formik.errors.fecha_fin,
                  },
                }}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default CursoInfoSection; 