import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  TextField, 
  MenuItem, 
  Chip,
  Paper,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DataTable, EmptyState } from '../../components/common';
import { facturaService } from '../../services';

const FacturasList = () => {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    search: '',
    estado: 'borrador', // Por defecto mostrar solo facturas en borrador
    cliente: '',
    proyecto: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  
  // Estados para paginación y ordenamiento
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('fecha_emision');
  const [order, setOrder] = useState('desc');
  const [totalFacturas, setTotalFacturas] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Convertir página de MUI (0-based) a API (1-based)
        const paginaAPI = page + 1;
        
        // Construir parámetros de consulta
        const params = {
          page: paginaAPI,
          limit: rowsPerPage,
          sortBy: orderBy,
          sortOrder: order,
          search: filtros.search,
          ...(filtros.estado && { estado: filtros.estado }),
          ...(filtros.cliente && { cliente_id: filtros.cliente }),
          ...(filtros.proyecto && { proyecto_id: filtros.proyecto })
        };
        
        // Llamada a la API real
        const result = await facturaService.getFacturas(params);
        setFacturas(result.facturas);
        setTotalFacturas(result.total);
        
        // Aquí se cargarían los clientes y proyectos desde sus respectivas APIs
        // Para este ejemplo, mantenemos los datos estáticos para clientes y proyectos
        setClientes([
          { id: 1, razon_social: 'Cliente 1' },
          { id: 2, razon_social: 'Cliente 2' },
          { id: 3, razon_social: 'Cliente 3' },
          { id: 4, razon_social: 'Cliente 4' },
          { id: 5, razon_social: 'Cliente 5' }
        ]);
        
        setProyectos([
          { id: 1, nombre: 'Proyecto 1' },
          { id: 2, nombre: 'Proyecto 2' },
          { id: 3, nombre: 'Proyecto 3' },
          { id: 4, nombre: 'Proyecto 4' },
          { id: 5, nombre: 'Proyecto 5' }
        ]);
      } catch (error) {
        console.error('Error al cargar facturas:', error);
        // En caso de error, mantener la interfaz funcional con un mensaje de error
        setFacturas([]);
        setTotalFacturas(0);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [page, rowsPerPage, orderBy, order, filtros]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSearchChange = (event) => {
    setFiltros({
      ...filtros,
      search: event.target.value
    });
    setPage(0);
  };

  const handleFilterChange = (event) => {
    setFiltros({
      ...filtros,
      [event.target.name]: event.target.value
    });
    setPage(0);
  };

  const toggleFiltros = () => {
    setMostrarFiltros(!mostrarFiltros);
  };

  const resetFiltros = () => {
    setFiltros({
      search: '',
      estado: 'borrador', // Por defecto mostrar solo facturas en borrador
      cliente: '',
      proyecto: ''
    });
    setPage(0);
  };

  const handleNuevaFactura = () => {
    navigate('/finanzas/facturas/nueva');
  };

  const handleVerFactura = (factura) => {
    navigate(`/finanzas/facturas/${factura.id}`);
  };

  const handleEditarFactura = (factura) => {
    navigate(`/finanzas/facturas/editar/${factura.id}`);
  };

  const columns = [
    {
      id: 'numero_factura',
      label: 'N° Factura',
      sortable: true,
      format: (value) => value || 'Pendiente'
    },
    {
      id: 'fecha_emision',
      label: 'Fecha Emisión',
      sortable: true,
      format: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })
    },
    {
      id: 'Cliente',
      label: 'Cliente',
      sortable: false,
      format: (value) => value.razon_social
    },
    {
      id: 'Proyecto',
      label: 'Proyecto',
      sortable: false,
      format: (value) => value ? value.nombre : '-'
    },
    {
      id: 'monto_total',
      label: 'Monto Total',
      sortable: true,
      format: (value) => `$${value.toLocaleString('es-CL')}`
    },
    {
      id: 'estado',
      label: 'Estado',
      sortable: true,
      format: (value) => {
        const estadoCapitalized = value.charAt(0).toUpperCase() + value.slice(1);
        return (
          <Chip 
            label={estadoCapitalized} 
            color={
              value === 'pagada' ? 'success' :
              value === 'emitida' ? 'warning' :
              value === 'borrador' ? 'info' :
              value === 'vencida' ? 'error' :
              value === 'anulada' ? 'default' :
              'default'
            }
            size="small" 
          />
        )
      }
    }
  ];

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Facturación
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleNuevaFactura}
        >
          Nueva Factura
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: mostrarFiltros ? 2 : 0 }}>
          <TextField
            variant="outlined"
            placeholder="Buscar facturas..."
            size="small"
            value={filtros.search}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, mr: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />} 
            onClick={toggleFiltros}
            sx={{ mr: 1 }}
          >
            Filtros
          </Button>
          {(filtros.estado || filtros.cliente || filtros.proyecto) && (
            <Button 
              variant="text"  
              size="small"
              onClick={resetFiltros}
            >
              Limpiar filtros
            </Button>
          )}
        </Box>
        
        {mostrarFiltros && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Estado"
                name="estado"
                value={filtros.estado}
                onChange={handleFilterChange}
                fullWidth
                size="small"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="borrador">Borrador</MenuItem>
                <MenuItem value="emitida">Emitida</MenuItem>
                <MenuItem value="pagada">Pagada</MenuItem>
                <MenuItem value="vencida">Vencida</MenuItem>
                <MenuItem value="anulada">Anulada</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Cliente"
                name="cliente"
                value={filtros.cliente}
                onChange={handleFilterChange}
                fullWidth
                size="small"
              >
                <MenuItem value="">Todos</MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    {cliente.razon_social}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Proyecto"
                name="proyecto"
                value={filtros.proyecto}
                onChange={handleFilterChange}
                fullWidth
                size="small"
              >
                <MenuItem value="">Todos</MenuItem>
                {proyectos.map((proyecto) => (
                  <MenuItem key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        )}
      </Paper>

      {facturas.length > 0 ? (
        <DataTable
          columns={columns}
          rows={facturas}
          page={page}
          rowsPerPage={rowsPerPage}
          totalItems={totalFacturas}
          loading={loading}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onRequestSort={handleRequestSort}
          orderBy={orderBy}
          order={order}
          actions={[
            {
              icon: <VisibilityIcon />,
              tooltip: 'Ver factura',
              onClick: handleVerFactura
            },
            {
              icon: <EditIcon />,
              tooltip: 'Editar factura',
              onClick: handleEditarFactura
            }
          ]}
        />
      ) : (
        <EmptyState
          icon={<ReceiptIcon sx={{ fontSize: 60 }} />}
          title="No hay facturas"
          description="No se encontraron facturas con los filtros seleccionados."
          actionText="Crear factura"
          onAction={handleNuevaFactura}
        />
      )}
    </Box>
  );
};

export default FacturasList; 