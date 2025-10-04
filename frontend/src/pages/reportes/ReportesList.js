import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { reporteService } from '../../services';
import { DataTable, AlertMessage, LoadingIndicator, Confirm } from '../../components/common';

const ReportesList = () => {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reporteToDelete, setReporteToDelete] = useState(null);
  const [exportarDialogOpen, setExportarDialogOpen] = useState(false);
  const [reporteToExport, setReporteToExport] = useState(null);
  const [ejecutandoDialogOpen, setEjecutandoDialogOpen] = useState(false);
  const [reporteEjecutandose, setReporteEjecutandose] = useState(null);

  useEffect(() => {
    const cargarReportes = async () => {
      try {
        setLoading(true);
        const data = await reporteService.getReportesPredefinidos();
        setReportes(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los reportes predefinidos. ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarReportes();
  }, []);

  const handleNuevoReporte = () => {
    navigate('/reportes/generador');
  };

  const handleVerReporte = async (id) => {
    try {
      // Ejecutar el template y mostrar progreso en modal
      const template = reportes.find(r => r.id === id);
      if (!template) return;

      setReporteEjecutandose(template);
      setEjecutandoDialogOpen(true);

      // Crear configuración del reporte basada en el template
      const reporteConfig = {
        entidad: template.opciones_configuracion?.entidad || 'proyectos',
        campos: template.opciones_configuracion?.campos || ['id', 'nombre'],
        filtros: template.opciones_configuracion?.filtros || {},
        nombre: template.nombre,
        descripcion: `Ejecutado desde template: ${template.nombre}`
      };

      // Generar el reporte
      const response = await reporteService.generarReportePersonalizado(reporteConfig);

      // Esperar un poco para que el reporte se procese
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar estado del reporte
      let estado = 'generando';
      let intentos = 0;
      while (estado === 'generando' && intentos < 10) {
        try {
          const estadoResponse = await reporteService.getEstadoReporte(response.reporte_id);
          estado = estadoResponse.estado;
          if (estado === 'completado') break;
          await new Promise(resolve => setTimeout(resolve, 1000));
          intentos++;
        } catch (e) {
          break;
        }
      }

      if (estado === 'completado') {
        // Redirigir a la página de resultados
        navigate(`/reportes/${response.reporte_id}`);
      } else {
        setError('El reporte está tardando más de lo esperado. Puede verificar el progreso en la página de reportes.');
        setEjecutandoDialogOpen(false);
      }

    } catch (error) {
      setError('Error al ejecutar el reporte: ' + error.message);
      setEjecutandoDialogOpen(false);
    }
  };

  const handleExportarDialog = (reporte) => {
    setReporteToExport(reporte);
    setExportarDialogOpen(true);
  };

  const handleExportarExcel = async () => {
    try {
      setLoading(true);
      const blob = await reporteService.exportarExcel(reporteToExport.id);
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reporteToExport.nombre}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Reporte exportado a Excel correctamente');
      setExportarDialogOpen(false);
    } catch (err) {
      setError('Error al exportar a Excel. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarPDF = async () => {
    try {
      setLoading(true);
      const blob = await reporteService.exportarPDF(reporteToExport.id);
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reporteToExport.nombre}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Reporte exportado a PDF correctamente');
      setExportarDialogOpen(false);
    } catch (err) {
      setError('Error al exportar a PDF. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (reporte) => {
    setReporteToDelete(reporte);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await reporteService.eliminarReportePredefinido(reporteToDelete.id);
      setReportes(reportes.filter(r => r.id !== reporteToDelete.id));
      setSuccess('Reporte eliminado correctamente');
      setConfirmOpen(false);
    } catch (err) {
      setError('Error al eliminar el reporte. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderReporteCard = (reporte) => (
    <Card 
      key={reporte.id} 
      sx={{ 
        mb: 2, 
        border: '1px solid #eaeaea',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderColor: 'primary.main'
        }
      }}
    >
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" component="div" gutterBottom>
              {reporte.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {reporte.descripcion}
            </Typography>
            <Box mt={1}>
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
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' }}}>
            <Tooltip title="Generar reporte y ver resultados">
              <IconButton 
                color="primary" 
                onClick={() => handleVerReporte(reporte.id)}
                aria-label="ejecutar"
              >
                <PlayArrowIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exportar">
              <IconButton 
                color="success" 
                onClick={() => handleExportarDialog(reporte)}
                aria-label="exportar"
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton 
                color="error" 
                onClick={() => handleDeleteClick(reporte)}
                aria-label="eliminar"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading && reportes.length === 0) {
    return <LoadingIndicator />;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Informes Predefinidos
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleNuevoReporte}
          >
            Nuevo Informe
          </Button>
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

      {/* Lista de informes */}
      <Box mt={3}>
        {reportes.length > 0 ? (
          reportes.map(reporte => renderReporteCard(reporte))
        ) : (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No hay informes predefinidos
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Cree un nuevo informe personalizado para comenzar.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNuevoReporte}
              sx={{ mt: 2 }}
            >
              Crear Informe
            </Button>
          </Card>
        )}
      </Box>

      {/* Diálogo de confirmación para eliminar */}
      <Confirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar informe"
        description={`¿Está seguro de que desea eliminar el informe "${reporteToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />

      {/* Diálogo de ejecución de reporte */}
      <Dialog open={ejecutandoDialogOpen} onClose={() => setEjecutandoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ejecutando Reporte</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Generando reporte...
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {reporteEjecutandose && (
                <>Procesando: <strong>{reporteEjecutandose.nombre}</strong></>
              )}
              <br />
              Esto puede tomar unos segundos.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Diálogo para exportar */}
      <Dialog open={exportarDialogOpen} onClose={() => setExportarDialogOpen(false)}>
        <DialogTitle>Exportar informe</DialogTitle>
        <DialogContent>
          <Typography>
            Seleccione el formato de exportación para el informe "{reporteToExport?.nombre}".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportarDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleExportarExcel} 
            color="primary" 
            startIcon={<FileDownloadIcon />}
          >
            Excel
          </Button>
          <Button 
            onClick={handleExportarPDF} 
            color="secondary" 
            startIcon={<PictureAsPdfIcon />}
          >
            PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReportesList; 