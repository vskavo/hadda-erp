import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import clienteService from '../../services/clienteService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const HoldingDetailPage = () => {
  const { nombreHolding } = useParams();
  const navigate = useNavigate();
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filtroRut, setFiltroRut] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [filtroMonto, setFiltroMonto] = useState([0, 0]);
  const [montoMinMax, setMontoMinMax] = useState([0, 0]);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(null);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(null);

  useEffect(() => {
    const fetchDetalle = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await clienteService.getHoldingSalesDetails(nombreHolding);
        setDetalle(data);
      } catch (err) {
        setError(err.message || 'Error al cargar el detalle del holding.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [nombreHolding]);

  // Calcular valores únicos para los selects y el rango de montos
  useEffect(() => {
    if (!detalle) return;
    // RUTs únicos (disponibles en el detalle)
    // const ruts = detalle.empresas.map(e => e.rut).filter(Boolean);
    // Nombres únicos (disponibles en el detalle)
    // const nombres = detalle.empresas.map(e => e.razonSocial).filter(Boolean);
    // Proyectos únicos
    const proyectos = [];
    detalle.empresas.forEach(e => {
      e.proyectos.forEach(p => {
        if (p.nombreProyecto && !proyectos.includes(p.nombreProyecto)) {
          proyectos.push(p.nombreProyecto);
        }
      });
    });
    // Montos min y max
    const montos = detalle.empresas.map(e => e.totalVentasEmpresa);
    const minMonto = Math.min(...montos, 0);
    const maxMonto = Math.max(...montos, 0);
    setMontoMinMax([minMonto, maxMonto]);
    setFiltroMonto([minMonto, maxMonto]);
  }, [detalle]);

  // Filtrar empresas según los filtros
  const empresasFiltradas = React.useMemo(() => {
    if (!detalle) return [];
    return detalle.empresas.filter(e => {
      // Filtro por RUT
      if (filtroRut && e.rut !== filtroRut) return false;
      // Filtro por nombre
      if (filtroEmpresa && e.razonSocial !== filtroEmpresa) return false;
      // Filtro por monto total
      if (e.totalVentasEmpresa < filtroMonto[0] || e.totalVentasEmpresa > filtroMonto[1]) return false;
      // Filtro por proyecto
      if (filtroProyecto) {
        const tieneProyecto = e.proyectos.some(p => p.nombreProyecto === filtroProyecto);
        if (!tieneProyecto) return false;
      }
      // Filtro por fechas (al menos una venta de la empresa debe estar en el rango)
      if (filtroFechaDesde || filtroFechaHasta) {
        const ventasEnRango = e.proyectos.some(p =>
          p.ventasEnProyecto.some(v => {
            if (!v.fechaVenta) return false;
            const fecha = new Date(v.fechaVenta);
            if (filtroFechaDesde && fecha < filtroFechaDesde) return false;
            if (filtroFechaHasta && fecha > filtroFechaHasta) return false;
            return true;
          })
        );
        if (!ventasEnRango) return false;
      }
      return true;
    });
  }, [detalle, filtroRut, filtroEmpresa, filtroMonto, filtroProyecto, filtroFechaDesde, filtroFechaHasta]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroRut('');
    setFiltroEmpresa('');
    setFiltroProyecto('');
    setFiltroMonto(montoMinMax);
    setFiltroFechaDesde(null);
    setFiltroFechaHasta(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>Volver</Button>
      </Container>
    );
  }

  if (!detalle) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button variant="outlined" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} sx={{ mr: 2 }}>
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          Detalle de Holding: {detalle.nombreHolding}
        </Typography>
      </Box>
      {/* Filtros avanzados (ahora debajo del botón de volver) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          {/* Select RUT */}
          <FormControl sx={{ minWidth: 180 }} size="small">
            <InputLabel>RUT Empresa</InputLabel>
            <Select
              value={filtroRut}
              label="RUT Empresa"
              onChange={e => setFiltroRut(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {detalle && detalle.empresas.map(e => (
                <MenuItem key={e.rut} value={e.rut}>{e.rut}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Select Nombre Empresa */}
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Nombre Empresa</InputLabel>
            <Select
              value={filtroEmpresa}
              label="Nombre Empresa"
              onChange={e => setFiltroEmpresa(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {detalle && detalle.empresas.map(e => (
                <MenuItem key={e.razonSocial} value={e.razonSocial}>{e.razonSocial}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Slider de montos */}
          <Box sx={{ minWidth: 220, px: 2 }}>
            <Typography id="slider-monto-label" gutterBottom>Monto total por empresa</Typography>
            <Slider
              value={filtroMonto}
              onChange={(_, newValue) => setFiltroMonto(newValue)}
              valueLabelDisplay="auto"
              min={montoMinMax[0]}
              max={montoMinMax[1]}
              step={1000}
              marks={[{ value: montoMinMax[0], label: formatCurrency(montoMinMax[0]) }, { value: montoMinMax[1], label: formatCurrency(montoMinMax[1]) }]}
              sx={{ width: 180 }}
            />
          </Box>
          {/* Select Proyecto */}
          <FormControl sx={{ minWidth: 180 }} size="small">
            <InputLabel>Proyecto</InputLabel>
            <Select
              value={filtroProyecto}
              label="Proyecto"
              onChange={e => setFiltroProyecto(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {detalle && detalle.empresas.flatMap(e => e.proyectos).map(p => p.nombreProyecto).filter((v, i, a) => a.indexOf(v) === i).map(nombre => (
                <MenuItem key={nombre} value={nombre}>{nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Selectores de fechas */}
          <DatePicker
            label="Desde"
            value={filtroFechaDesde}
            onChange={setFiltroFechaDesde}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
          />
          <DatePicker
            label="Hasta"
            value={filtroFechaHasta}
            onChange={setFiltroFechaHasta}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
          />
          {/* Botón limpiar filtros */}
          <Button variant="outlined" color="secondary" onClick={limpiarFiltros} sx={{ minWidth: 140 }}>
            Limpiar filtros
          </Button>
        </Box>
      </Paper>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Gran Total de Ventas del Holding:</Typography>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>{formatCurrency(detalle.granTotalVentasHolding)}</Typography>
      </Paper>
      {empresasFiltradas.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">No hay empresas asociadas a este holding con los filtros seleccionados.</Typography>
        </Paper>
      ) : (
        empresasFiltradas.map((empresa) => (
          <Accordion key={empresa.idCliente} defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Typography variant="h6">{empresa.razonSocial}</Typography>
                <Chip label={formatCurrency(empresa.totalVentasEmpresa)} color="primary" variant="outlined" sx={{ ml: 2 }} />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {empresa.proyectos.length === 0 ? (
                <Typography variant="body2">No hay ventas registradas para esta empresa.</Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Proyecto</TableCell>
                        <TableCell>Venta</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell align="right">Fecha</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {empresa.proyectos.map((proyecto) => (
                        <React.Fragment key={proyecto.idProyecto || 'sin'}>
                          {proyecto.ventasEnProyecto.map((venta, idx) => (
                            <TableRow key={venta.idVenta}>
                              <TableCell>
                                {idx === 0 ? (
                                  <strong>{proyecto.nombreProyecto}</strong>
                                ) : null}
                              </TableCell>
                              <TableCell>{venta.titulo}</TableCell>
                              <TableCell align="right">{formatCurrency(venta.montoTotal)}</TableCell>
                              <TableCell align="right">{venta.fechaVenta ? new Date(venta.fechaVenta).toLocaleDateString() : '-'}</TableCell>
                            </TableRow>
                          ))}
                          {/* Total por proyecto */}
                          <TableRow>
                            <TableCell colSpan={3} align="right"><strong>Total Proyecto</strong></TableCell>
                            <TableCell align="right"><strong>{formatCurrency(proyecto.totalVentasProyectoEmpresa)}</strong></TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Container>
  );
};

export default HoldingDetailPage; 