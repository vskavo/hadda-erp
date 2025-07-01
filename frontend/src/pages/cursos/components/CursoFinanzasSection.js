import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Divider,
  Paper,
  Alert,
  Autocomplete,
  Card,
  CardContent,
  Box,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatMoneda } from '../utils/formatUtils';

/**
 * Sección de información financiera y proyecto asociado del curso.
 * Recibe props desde el hook principal useCursoForm.
 */
const CursoFinanzasSection = ({
  formik,
  isEditing,
  proyectos,
  loadingProyectos,
  selectedProyecto,
  loadingProyectoDetails,
  handleProyectoChange,
  navigate
}) => {
  // Renderizar un campo de texto de solo lectura
  const renderReadOnlyField = (label, value, gridSize = { xs: 12, sm: 6 }) => {
    let displayValue = value;
    
    // Si es un valor monetario, formatearlo
    if (label.includes('Valor') || label.includes('Presupuesto')) {
      displayValue = formatMoneda(value);
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
        Información financiera y proyecto
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        {isEditing ? (
          // Modo visualización para edición
          <>
            {renderReadOnlyField('Valor por Hora ($)', formik.values.valor_hora)}
            {renderReadOnlyField('Valor Total ($)', selectedProyecto && selectedProyecto.presupuesto ? selectedProyecto.presupuesto : formik.values.valor_total)}
            
            {selectedProyecto && (
              <Grid item xs={12}>
                {renderReadOnlyField('Proyecto Asociado', selectedProyecto.nombre, { xs: 12, sm: 12 })}
                {/* Mostrar el proyect_id debajo del nombre del proyecto */}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>ID Proyecto:</strong> {selectedProyecto.proyect_id || 'No disponible'}
                </Typography>
              </Grid>
            )}
          </>
        ) : (
          // Modo edición para nuevo curso
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="valor_hora"
                name="valor_hora"
                label="Valor por Hora ($)"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                value={formik.values.valor_hora}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.valor_hora && Boolean(formik.errors.valor_hora)}
                helperText={formik.touched.valor_hora && formik.errors.valor_hora}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="valor_total"
                name="valor_total"
                label="Valor Total ($)"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                value={formik.values.valor_total}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.valor_total && Boolean(formik.errors.valor_total)}
                helperText={formik.touched.valor_total && formik.errors.valor_total}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                id="proyecto_id"
                options={proyectos}
                loading={loadingProyectos}
                getOptionLabel={(option) => option.nombre || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={proyectos.find(p => p.id === formik.values.proyecto_id) || null}
                onChange={handleProyectoChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Proyecto Asociado"
                    error={formik.touched.proyecto_id && Boolean(formik.errors.proyecto_id)}
                    helperText={formik.touched.proyecto_id && formik.errors.proyecto_id}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingProyectos ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </>
        )}
        
        {/* Mostrar detalles del proyecto si hay uno seleccionado */}
        {selectedProyecto ? (
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Detalles del proyecto
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Nombre del proyecto</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{selectedProyecto.nombre}</Typography>
                      <Tooltip title="Ir a la página del proyecto">
                        <IconButton 
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/proyectos/${selectedProyecto.id}`)}
                          disabled={!selectedProyecto?.id}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {/* Mostrar el proyect_id debajo del nombre del proyecto */}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>ID Proyecto:</strong> {selectedProyecto.proyect_id || 'No disponible'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Presupuesto</Typography>
                    <Typography variant="body2">
                      ${Number(selectedProyecto.presupuesto).toLocaleString('es-CL')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                    <Typography variant="body2">{selectedProyecto.estado}</Typography>
                  </Grid>
                  
                  {selectedProyecto.Cliente && (
                    <>
                      <Grid item xs={12} sx={{ mt: 1 }}>
                        <Typography variant="subtitle1">Cliente</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Razón social</Typography>
                        <Typography variant="body2">{selectedProyecto.Cliente.razon_social}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">RUT</Typography>
                        <Typography variant="body2">{selectedProyecto.Cliente.rut}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Contacto</Typography>
                        <Typography variant="body2">{selectedProyecto.Cliente.contacto_nombre || 'No disponible'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Email de contacto</Typography>
                        <Typography variant="body2">{selectedProyecto.Cliente.contacto_email || 'No disponible'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Teléfono de contacto</Typography>
                        <Typography variant="body2">{selectedProyecto.Cliente.contacto_telefono || 'No disponible'}</Typography>
                      </Grid>
                    </>
                  )}
                  
                  {selectedProyecto.Responsable && (
                    <>
                      <Grid item xs={12} sx={{ mt: 1 }}>
                        <Typography variant="subtitle1">Responsable</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Nombre</Typography>
                        <Typography variant="body2">
                          {`${selectedProyecto.Responsable.nombre || ''} ${selectedProyecto.Responsable.apellido || ''}`}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                        <Typography variant="body2">
                          {selectedProyecto.Responsable.email || 'No disponible'}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          !loadingProyectoDetails && formik.values.proyecto_id ? (
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mt: 1 }}>
                No se pudo cargar la información completa del proyecto. Por favor, seleccione nuevamente o contacte al administrador.
              </Alert>
            </Grid>
          ) : !loadingProyectoDetails && !isEditing && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 1 }}>
                Al asociar un proyecto, podrás vincular este curso con un cliente y un responsable específicos.
              </Alert>
            </Grid>
          )
        )}
      </Grid>
    </Paper>
  );
};

export default CursoFinanzasSection; 