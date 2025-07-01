import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataTable, EmptyState, LoadingIndicator, AlertMessage, Confirm } from '../../components/common';
import axios from 'axios';

const VentasList = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ventaToDelete, setVentaToDelete] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ventas');
      setVentas(response.data);
      setError('');
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError('Error al cargar ventas: ' + (err.response?.data?.message || err.message));
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (venta) => {
    setVentaToDelete(venta);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!ventaToDelete) return;
    
    try {
      await axios.delete(`/api/ventas/${ventaToDelete.id}`);
      setSuccessMessage(`Venta ${ventaToDelete.numero_venta || ventaToDelete.id} eliminada correctamente`);
      fetchVentas();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al eliminar la venta:', err);
      setError('Error al eliminar la venta: ' + (err.response?.data?.message || err.message));
    } finally {
      setShowDeleteConfirm(false);
      setVentaToDelete(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'en_proceso': return 'info';
      case 'completada': return 'success';
      case 'facturada': return 'primary';
      case 'anulada': return 'error';
      default: return 'default';
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En Proceso';
      case 'completada': return 'Completada';
      case 'facturada': return 'Facturada';
      case 'anulada': return 'Anulada';
      default: return estado;
    }
  };

  const filtrarVentas = () => {
    if (!filtroEstado) return ventas;
    return ventas.filter(venta => venta.estado === filtroEstado);
  };

  const columns = [
    {
      id: 'numero_venta',
      label: 'Número',
      format: (value, row) => value || `Venta #${row.id}`
    },
    {
      id: 'cliente',
      label: 'Cliente',
      format: (value) => value?.razon_social || 'N/A'
    },
    {
      id: 'fecha_venta',
      label: 'Fecha',
      format: (value) => formatDate(value)
    },
    {
      id: 'monto_total',
      label: 'Monto Total',
      format: (value) => formatCurrency(value)
    },
    {
      id: 'estado',
      label: 'Estado',
      format: (value) => (
        <Chip
          label={getEstadoLabel(value)}
          color={getEstadoColor(value)}
          size="small"
        />
      )
    }
  ];

  const ventasFiltradas = filtrarVentas();

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Ventas
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/ventas/nueva')}
          >
            Nueva Venta
          </Button>
        </Box>

        {error && <AlertMessage type="error" message={error} />}
        {successMessage && <AlertMessage type="success" message={successMessage} />}

        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="estado-filter-label">Filtrar por Estado</InputLabel>
            <Select
              labelId="estado-filter-label"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              label="Filtrar por Estado"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pendiente">Pendiente</MenuItem>
              <MenuItem value="en_proceso">En Proceso</MenuItem>
              <MenuItem value="completada">Completada</MenuItem>
              <MenuItem value="facturada">Facturada</MenuItem>
              <MenuItem value="anulada">Anulada</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <LoadingIndicator message="Cargando ventas..." />
        ) : ventasFiltradas.length > 0 ? (
          <DataTable
            columns={columns}
            data={ventasFiltradas}
            actions={[
              {
                label: 'Ver detalles',
                icon: <VisibilityIcon />,
                onClick: (venta) => navigate(`/ventas/${venta.id}`)
              },
              {
                label: 'Editar',
                icon: <EditIcon />,
                onClick: (venta) => navigate(`/ventas/editar/${venta.id}`)
              },
              {
                label: 'Eliminar',
                icon: <DeleteIcon />,
                onClick: handleDeleteClick,
                disabled: (venta) => venta.estado === 'facturada'
              }
            ]}
            searchPlaceholder="Buscar venta..."
            searchFields={['numero_venta', 'cliente.razon_social', 'cliente.rut']}
          />
        ) : (
          <EmptyState
            type="data"
            title="No hay ventas registradas"
            message="Registra tu primera venta para comenzar a hacer seguimiento"
            actionText="Registrar venta"
            onAction={() => navigate('/ventas/nueva')}
          />
        )}
      </Paper>
      
      <Confirm
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar Venta"
        message={`¿Estás seguro de eliminar la venta ${ventaToDelete?.numero_venta || ventaToDelete?.id}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="error"
      />
    </Container>
  );
};

export default VentasList; 