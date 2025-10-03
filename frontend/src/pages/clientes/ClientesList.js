import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Chip,
  TextField,
  Grid,
  IconButton,
  Collapse,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

import { 
  DataTable, 
  AlertMessage, 
  Confirm, 
  LoadingIndicator, 
  EmptyState 
} from '../../components/common';
import clienteService from '../../services/clienteService';

const ClientesList = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openStatusConfirm, setOpenStatusConfirm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    rut: '',
    holding: '',
    razonSocial: '',
    nombre: '',
    tipoCliente: '',
    activo: '',
    searchText: ''
  });
  const [filtroHolding, setFiltroHolding] = useState('');
  const [holdingsUnicos, setHoldingsUnicos] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';

  // Cargar clientes
  useEffect(() => {
    fetchClientes();
  }, []);

  // Obtener holdings únicos al cargar los clientes
  useEffect(() => {
    if (clientes && clientes.length > 0) {
      const holdings = clientes
        .map(c => c.holding)
        .filter(h => h && h.trim() !== '')
        .filter((v, i, a) => a.indexOf(v) === i);
      setHoldingsUnicos(holdings);
    }
  }, [clientes]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      // Usar el servicio de clientes en lugar de axios directamente
      const data = await clienteService.getClientes({
        limit: 1000,
        page: 1
      });
      
      // El backend devuelve un objeto con formato {total, totalPages, currentPage, clientes}
      // donde clientes es el array que necesitamos
      if (data && data.clientes) {
        // Transformamos los datos para adaptarlos al formato esperado por el componente
        const clientesFormateados = data.clientes.map(cliente => {
          // Convertimos snake_case a camelCase y añadimos propiedades derivadas
          return {
            id: cliente.id,
            // Si tiene razon_social, es una empresa
            tipoCliente: cliente.razon_social ? 'empresa' : 'persona',
            // Mapeamos las propiedades con snake_case a camelCase
            razonSocial: cliente.razon_social,
            // Añadimos una propiedad nombreCompleto para unificar el acceso
            nombreCompleto: cliente.razon_social || `${cliente.nombre || ''} ${cliente.apellido || ''}`,
            rut: cliente.rut,
            giro: cliente.giro,
            holding: cliente.holding,
            direccion: cliente.direccion,
            comuna: cliente.comuna,
            ciudad: cliente.ciudad,
            telefono: cliente.telefono,
            email: cliente.email,
            sitioWeb: cliente.sitio_web,
            contactoNombre: cliente.contacto_nombre,
            contactoCargo: cliente.contacto_cargo,
            contactoEmail: cliente.contacto_email,
            contactoTelefono: cliente.contacto_telefono,
            estado: cliente.estado,
            notas: cliente.notas,
            fechaUltimoContacto: cliente.fecha_ultimo_contacto,
            createdAt: cliente.created_at,
            updatedAt: cliente.updated_at,
            // Asumimos que estos campos no existen en empresas pero podrían existir en personas
            nombre: cliente.nombre,
            apellido: cliente.apellido,
            // Y cualquier otra propiedad que pueda ser necesaria
            activo: cliente.estado === 'activo',
            // Mantenemos una referencia al objeto original por si necesitamos más datos
            _original: cliente
          };
        });
        
        setClientes(clientesFormateados);
      } else {
        setClientes([]);
        console.error('Estructura de datos no esperada:', data);
      }
      
      setError('');
    } catch (err) {
      console.error('Error completo:', err);
      setError('Error al cargar clientes. ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación de cliente
  const handleDeleteCliente = async () => {
    try {
      await clienteService.deleteCliente(selectedCliente.id);
      setOpenDeleteConfirm(false);
      setSuccessMessage('Cliente eliminado con éxito');
      fetchClientes();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al eliminar cliente. ' + (err.response?.data?.message || ''));
    }
  };

  // Manejar cambio de estado del cliente
  const handleToggleStatus = async () => {
    try {
      const newStatus = selectedCliente.activo ? 'inactive' : 'active';
      await clienteService.updateStatus(selectedCliente.id, { status: newStatus });
      setOpenStatusConfirm(false);
      setSuccessMessage(`Cliente ${newStatus === 'active' ? 'activado' : 'desactivado'} con éxito`);
      fetchClientes();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al cambiar estado del cliente. ' + (err.response?.data?.message || ''));
    }
  };

  // Configuración de columnas para la tabla
  const baseColumns = [
    { 
      id: 'tipoCliente', 
      label: 'Tipo', 
      sortable: true, 
      format: (value) => value === 'empresa' ? (
        <Chip 
          icon={<BusinessIcon />} 
          label="Empresa" 
          size="small" 
          color="primary" 
          variant="outlined" 
        />
      ) : (
        <Chip 
          icon={<PersonIcon />} 
          label="Persona" 
          size="small" 
          color="secondary" 
          variant="outlined" 
        />
      )
    },
    { 
      id: 'nombreCompleto',
      label: 'Nombre / Razón Social', 
      sortable: true,
      format: (_, row) => row.tipoCliente === 'empresa' ? row.razonSocial : `${row.nombre || ''} ${row.apellido || ''}`
    },
    { id: 'rut', label: 'RUT', sortable: true },
    { id: 'holding', label: 'Holding', sortable: true },
    { 
      id: 'activo', 
      label: 'Estado', 
      sortable: true,
      format: (value) => value ? (
        <Chip 
          label="Activo" 
          color="success" 
          size="small" 
          icon={<CheckCircleIcon />} 
        />
      ) : (
        <Chip 
          label="Inactivo" 
          color="error" 
          size="small" 
          icon={<BlockIcon />} 
        />
      )
    },
  ];

  // Agregar columna de propietario solo para admin
  const columns = isAdmin ? [
    ...baseColumns.slice(0, 4),
    {
      id: 'owner',
      label: 'Propietario',
      sortable: false,
      format: (_, row) => {
        const owner = row._original?.Owner;
        return owner ? `${owner.nombre} ${owner.apellido} (${owner.email})` : '-';
      }
    },
    ...baseColumns.slice(4)
  ] : baseColumns;

  // Acciones para los clientes
  const actions = [
    { 
      label: 'Ver detalles', 
      icon: <VisibilityIcon />, 
      onClick: (cliente) => navigate(`/clientes/${cliente.id}`)
    },
    { 
      label: 'Editar', 
      icon: <EditIcon />, 
      onClick: (cliente) => navigate(`/clientes/editar/${cliente.id}`)
    },
    { 
      label: 'Eliminar', 
      icon: <DeleteIcon />, 
      onClick: (cliente) => {
        setSelectedCliente(cliente);
        setOpenDeleteConfirm(true);
      }
    },
    { 
      label: (cliente) => cliente.activo ? 'Desactivar' : 'Activar', 
      icon: (cliente) => cliente.activo ? <BlockIcon /> : <CheckCircleIcon />, 
      onClick: (cliente) => {
        setSelectedCliente(cliente);
        setOpenStatusConfirm(true);
      }
    }
  ];

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setFilters({
      rut: '',
      holding: '',
      razonSocial: '',
      nombre: '',
      tipoCliente: '',
      activo: '',
      searchText: ''
    });
  };

  // Función para manejar cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Aplicar filtros a los datos
  const filteredClientes = clientes.filter(cliente => {
    // Filtro de búsqueda general
    const searchFilter = filters.searchText === '' || 
      ['nombreCompleto', 'razonSocial', 'rut', 'holding', 'nombre', 'apellido'].some(field => {
        const value = cliente[field];
        return value && value.toString().toLowerCase().includes(filters.searchText.toLowerCase());
      });

    // Filtros específicos
    return (
      searchFilter &&
      (filters.rut === '' || cliente.rut?.toLowerCase().includes(filters.rut.toLowerCase())) &&
      (filtroHolding === '' || cliente.holding === filtroHolding) &&
      (filters.razonSocial === '' || 
        (cliente.razonSocial && cliente.razonSocial.toLowerCase().includes(filters.razonSocial.toLowerCase()))) &&
      (filters.nombre === '' || 
        (cliente.nombre && cliente.nombre.toLowerCase().includes(filters.nombre.toLowerCase()))) &&
      (filters.tipoCliente === '' || cliente.tipoCliente === filters.tipoCliente) &&
      (filters.activo === '' || 
        (filters.activo === 'true' ? cliente.activo === true : cliente.activo === false))
    );
  });

  if (loading && clientes.length === 0) {
    return <LoadingIndicator size="large" message="Cargando clientes..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" component="h1" sx={{ mb: { xs: 2, sm: 0 } }}>
          Clientes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/clientes/holdings-summary')}
            // Podrías añadir un icono si lo deseas, ej: startIcon={<BusinessIcon />}
          >
            Ver por Holding
          </Button>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/clientes/nuevo')}
        >
          Nuevo Cliente
        </Button>
        </Box>
      </Box>
      
      {/* Alertas */}
      {error && (
        <AlertMessage 
          type="error" 
          message={error} 
          show={!!error} 
          onClose={() => setError('')} 
          sx={{ mb: 2 }}
        />
      )}
      
      {successMessage && (
        <AlertMessage 
          type="success" 
          message={successMessage} 
          show={!!successMessage} 
          onClose={() => setSuccessMessage('')} 
          sx={{ mb: 2 }}
        />
      )}

      {/* Filtros unificados */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Button 
            startIcon={<FilterListIcon />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            variant="outlined"
          >
            {showAdvancedFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </Button>
          
          {(showAdvancedFilters || filters.searchText) && (
            <Button 
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              variant="text"
              color="secondary"
            >
              Limpiar filtros
            </Button>
          )}
        </Box>
        
        {/* Barra de búsqueda principal siempre visible */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, razón social, RUT o holding..."
            name="searchText"
            variant="outlined"
            size="small"
            value={filters.searchText}
            onChange={handleFilterChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: filters.searchText && (
                <IconButton 
                  size="small" 
                  onClick={() => setFilters(prev => ({ ...prev, searchText: '' }))}
                >
                  <ClearIcon />
                </IconButton>
              )
            }}
          />
        </Box>
        
        {/* Filtros avanzados en panel desplegable */}
        <Collapse in={showAdvancedFilters}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="RUT"
                    name="rut"
                    variant="outlined"
                    size="small"
                    value={filters.rut}
                    onChange={handleFilterChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl sx={{ minWidth: 180, mr: 2 }} size="small">
                    <InputLabel>Holding</InputLabel>
                    <Select
                      value={filtroHolding}
                      label="Holding"
                      onChange={e => setFiltroHolding(e.target.value)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {holdingsUnicos.map(h => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Razón Social"
                    name="razonSocial"
                    variant="outlined"
                    size="small"
                    value={filters.razonSocial}
                    onChange={handleFilterChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    name="nombre"
                    variant="outlined"
                    size="small"
                    value={filters.nombre}
                    onChange={handleFilterChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de Cliente</InputLabel>
                    <Select
                      name="tipoCliente"
                      value={filters.tipoCliente}
                      label="Tipo de Cliente"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="empresa">Empresa</MenuItem>
                      <MenuItem value="persona">Persona</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select
                      name="activo"
                      value={filters.activo}
                      label="Estado"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="true">Activo</MenuItem>
                      <MenuItem value="false">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>
      </Box>
      
      {/* Tabla de clientes */}
      {clientes.length > 0 ? (
        <Paper sx={{ width: '100%', mb: 2 }}>
          <DataTable
            columns={columns}
            rows={filteredClientes}
            title="Listado de Clientes"
            actions={actions}
            initialOrderBy="nombreCompleto"
            hideSearch={true} // Ocultar la búsqueda del DataTable
            rowsPerPageOptions={[10, 25, 50, 100, { value: -1, label: 'Todos' }]}
            defaultRowsPerPage={50} // Mostrar 50 registros por página por defecto
          />
        </Paper>
      ) : !loading ? (
        <EmptyState
          type="empty"
          title="No hay clientes registrados"
          message="Comienza creando un nuevo cliente"
          actionText="Crear Cliente"
          onAction={() => navigate('/clientes/nuevo')}
        />
      ) : null}
      
      {/* Diálogo de confirmación para eliminar */}
      <Confirm
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteCliente}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar al cliente "${selectedCliente?.tipoCliente === 'empresa' 
          ? selectedCliente?.razonSocial 
          : `${selectedCliente?.nombre} ${selectedCliente?.apellido || ''}`}"? 
          Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="error"
      />
      
      {/* Diálogo de confirmación para cambiar estado */}
      <Confirm
        open={openStatusConfirm}
        onClose={() => setOpenStatusConfirm(false)}
        onConfirm={handleToggleStatus}
        title={selectedCliente?.activo ? "Desactivar Cliente" : "Activar Cliente"}
        message={`¿Estás seguro de ${selectedCliente?.activo ? 'desactivar' : 'activar'} al cliente "${
          selectedCliente?.tipoCliente === 'empresa' 
            ? selectedCliente?.razonSocial 
            : `${selectedCliente?.nombre} ${selectedCliente?.apellido || ''}`}"?`}
        confirmText={selectedCliente?.activo ? "Desactivar" : "Activar"}
        cancelText="Cancelar"
        type={selectedCliente?.activo ? "warning" : "info"}
      />
    </Container>
  );
};

export default ClientesList; 