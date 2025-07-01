import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TuneIcon from '@mui/icons-material/Tune';
import { reporteService } from '../../services';
import { AlertMessage, LoadingIndicator, DataTable } from '../../components/common';

const GeneradorReportes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [entidades, setEntidades] = useState([
    { id: 'proyectos', nombre: 'Proyectos' },
    { id: 'clientes', nombre: 'Clientes' },
    { id: 'facturas', nombre: 'Facturas' },
    { id: 'cursos', nombre: 'Cursos' },
    { id: 'finanzas', nombre: 'Finanzas' }
  ]);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState('');
  const [camposDisponibles, setCamposDisponibles] = useState([]);
  const [camposSeleccionados, setCamposSeleccionados] = useState([]);
  const [filtros, setFiltros] = useState([]);
  const [configuracionReporte, setConfiguracionReporte] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'General'
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [reporteGenerado, setReporteGenerado] = useState(null);
  
  // Cargar campos disponibles cuando se selecciona una entidad
  useEffect(() => {
    const cargarCampos = async () => {
      if (!entidadSeleccionada) {
        setCamposDisponibles([]);
        return;
      }
      
      try {
        setLoading(true);
        const data = await reporteService.getCamposDisponibles(entidadSeleccionada);
        setCamposDisponibles(data.campos || []);
        setFiltros(data.filtros || []);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar campos disponibles: ' + err.message);
        setLoading(false);
      }
    };
    
    cargarCampos();
  }, [entidadSeleccionada]);
  
  const handleEntidadChange = (event) => {
    setEntidadSeleccionada(event.target.value);
    setCamposSeleccionados([]);
  };
  
  const handleToggleCampo = (campoId) => {
    if (camposSeleccionados.includes(campoId)) {
      setCamposSeleccionados(camposSeleccionados.filter(id => id !== campoId));
    } else {
      setCamposSeleccionados([...camposSeleccionados, campoId]);
    }
  };
  
  const handleConfiguracionChange = (campo, valor) => {
    setConfiguracionReporte({
      ...configuracionReporte,
      [campo]: valor
    });
  };
  
  const handleVolver = () => {
    navigate('/reportes');
  };
  
  const handleGenerarReporte = async () => {
    if (!entidadSeleccionada) {
      setError('Debe seleccionar una entidad para generar el reporte');
      return;
    }
    
    if (camposSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un campo para el reporte');
      return;
    }
    
    try {
      setGenerando(true);
      const reporteConfig = {
        entidad: entidadSeleccionada,
        campos: camposSeleccionados,
        filtros: filtros.filter(f => f.valor)
      };
      
      const reporte = await reporteService.generarReportePersonalizado(reporteConfig);
      setReporteGenerado(reporte);
      setSuccess('Reporte generado correctamente');
    } catch (err) {
      setError('Error al generar reporte: ' + err.message);
    } finally {
      setGenerando(false);
    }
  };
  
  const handleOpenDialog = () => {
    if (configuracionReporte.nombre.trim() === '') {
      setConfiguracionReporte({
        ...configuracionReporte,
        nombre: `Reporte de ${entidades.find(e => e.id === entidadSeleccionada)?.nombre || 'personalizado'}`
      });
    }
    setOpenDialog(true);
  };
  
  const handleGuardarReporte = async () => {
    if (configuracionReporte.nombre.trim() === '') {
      setError('El nombre del reporte es obligatorio');
      return;
    }
    
    try {
      setGuardando(true);
      const reporteConfig = {
        nombre: configuracionReporte.nombre,
        descripcion: configuracionReporte.descripcion,
        categoria: configuracionReporte.categoria,
        entidad: entidadSeleccionada,
        campos: camposSeleccionados,
        filtros: filtros.filter(f => f.valor)
      };
      
      await reporteService.guardarReportePredefinido(reporteConfig);
      setSuccess('Reporte guardado correctamente');
      setOpenDialog(false);
      
      // Redirigir a la lista de reportes después de guardar
      setTimeout(() => {
        navigate('/reportes');
      }, 2000);
    } catch (err) {
      setError('Error al guardar reporte: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };
  
  const handleExportarExcel = async () => {
    try {
      setLoading(true);
      // Crear configuración para exportar
      const reporteConfig = {
        entidad: entidadSeleccionada,
        campos: camposSeleccionados,
        filtros: filtros.filter(f => f.valor),
        formato: 'excel'
      };
      
      const blob = await reporteService.generarReportePersonalizado(reporteConfig);
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${entidadSeleccionada}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Reporte exportado a Excel correctamente');
    } catch (err) {
      setError('Error al exportar a Excel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportarPDF = async () => {
    try {
      setLoading(true);
      // Crear configuración para exportar
      const reporteConfig = {
        entidad: entidadSeleccionada,
        campos: camposSeleccionados,
        filtros: filtros.filter(f => f.valor),
        formato: 'pdf'
      };
      
      const blob = await reporteService.generarReportePersonalizado(reporteConfig);
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${entidadSeleccionada}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Reporte exportado a PDF correctamente');
    } catch (err) {
      setError('Error al exportar a PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFiltroChange = (filtroId, valor) => {
    setFiltros(filtros.map(filtro => 
      filtro.id === filtroId ? { ...filtro, valor } : filtro
    ));
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleVolver} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Generador de Informes
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleOpenDialog}
              disabled={!entidadSeleccionada || camposSeleccionados.length === 0}
              sx={{ mr: 1 }}
            >
              Guardar
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PlayArrowIcon />}
              onClick={handleGenerarReporte}
              disabled={!entidadSeleccionada || camposSeleccionados.length === 0 || generando}
            >
              {generando ? <CircularProgress size={24} color="inherit" /> : 'Generar Informe'}
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Cree informes personalizados seleccionando los datos que desea visualizar y aplicando filtros.
        </Typography>
        <Divider />
      </Box>
      
      {/* Alertas de éxito o error */}
      {error && (
        <AlertMessage 
          severity="error" 
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {success && (
        <AlertMessage 
          severity="success" 
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}
      
      {/* Configuración del reporte */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              1. Origen de Datos
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="entidad-label">Seleccione entidad</InputLabel>
              <Select
                labelId="entidad-label"
                id="entidad-select"
                value={entidadSeleccionada}
                label="Seleccione entidad"
                onChange={handleEntidadChange}
              >
                {entidades.map((entidad) => (
                  <MenuItem key={entidad.id} value={entidad.id}>
                    {entidad.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {entidadSeleccionada && (
              <>
                <Typography variant="h6" gutterBottom>
                  2. Seleccione Campos
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <FormGroup>
                    {camposDisponibles.map((campo) => (
                      <FormControlLabel
                        key={campo.id}
                        control={
                          <Checkbox 
                            checked={camposSeleccionados.includes(campo.id)} 
                            onChange={() => handleToggleCampo(campo.id)}
                          />
                        }
                        label={campo.nombre}
                      />
                    ))}
                  </FormGroup>
                )}
              </>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              3. Filtros
            </Typography>
            {entidadSeleccionada && filtros.length > 0 ? (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography><TuneIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Configurar filtros</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {filtros.map((filtro) => (
                      <Grid item xs={12} sm={6} key={filtro.id}>
                        {filtro.tipo === 'texto' && (
                          <TextField
                            label={filtro.nombre}
                            fullWidth
                            value={filtro.valor || ''}
                            onChange={(e) => handleFiltroChange(filtro.id, e.target.value)}
                          />
                        )}
                        {filtro.tipo === 'select' && (
                          <FormControl fullWidth>
                            <InputLabel id={`${filtro.id}-label`}>{filtro.nombre}</InputLabel>
                            <Select
                              labelId={`${filtro.id}-label`}
                              value={filtro.valor || ''}
                              label={filtro.nombre}
                              onChange={(e) => handleFiltroChange(filtro.id, e.target.value)}
                            >
                              <MenuItem value="">Todos</MenuItem>
                              {filtro.opciones?.map((opcion) => (
                                <MenuItem key={opcion.valor} value={opcion.valor}>
                                  {opcion.etiqueta}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Seleccione una entidad para configurar filtros.
              </Typography>
            )}
          </Paper>
          
          {/* Vista previa de configuración */}
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vista Previa de la Configuración
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Entidad:</Typography>
                <Chip 
                  label={entidades.find(e => e.id === entidadSeleccionada)?.nombre || 'No seleccionada'} 
                  color="primary" 
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Campos seleccionados: {camposSeleccionados.length}</Typography>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {camposSeleccionados.map(campoId => {
                    const campo = camposDisponibles.find(c => c.id === campoId);
                    return campo ? (
                      <Chip 
                        key={campo.id} 
                        label={campo.nombre} 
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                    ) : null;
                  })}
                  {camposSeleccionados.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No hay campos seleccionados
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Filtros aplicados:</Typography>
                <Box sx={{ mt: 1 }}>
                  {filtros.filter(f => f.valor).length > 0 ? (
                    <List dense>
                      {filtros.filter(f => f.valor).map(filtro => (
                        <ListItem key={filtro.id}>
                          <ListItemIcon sx={{ minWidth: '30px' }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${filtro.nombre}: ${
                              filtro.tipo === 'select' 
                                ? filtro.opciones?.find(o => o.valor === filtro.valor)?.etiqueta 
                                : filtro.valor
                            }`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay filtros aplicados
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Resultados del reporte generado */}
      {reporteGenerado && (
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Resultados del Informe
            </Typography>
            <Box>
              <Tooltip title="Exportar a Excel">
                <IconButton 
                  color="primary" 
                  onClick={handleExportarExcel}
                  disabled={loading}
                  sx={{ mr: 1 }}
                >
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Exportar a PDF">
                <IconButton 
                  color="secondary" 
                  onClick={handleExportarPDF}
                  disabled={loading}
                >
                  <PictureAsPdfIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {reporteGenerado.columnas && reporteGenerado.filas && (
            <DataTable
              columns={reporteGenerado.columnas}
              data={reporteGenerado.filas}
              initialOrderBy={reporteGenerado.columnas[0]?.id || ''}
              initialOrder="asc"
              defaultRowsPerPage={10}
            />
          )}
          
          {(!reporteGenerado.columnas || !reporteGenerado.filas || reporteGenerado.filas.length === 0) && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6">
                No hay datos disponibles
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Intente cambiar los filtros o seleccionar otra entidad para obtener resultados.
              </Typography>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Diálogo para guardar el reporte */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Guardar Informe</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            label="Nombre del informe"
            type="text"
            fullWidth
            value={configuracionReporte.nombre}
            onChange={(e) => handleConfiguracionChange('nombre', e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="descripcion"
            label="Descripción"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={configuracionReporte.descripcion}
            onChange={(e) => handleConfiguracionChange('descripcion', e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel id="categoria-label">Categoría</InputLabel>
            <Select
              labelId="categoria-label"
              id="categoria-select"
              value={configuracionReporte.categoria}
              label="Categoría"
              onChange={(e) => handleConfiguracionChange('categoria', e.target.value)}
            >
              <MenuItem value="General">General</MenuItem>
              <MenuItem value="Proyectos">Proyectos</MenuItem>
              <MenuItem value="Clientes">Clientes</MenuItem>
              <MenuItem value="Finanzas">Finanzas</MenuItem>
              <MenuItem value="Ventas">Ventas</MenuItem>
              <MenuItem value="Cursos">Cursos</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardarReporte}
            color="primary"
            disabled={guardando || !configuracionReporte.nombre}
          >
            {guardando ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GeneradorReportes; 