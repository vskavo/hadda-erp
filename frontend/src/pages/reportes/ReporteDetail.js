import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tooltip,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { reporteService } from '../../services';
import { DataTable, AlertMessage, LoadingIndicator } from '../../components/common';

const ReporteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reporte, setReporte] = useState(null);
  const [reporteData, setReporteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filtros, setFiltros] = useState({
    fechaInicio: null,
    fechaFin: null,
    estado: '',
    categoria: '',
  });

  useEffect(() => {
    const cargarReporte = async () => {
      try {
        setLoading(true);
        // Cargar definición del reporte
        const data = await reporteService.getReporteById(id);
        setReporte(data);
        
        // Prepopular fechas con mes actual si es reporte con fechas
        if (data.requiereFechas) {
          const hoy = new Date();
          const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          const ultimoDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
          
          setFiltros({
            ...filtros,
            fechaInicio: primerDiaDelMes,
            fechaFin: ultimoDiaDelMes
          });
        }
        
        // Ejecutar reporte con filtros por defecto
        await cargarDatosReporte(id, {
          fechaInicio: data.requiereFechas ? format(primerDiaDelMes, 'yyyy-MM-dd') : null,
          fechaFin: data.requiereFechas ? format(ultimoDiaDelMes, 'yyyy-MM-dd') : null,
          estado: '',
          categoria: ''
        });
        
      } catch (err) {
        setError('Error al cargar el reporte. ' + err.message);
        setLoading(false);
      }
    };

    cargarReporte();
  }, [id]);

  const cargarDatosReporte = async (reporteId, filtrosAplicar) => {
    try {
      setApplyingFilters(true);
      // Preparar filtros
      const filtrosParaEnviar = {};
      if (filtrosAplicar.fechaInicio) {
        filtrosParaEnviar.fechaInicio = typeof filtrosAplicar.fechaInicio === 'string' 
          ? filtrosAplicar.fechaInicio 
          : format(filtrosAplicar.fechaInicio, 'yyyy-MM-dd');
      }
      if (filtrosAplicar.fechaFin) {
        filtrosParaEnviar.fechaFin = typeof filtrosAplicar.fechaFin === 'string' 
          ? filtrosAplicar.fechaFin 
          : format(filtrosAplicar.fechaFin, 'yyyy-MM-dd');
      }
      if (filtrosAplicar.estado) filtrosParaEnviar.estado = filtrosAplicar.estado;
      if (filtrosAplicar.categoria) filtrosParaEnviar.categoria = filtrosAplicar.categoria;
      
      const data = await reporteService.getReporteById(reporteId, filtrosParaEnviar);
      setReporteData(data.resultados);
      setSuccess('Reporte generado correctamente');
    } catch (err) {
      setError('Error al generar el reporte. ' + err.message);
    } finally {
      setApplyingFilters(false);
      setLoading(false);
    }
  };

  const handleVolver = () => {
    navigate('/reportes');
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros({
      ...filtros,
      [campo]: valor
    });
  };

  const handleAplicarFiltros = () => {
    cargarDatosReporte(id, filtros);
  };

  const handleExportarExcel = async () => {
    try {
      setLoading(true);
      // Preparar filtros para la exportación
      const filtrosParaEnviar = {};
      if (filtros.fechaInicio) {
        filtrosParaEnviar.fechaInicio = typeof filtros.fechaInicio === 'string' 
          ? filtros.fechaInicio 
          : format(filtros.fechaInicio, 'yyyy-MM-dd');
      }
      if (filtros.fechaFin) {
        filtrosParaEnviar.fechaFin = typeof filtros.fechaFin === 'string' 
          ? filtros.fechaFin 
          : format(filtros.fechaFin, 'yyyy-MM-dd');
      }
      if (filtros.estado) filtrosParaEnviar.estado = filtros.estado;
      if (filtros.categoria) filtrosParaEnviar.categoria = filtros.categoria;
      
      const blob = await reporteService.exportarExcel(id, filtrosParaEnviar);
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reporte.nombre}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Reporte exportado a Excel correctamente');
    } catch (err) {
      setError('Error al exportar a Excel. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarPDF = async () => {
    try {
      setLoading(true);
      // Preparar filtros para la exportación
      const filtrosParaEnviar = {};
      if (filtros.fechaInicio) {
        filtrosParaEnviar.fechaInicio = typeof filtros.fechaInicio === 'string' 
          ? filtros.fechaInicio 
          : format(filtros.fechaInicio, 'yyyy-MM-dd');
      }
      if (filtros.fechaFin) {
        filtrosParaEnviar.fechaFin = typeof filtros.fechaFin === 'string' 
          ? filtros.fechaFin 
          : format(filtros.fechaFin, 'yyyy-MM-dd');
      }
      if (filtros.estado) filtrosParaEnviar.estado = filtros.estado;
      if (filtros.categoria) filtrosParaEnviar.categoria = filtros.categoria;
      
      const blob = await reporteService.exportarPDF(id, filtrosParaEnviar);
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reporte.nombre}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Reporte exportado a PDF correctamente');
    } catch (err) {
      setError('Error al exportar a PDF. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reporte) {
    return <LoadingIndicator />;
  }

  return (
    <Container maxWidth="lg">
      {reporte && (
        <>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handleVolver} sx={{ mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1">
                  {reporte.nombre}
                </Typography>
              </Box>
              <Box>
                <Tooltip title="Exportar a Excel">
                  <IconButton 
                    color="primary" 
                    onClick={handleExportarExcel}
                    disabled={loading || applyingFilters}
                    sx={{ mr: 1 }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Exportar a PDF">
                  <IconButton 
                    color="secondary" 
                    onClick={handleExportarPDF}
                    disabled={loading || applyingFilters}
                    sx={{ mr: 1 }}
                  >
                    <PictureAsPdfIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Actualizar datos">
                  <IconButton 
                    color="default" 
                    onClick={() => handleAplicarFiltros()}
                    disabled={loading || applyingFilters}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {reporte.descripcion}
            </Typography>
            <Box sx={{ mt: 1, mb: 2 }}>
              <Chip 
                size="small" 
                label={reporte.categoria} 
                color="primary" 
                variant="outlined" 
                sx={{ mr: 1 }} 
              />
              <Chip 
                size="small" 
                label={`${reporte.consultasRealizadas} consultas`} 
                color="default" 
                variant="outlined" 
              />
            </Box>
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

          {/* Sección de filtros */}
          {reporte.filtrosDisponibles && reporte.filtrosDisponibles.length > 0 && (
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Filtros
              </Typography>
              <Grid container spacing={2}>
                {reporte.requiereFechas && (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                        <DatePicker
                          label="Fecha inicio"
                          value={filtros.fechaInicio}
                          onChange={(newValue) => handleFiltroChange('fechaInicio', newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                        <DatePicker
                          label="Fecha fin"
                          value={filtros.fechaFin}
                          onChange={(newValue) => handleFiltroChange('fechaFin', newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </LocalizationProvider>
                    </Grid>
                  </>
                )}
                
                {reporte.filtrosDisponibles.includes('estado') && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="estado-label">Estado</InputLabel>
                      <Select
                        labelId="estado-label"
                        id="estado-select"
                        value={filtros.estado}
                        label="Estado"
                        onChange={(e) => handleFiltroChange('estado', e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {reporte.opcionesEstado?.map((opcion) => (
                          <MenuItem key={opcion.valor} value={opcion.valor}>
                            {opcion.etiqueta}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                
                {reporte.filtrosDisponibles.includes('categoria') && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="categoria-label">Categoría</InputLabel>
                      <Select
                        labelId="categoria-label"
                        id="categoria-select"
                        value={filtros.categoria}
                        label="Categoría"
                        onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {reporte.opcionesCategorias?.map((opcion) => (
                          <MenuItem key={opcion.valor} value={opcion.valor}>
                            {opcion.etiqueta}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAplicarFiltros}
                    disabled={applyingFilters}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    {applyingFilters ? <CircularProgress size={24} /> : 'Aplicar Filtros'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Resultados del reporte */}
          {applyingFilters ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : reporteData ? (
            <Paper elevation={0} variant="outlined" sx={{ overflow: 'hidden' }}>
              {reporteData.columnas && reporteData.filas && (
                <DataTable
                  columns={reporteData.columnas}
                  data={reporteData.filas}
                  initialOrderBy={reporteData.columnas[0]?.id || ''}
                  initialOrder="asc"
                  defaultRowsPerPage={10}
                />
              )}
              {(!reporteData.columnas || !reporteData.filas || reporteData.filas.length === 0) && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6">
                    No hay datos disponibles
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Intente cambiar los filtros para obtener resultados.
                  </Typography>
                </Box>
              )}
            </Paper>
          ) : null}
        </>
      )}
    </Container>
  );
};

export default ReporteDetail; 