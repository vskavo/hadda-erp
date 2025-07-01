import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import clienteService from '../../services/clienteService'; // Asegúrate que la ruta sea correcta
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const HoldingsListPage = () => {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [filtroHolding, setFiltroHolding] = useState('');
  const [holdingsUnicos, setHoldingsUnicos] = useState([]);

  useEffect(() => {
    const fetchHoldings = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await clienteService.getHoldingsSummary();
        setHoldings(data);
      } catch (err) {
        setError(err.message || 'Error al cargar la información de holdings. Intente nuevamente.');
        console.error("Error fetching holdings summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  useEffect(() => {
    if (holdings && holdings.length > 0) {
      const holdingsNombres = holdings.map(h => h.nombreHolding).filter((v, i, a) => a.indexOf(v) === i);
      setHoldingsUnicos(holdingsNombres);
    }
  }, [holdings]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  // Por ahora, los botones son placeholders
  const handleViewDetails = (holdingName) => {
    navigate(`/clientes/holdings-summary/${encodeURIComponent(holdingName)}/detalles`);
  };

  const handleEditHolding = (holdingName) => {
    // TODO: Implementar edición del holding
    console.log('Editar holding:', holdingName);
    // navigate(`/clientes/holdings/editar/${holdingName}`); // Ejemplo de ruta futura
  };

  const holdingsFiltrados = filtroHolding
    ? holdings.filter(h => h.nombreHolding === filtroHolding)
    : holdings;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button variant="outlined" onClick={() => navigate('/clientes')} startIcon={<ArrowBackIcon />} sx={{ mr: 2 }}>
          Volver a Clientes
        </Button>
        <Typography variant="h4" component="h1">
          Holdings
        </Typography>
      </Box>

      {/* Filtro de holding */}
      <Box sx={{ mb: 3, maxWidth: 320 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Filtrar por Holding</InputLabel>
          <Select
            value={filtroHolding}
            label="Filtrar por Holding"
            onChange={e => setFiltroHolding(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {holdingsUnicos.map(h => (
              <MenuItem key={h} value={h}>{h}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && holdingsFiltrados.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">
            No se encontraron holdings para mostrar.
          </Typography>
        </Paper>
      )}

      {!loading && !error && holdingsFiltrados.length > 0 && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="tabla de holdings">
            <TableHead sx={{ backgroundColor: 'grey.200' }}>
              <TableRow>
                <TableCell>Nombre del Holding</TableCell>
                <TableCell align="right">Ventas Totales</TableCell>
                <TableCell align="right">Cantidad de Empresas</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holdingsFiltrados.map((holding) => (
                <TableRow
                  key={holding.nombreHolding}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {holding.nombreHolding}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(holding.ventasTotales)}</TableCell>
                  <TableCell align="right">{holding.cantidadEmpresas}</TableCell>
                  <TableCell align="center">
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={() => handleViewDetails(holding.nombreHolding)}
                      sx={{ mr: 1 }}
                    >
                      Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default HoldingsListPage; 