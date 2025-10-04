import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorIcon from '@mui/icons-material/Error';
import { reporteService } from '../../services';
import { AlertMessage } from '../../components/common';

const ReporteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reporte, setReporte] = useState(null);
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Cargar datos del reporte
  useEffect(() => {
    cargarReporte();
  }, [id]);

    const cargarReporte = async () => {
      try {
        setLoading(true);
      const reporteData = await reporteService.getReporteById(id);
      setReporte(reporteData);

      // Si el reporte está completado, cargar los datos
      if (reporteData.estado === 'completado') {
        await cargarDatosReporte();
      }
      } catch (err) {
      setError('Error al cargar el reporte: ' + err.message);
    } finally {
        setLoading(false);
      }
    };

  const cargarDatosReporte = async () => {
    try {
      setLoadingDatos(true);
      const datosReporte = await reporteService.getDatosReporte(id);
      setDatos(datosReporte);
    } catch (err) {
      setError('Error al cargar los datos del reporte: ' + err.message);
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleVolver = () => {
    navigate('/reportes');
  };

  const handleActualizarEstado = async () => {
    try {
      const estadoData = await reporteService.getEstadoReporte(id);
      setReporte(prev => ({ ...prev, ...estadoData }));

      // Si ahora está completado y no tenemos datos, cargarlos
      if (estadoData.estado === 'completado' && !datos) {
        await cargarDatosReporte();
      }
    } catch (err) {
      setError('Error al actualizar estado: ' + err.message);
    }
  };

  const handleExportarExcel = async () => {
    try {
      setExportando(true);
      const blob = await reporteService.exportarExcel(id);
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reporte.nombre || 'reporte'}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Reporte exportado a Excel correctamente');
    } catch (err) {
      setError('Error al exportar a Excel: ' + err.message);
    } finally {
      setExportando(false);
    }
  };

  const handleExportarPDF = async () => {
    try {
      setExportando(true);
      const blob = await reporteService.exportarPDF(id);
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reporte.nombre || 'reporte'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Reporte exportado a PDF correctamente');
    } catch (err) {
      setError('Error al exportar a PDF: ' + err.message);
    } finally {
      setExportando(false);
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'completado':
        return <CheckCircleIcon color="success" />;
      case 'generando':
        return <HourglassEmptyIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <HourglassEmptyIcon color="default" />;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'completado':
        return 'success';
      case 'generando':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!reporte) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          Reporte no encontrado
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handleVolver} sx={{ mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1">
              Detalle del Reporte
                </Typography>
              </Box>
              <Box>
            {reporte.estado === 'generando' && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleActualizarEstado}
                sx={{ mr: 1 }}
              >
                Actualizar Estado
              </Button>
            )}
            {reporte.estado === 'completado' && (
              <>
                <Tooltip title="Exportar a Excel">
                  <IconButton 
                    color="primary" 
                    onClick={handleExportarExcel}
                    disabled={exportando}
                    sx={{ mr: 1 }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Exportar a PDF">
                  <IconButton 
                    color="secondary" 
                    onClick={handleExportarPDF}
                    disabled={exportando}
                  >
                    <PictureAsPdfIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
              </Box>
            </Box>
            <Divider />
          </Box>

      {/* Alertas */}
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

      {/* Información del reporte */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
              Información del Reporte
              </Typography>
              <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Nombre:</Typography>
                <Typography variant="body1">{reporte.nombre}</Typography>
                    </Grid>
              {reporte.descripcion && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Descripción:</Typography>
                  <Typography variant="body1">{reporte.descripcion}</Typography>
                  </Grid>
                )}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Tipo:</Typography>
                <Typography variant="body1">{reporte.tipo_reporte}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Módulo:</Typography>
                <Typography variant="body1">{reporte.modulo}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Estado:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  {getEstadoIcon(reporte.estado)}
                  <Chip
                    label={reporte.estado}
                    color={getEstadoColor(reporte.estado)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Formato:</Typography>
                <Typography variant="body1">{reporte.formato?.toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Fecha de Generación:</Typography>
                <Typography variant="body1">
                  {new Date(reporte.fecha_generacion).toLocaleDateString('es-ES')}
                </Typography>
              </Grid>
              {reporte.usuario && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Generado por:</Typography>
                  <Typography variant="body1">
                    {reporte.usuario.nombre} {reporte.usuario.apellido}
                  </Typography>
                  </Grid>
                )}
            </Grid>
          </Paper>

          {/* Template information */}
          {reporte.ReporteTemplate && (
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Plantilla Utilizada
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Nombre:</Typography>
                  <Typography variant="body1">{reporte.ReporteTemplate.nombre}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Descripción:</Typography>
                  <Typography variant="body1">{reporte.ReporteTemplate.descripcion}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Tipo:</Typography>
                  <Typography variant="body1">{reporte.ReporteTemplate.tipo_reporte}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Módulo:</Typography>
                  <Typography variant="body1">{reporte.ReporteTemplate.modulo}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Parámetros
            </Typography>
            {reporte.parametros && Object.keys(reporte.parametros).length > 0 ? (
              <Box>
                {Object.entries(reporte.parametros).map(([key, value]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Array.isArray(value) ? value.join(', ') :
                       typeof value === 'object' ? JSON.stringify(value, null, 2) :
                       String(value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay parámetros configurados
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Datos del reporte */}
      {reporte.estado === 'completado' && datos && (
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Datos del Reporte
          </Typography>

          {loadingDatos ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : datos.datos && datos.datos.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {reporte.parametros.campos.map((campo) => (
                      <TableCell key={campo}>
                        <Typography variant="subtitle2">
                          {campo.replace(/_/g, ' ').replace(/\./g, ' - ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datos.datos.slice(0, 100).map((fila, index) => (
                    <TableRow key={index}>
                      {reporte.parametros.campos.map((campo) => {
                        // Obtener valor anidado (ej: Owner.nombre)
                        const valor = campo.split('.').reduce((obj, key) => {
                          return obj && obj[key] !== undefined ? obj[key] : null;
                        }, fila);
                        
                        return (
                          <TableCell key={campo}>
                            {valor !== null && valor !== undefined 
                              ? (typeof valor === 'object' 
                                  ? JSON.stringify(valor) 
                                  : String(valor))
                              : '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {datos.datos.length > 100 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Mostrando las primeras 100 filas de {datos.datos.length} totales
                  </Typography>
                </Box>
              )}
            </TableContainer>
          ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6">
                    No hay datos disponibles
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                El reporte no contiene datos para mostrar.
                  </Typography>
                </Box>
              )}
            </Paper>
      )}

      {/* Estados de procesamiento */}
      {reporte.estado === 'generando' && (
        <Paper elevation={0} variant="outlined" sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <HourglassEmptyIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Generando Reporte
          </Typography>
          <Typography variant="body2" color="text.secondary">
            El reporte se está generando en segundo plano. Puede tardar unos minutos.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleActualizarEstado}
            sx={{ mt: 2 }}
          >
            Actualizar Estado
          </Button>
        </Paper>
      )}

      {reporte.estado === 'error' && (
        <Paper elevation={0} variant="outlined" sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="error">
            Error en la Generación
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ocurrió un error al generar el reporte. Por favor, inténtelo nuevamente.
          </Typography>
          {reporte.metadata?.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {reporte.metadata.error}
            </Alert>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default ReporteDetail; 