import React from 'react';
import { 
  Grid, 
  Typography, 
  Button, 
  Divider, 
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Chip
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { formatNumber } from '../utils/formatUtils';
import { useAuth } from '../../../hooks/useAuth';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CostosSection = ({ 
  costos,
  openCostoModal,
  nuevoCosto,
  usuarios,
  saving,
  editingCostoId,
  handleOpenCostoModal,
  handleCloseCostoModal,
  handleCostoInputChange,
  handleCostoSwitchChange,
  handleCostoDateChange,
  handleAgregarCosto,
  handleEliminarCosto,
  handleEditCosto,
  bloqueado = false
}) => {
  const { user } = useAuth();

  const canApproveCost = user && (user.rol === 'administrador' || user.rol === 'gerencia');

  // Función auxiliar para obtener nombre del aprobador
  const getApproverName = (approverId) => {
    if (!approverId || !usuarios) return 'N/A';
    const approver = usuarios.find(u => u.id === approverId);
    return approver ? `${approver.nombre} ${approver.apellido}` : 'Usuario no encontrado';
  };

  return (
    <>
      {/* Costos del proyecto */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Costos del Proyecto
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">
            Lista de Costos
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleIcon />}
            onClick={handleOpenCostoModal}
            disabled={saving || bloqueado}
          >
            Agregar Costo
          </Button>
        </Box>
        
        {costos.length > 0 ? (
          <Box>
            {/* Encabezados de columnas para el resumen del acordeón */}
            <Grid container alignItems="center" sx={{ px: 2, py: 1, bgcolor: 'grey.100', borderRadius: 1, mb: 1 }}>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" fontWeight="bold">Concepto del costo</Typography>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Typography variant="caption" fontWeight="bold">Tipo de Costo</Typography>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Typography variant="caption" fontWeight="bold">Fecha</Typography>
              </Grid>
              <Grid item xs={6} sm={1}>
                <Typography variant="caption" fontWeight="bold">Monto</Typography>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Typography variant="caption" fontWeight="bold" align="center" sx={{ width: '100%', display: 'block' }}>Estado</Typography>
              </Grid>
              <Grid item xs={12} sm={2} />
            </Grid>
            {costos.map((costo) => (
              <Accordion key={costo.id} sx={{ mb: 1 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel-content-${costo.id}`}
                  id={`panel-header-${costo.id}`}
                >
                  <Grid container alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Typography fontWeight="bold">{costo.concepto || 'Sin concepto'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography>{costo.tipo_costo || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography>{costo.fecha ? format(new Date(costo.fecha), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={1}>
                      <Typography align="right">${formatNumber(costo.monto)}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={2} sx={{ display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
                      {costo.aprobado ? (
                        <Chip label="Aprobado" color="success" size="small" icon={<CheckCircleIcon fontSize="small" />} />
                      ) : (
                        <Chip label="No aprobado" color="default" variant="outlined" size="small" icon={<CancelIcon fontSize="small" />} />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton color="primary" onClick={() => handleEditCosto(costo.id)} disabled={saving} size="small" sx={{ mr: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleEliminarCosto(costo.id)} disabled={saving} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Observaciones:</Typography>
                      <Typography variant="body2">{costo.observaciones || 'Sin observaciones'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2">Incluye IVA:</Typography>
                      <Typography variant="body2">{costo.aplica_iva ? 'Sí' : 'No'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2">Proveedor:</Typography>
                      <Typography variant="body2">{costo.proveedor || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2">Aprobado por:</Typography>
                      <Typography variant="body2">{costo.aprobado ? getApproverName(costo.aprobado_por) : 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" color="text.secondary">
                No hay costos registrados para este proyecto. Haga clic en "Agregar Costo" para comenzar.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Grid>
      
      {/* Modal para añadir o editar costo */}
      <Dialog open={openCostoModal} onClose={handleCloseCostoModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCostoId ? 'Editar Costo del Proyecto' : 'Añadir Nuevo Costo al Proyecto'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="concepto"
                label="Concepto"
                value={nuevoCosto.concepto}
                onChange={handleCostoInputChange}
                fullWidth
                required
                disabled={saving || bloqueado}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Costo</InputLabel>
                <Select
                  name="tipo_costo"
                  value={nuevoCosto.tipo_costo}
                  onChange={handleCostoInputChange}
                  label="Tipo de Costo"
                >
                  <MenuItem value="recursos_humanos">Recursos Humanos</MenuItem>
                  <MenuItem value="materiales">Materiales</MenuItem>
                  <MenuItem value="equipos">Equipos</MenuItem>
                  <MenuItem value="servicios">Servicios</MenuItem>
                  <MenuItem value="logistica">Logística</MenuItem>
                  <MenuItem value="administrativos">Administrativos</MenuItem>
                  <MenuItem value="impuestos">Impuestos</MenuItem>
                  <MenuItem value="otros">Otros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Campo de observaciones solo si tipo_costo es 'otros' */}
            {nuevoCosto.tipo_costo === 'otros' && (
              <Grid item xs={12}>
                <TextField
                  name="observaciones"
                  label="Especifique el costo adicional"
                  value={nuevoCosto.observaciones || ''}
                  onChange={handleCostoInputChange}
                  fullWidth
                  required
                  multiline
                  minRows={2}
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <TextField
                name="monto"
                label="Monto"
                type="text"
                value={formatNumber(nuevoCosto.monto)}
                onChange={handleCostoInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha"
                  value={nuevoCosto.fecha}
                  onChange={handleCostoDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="proveedor"
                label="Proveedor"
                value={nuevoCosto.proveedor}
                onChange={handleCostoInputChange}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={nuevoCosto.aprobado}
                    onChange={handleCostoSwitchChange}
                    name="aprobado"
                    color="primary"
                    disabled={!canApproveCost || saving}
                  />
                }
                label={canApproveCost ? "Aprobado" : "Aprobado (Solo Gerencia/Admin)"}
              />
            </Grid>
            
            {/* Switches IVA y Honorarios */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={nuevoCosto.aplica_iva}
                    onChange={handleCostoSwitchChange}
                    name="aplica_iva"
                    color="primary"
                  />
                }
                label="Aplicar IVA"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={nuevoCosto.aplica_honorarios}
                    onChange={handleCostoSwitchChange}
                    name="aplica_honorarios"
                    color="primary"
                  />
                }
                label="Aplica Honorarios"
              />
            </Grid>
            
            {nuevoCosto.aprobado && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Aprobado por</InputLabel>
                  <Select
                    name="aprobado_por"
                    value={nuevoCosto.aprobado_por}
                    onChange={handleCostoInputChange}
                    label="Aprobado por"
                  >
                    {usuarios && usuarios.map(usuario => (
                      <MenuItem key={usuario.id} value={usuario.id}>
                        {usuario.nombre} {usuario.apellido}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseCostoModal} color="secondary" disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAgregarCosto} 
            color="primary" 
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Guardando...' : (editingCostoId ? 'Actualizar Costo' : 'Guardar Costo')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CostosSection; 