import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Grid,
  MenuItem,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { DataTable, EmptyState, Confirm } from '../../../components/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ingresoService, egresoService, proyectoService, clienteService } from '../../../services';
import LoadingIndicator from '../../../components/common/LoadingIndicator';

// Componente para la vista de Proyecciones (ingresos/egresos de proyectos)
const ProyeccionesView = () => {
  const navigate = useNavigate();

  // Estados para la gestión de pestañas
  const [tabValue, setTabValue] = useState(0);

  // Estados para los datos
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [cuentasBancarias, setCuentasBancarias] = useState([]);

  // Estados para el filtrado
  const [filtrosIngresos, setFiltrosIngresos] = useState({
    search: '',
    estado: '',
    cliente: '',
    proyecto: '',
    tipo_ingreso: '',
    cuenta_bancaria: '',
    desde: '',
    hasta: ''
  });

  const [filtrosEgresos, setFiltrosEgresos] = useState({
    search: '',
    estado: '',
    proyecto: '',
    proveedor: '',
    categoria: '',
    cuenta_bancaria: '',
    desde: '',
    hasta: ''
  });

  const [mostrarFiltrosIngresos, setMostrarFiltrosIngresos] = useState(false);
  const [mostrarFiltrosEgresos, setMostrarFiltrosEgresos] = useState(false);

  // Estados para paginación y ordenamiento
  const [pageIngresos, setPageIngresos] = useState(0);
  const [pageEgresos, setPageEgresos] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderByIngresos, setOrderByIngresos] = useState('fecha');
  const [orderByEgresos, setOrderByEgresos] = useState('fecha');
  const [order, setOrder] = useState('desc');
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalEgresos, setTotalEgresos] = useState(0);

  // Estado para modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar clientes reales desde la API
        try {
          const clientesResponse = await clienteService.getClientes({ limit: 1000 });
          setClientes(clientesResponse.clientes || clientesResponse.rows || []);
        } catch (error) {
          console.error('Error al cargar clientes:', error);
          setClientes([]);
        }

        // Cargar proyectos reales desde la API
        try {
          const proyectosResponse = await proyectoService.getProyectos({ limit: 1000 });
          setProyectos(proyectosResponse.proyectos || proyectosResponse.rows || []);
        } catch (error) {
          console.error('Error al cargar proyectos:', error);
          setProyectos([]);
        }

        setCuentasBancarias([
          { id: 1, nombre: 'Cuenta Corriente Principal', banco: 'Banco Estado' },
          { id: 2, nombre: 'Cuenta Ahorro', banco: 'Banco Santander' },
          { id: 3, nombre: 'Cuenta Proyectos', banco: 'Banco BCI' }
        ]);

        // Cargar ingresos desde la API
        if (tabValue === 0) {
          const paginaAPI = pageIngresos + 1;

          // Preparar parámetros de consulta para ingresos
          const paramsIngresos = {
            page: paginaAPI,
            limit: rowsPerPage,
            sortBy: orderByIngresos,
            sortOrder: order,
            search: filtrosIngresos.search,
            ...(filtrosIngresos.estado && { estado: filtrosIngresos.estado }),
            ...(filtrosIngresos.cliente && { cliente_id: filtrosIngresos.cliente }),
            ...(filtrosIngresos.proyecto && { proyecto_id: filtrosIngresos.proyecto }),
            ...(filtrosIngresos.tipo_ingreso && { tipo_ingreso: filtrosIngresos.tipo_ingreso }),
            ...(filtrosIngresos.cuenta_bancaria && { cuenta_bancaria_id: filtrosIngresos.cuenta_bancaria }),
            ...(filtrosIngresos.desde && { desde: filtrosIngresos.desde }),
            ...(filtrosIngresos.hasta && { hasta: filtrosIngresos.hasta })
          };

          try {
            const resultadoIngresos = await ingresoService.getIngresos(paramsIngresos);
            // Mapear los datos para que cada ingreso tenga 'cliente' y 'proyecto' como objetos
            const ingresosMapeados = resultadoIngresos.ingresos.map((ingreso) => ({
              ...ingreso,
              cliente: ingreso.Cliente || null,
              proyecto: ingreso.Proyecto || null,
            }));
            setIngresos(ingresosMapeados);
            setTotalIngresos(resultadoIngresos.total);
          } catch (error) {
            console.error('Error al cargar ingresos:', error);
            // Si hay error, mostrar datos vacíos
            setIngresos([]);
            setTotalIngresos(0);
          }
        }

        // Cargar egresos desde la API
        if (tabValue === 1) {
          const paginaAPI = pageEgresos + 1;

          // Preparar parámetros de consulta para egresos
          const paramsEgresos = {
            page: paginaAPI,
            limit: rowsPerPage,
            sortBy: orderByEgresos,
            sortOrder: order,
            search: filtrosEgresos.search,
            ...(filtrosEgresos.estado && { estado: filtrosEgresos.estado }),
            ...(filtrosEgresos.proyecto && { proyecto_id: filtrosEgresos.proyecto }),
            ...(filtrosEgresos.proveedor && { proveedor: filtrosEgresos.proveedor }),
            ...(filtrosEgresos.categoria && { categoria: filtrosEgresos.categoria }),
            ...(filtrosEgresos.cuenta_bancaria && { cuenta_bancaria_id: filtrosEgresos.cuenta_bancaria }),
            ...(filtrosEgresos.desde && { desde: filtrosEgresos.desde }),
            ...(filtrosEgresos.hasta && { hasta: filtrosEgresos.hasta })
          };

          try {
            const resultadoEgresos = await egresoService.getEgresos(paramsEgresos);
            // Mapear los datos para que cada egreso tenga 'proyecto' como objeto
            const egresosMapeados = resultadoEgresos.egresos.map((egreso) => ({
              ...egreso,
              proyecto: egreso.Proyecto || null,
            }));
            setEgresos(egresosMapeados);
            setTotalEgresos(resultadoEgresos.total);
          } catch (error) {
            console.error('Error al cargar egresos:', error);
            // Si hay error, mostrar datos vacíos
            setEgresos([]);
            setTotalEgresos(0);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [tabValue, pageIngresos, pageEgresos, rowsPerPage, orderByIngresos, orderByEgresos, order, filtrosIngresos, filtrosEgresos]);

  // Funciones para manejar cambios de pestañas
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Funciones para manejo de paginación y ordenamiento
  const handleChangePageIngresos = (event, newPage) => {
    setPageIngresos(newPage);
  };

  const handleChangePageEgresos = (event, newPage) => {
    setPageEgresos(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIngresos(0);
    setPageEgresos(0);
  };

  const handleRequestSortIngresos = (property) => {
    const isAsc = orderByIngresos === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderByIngresos(property);
  };

  const handleRequestSortEgresos = (property) => {
    const isAsc = orderByEgresos === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderByEgresos(property);
  };

  // Funciones para el manejo de filtros
  const handleSearchChangeIngresos = (event) => {
    setFiltrosIngresos({
      ...filtrosIngresos,
      search: event.target.value
    });
    setPageIngresos(0);
  };

  const handleSearchChangeEgresos = (event) => {
    setFiltrosEgresos({
      ...filtrosEgresos,
      search: event.target.value
    });
    setPageEgresos(0);
  };

  const handleFilterChangeIngresos = (event) => {
    setFiltrosIngresos({
      ...filtrosIngresos,
      [event.target.name]: event.target.value
    });
    setPageIngresos(0);
  };

  const handleFilterChangeEgresos = (event) => {
    setFiltrosEgresos({
      ...filtrosEgresos,
      [event.target.name]: event.target.value
    });
    setPageEgresos(0);
  };

  const toggleFiltrosIngresos = () => {
    setMostrarFiltrosIngresos(!mostrarFiltrosIngresos);
  };

  const toggleFiltrosEgresos = () => {
    setMostrarFiltrosEgresos(!mostrarFiltrosEgresos);
  };

  const resetFiltrosIngresos = () => {
    setFiltrosIngresos({
      search: '',
      estado: '',
      cliente: '',
      proyecto: '',
      tipo_ingreso: '',
      cuenta_bancaria: '',
      desde: '',
      hasta: ''
    });
    setPageIngresos(0);
  };

  const resetFiltrosEgresos = () => {
    setFiltrosEgresos({
      search: '',
      estado: '',
      proyecto: '',
      proveedor: '',
      categoria: '',
      cuenta_bancaria: '',
      desde: '',
      hasta: ''
    });
    setPageEgresos(0);
  };

  // Funciones para la navegación y acciones
  const handleNuevoIngreso = () => {
    navigate('/finanzas/ingresos/nuevo');
  };

  const handleNuevoEgreso = () => {
    navigate('/finanzas/egresos/nuevo');
  };

  const handleVerIngreso = (ingreso) => {
    navigate(`/finanzas/ingresos/${ingreso.id}`);
  };

  const handleVerEgreso = (egreso) => {
    navigate(`/finanzas/egresos/${egreso.id}`);
  };

  const handleEditarIngreso = (ingreso) => {
    navigate(`/finanzas/ingresos/editar/${ingreso.id}`);
  };

  const handleEditarEgreso = (egreso) => {
    navigate(`/finanzas/egresos/editar/${egreso.id}`);
  };

  const handleEliminarIngreso = (ingreso) => {
    setItemToDelete(ingreso);
    setDeleteType('ingreso');
    setConfirmOpen(true);
  };

  const handleEliminarEgreso = (egreso) => {
    setItemToDelete(egreso);
    setDeleteType('egreso');
    setConfirmOpen(true);
  };

  const confirmarEliminacion = async () => {
    try {
      if (deleteType === 'ingreso' && itemToDelete) {
        await ingresoService.deleteIngreso(itemToDelete.id);
        setIngresos(ingresos.filter(item => item.id !== itemToDelete.id));
        setTotalIngresos(totalIngresos - 1);
      } else if (deleteType === 'egreso' && itemToDelete) {
        await egresoService.deleteEgreso(itemToDelete.id);
        setEgresos(egresos.filter(item => item.id !== itemToDelete.id));
        setTotalEgresos(totalEgresos - 1);
      }
      setConfirmOpen(false);
      setItemToDelete(null);
      setDeleteType('');
    } catch (error) {
      console.error(`Error al eliminar ${deleteType}:`, error);
      // Aquí se podría mostrar un mensaje de error al usuario
    }
  };

  // Columnas para las tablas
  const columnasIngresos = [
    {
      id: 'fecha',
      label: 'Fecha',
      sortable: true,
      format: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })
    },
    {
      id: 'descripcion',
      label: 'Descripción',
      sortable: false
    },
    {
      id: 'cliente',
      label: 'Cliente',
      sortable: false,
      format: (value) => value ? value.razon_social : '-'
    },
    {
      id: 'proyecto',
      label: 'Proyecto',
      sortable: false,
      format: (value) => value ? value.nombre : '-'
    },
    {
      id: 'tipo_ingreso',
      label: 'Tipo',
      sortable: true
    },
    {
      id: 'monto',
      label: 'Monto',
      sortable: true,
      format: (value) => {
        if (value === null || value === undefined) return '-';
        const monto = typeof value === 'string' ? parseFloat(value) : value;
        return monto.toLocaleString('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
      }
    },
    {
      id: 'estado',
      label: 'Estado',
      sortable: true,
      format: (value) => (
        <Chip
          label={value}
          color={
            value === 'CONFIRMADO' ? 'success' :
            value === 'PENDIENTE' ? 'warning' :
            value === 'RECHAZADO' ? 'error' :
            'default'
          }
          size="small"
        />
      )
    },
    {
      id: 'conciliado',
      label: 'Conciliado',
      sortable: true,
      format: (value) => (
        <Chip
          label={value ? 'Sí' : 'No'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      )
    }
  ];

  const columnasEgresos = [
    {
      id: 'fecha',
      label: 'Fecha',
      sortable: true,
      format: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })
    },
    {
      id: 'descripcion',
      label: 'Descripción',
      sortable: false
    },
    {
      id: 'proveedor_nombre',
      label: 'Proveedor',
      sortable: false
    },
    {
      id: 'proyecto',
      label: 'Proyecto',
      sortable: false,
      format: (value) => value ? value.nombre : '-'
    },
    {
      id: 'categoria',
      label: 'Categoría',
      sortable: true
    },
    {
      id: 'monto',
      label: 'Monto',
      sortable: true,
      format: (value) => {
        if (value === null || value === undefined) return '-';
        const monto = typeof value === 'string' ? parseFloat(value) : value;
        return monto.toLocaleString('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
      }
    },
    {
      id: 'estado',
      label: 'Estado',
      sortable: true,
      format: (value) => (
        <Chip
          label={value}
          color={
            value === 'PAGADO' ? 'success' :
            value === 'PENDIENTE' ? 'warning' :
            value === 'RECHAZADO' ? 'error' :
            'default'
          }
          size="small"
        />
      )
    },
    {
      id: 'conciliado',
      label: 'Conciliado',
      sortable: true,
      format: (value) => (
        <Chip
          label={value ? 'Sí' : 'No'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom sx={{ color: 'text.secondary' }}>
        Proyecciones de Proyectos
      </Typography>

      {loading ? (
        <LoadingIndicator message="Cargando datos de proyecciones..." fullPage={false} />
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h3">
              Registro de Ingresos y Egresos
            </Typography>
            <Box>
              {tabValue === 0 ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNuevoIngreso}
                >
                  Nuevo Ingreso
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNuevoEgreso}
                >
                  Nuevo Egreso
                </Button>
              )}
            </Box>
          </Box>

          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Ingresos" />
              <Tab label="Egresos" />
            </Tabs>
          </Paper>

          {/* Panel de Ingresos */}
          {tabValue === 0 && (
            <>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: mostrarFiltrosIngresos ? 2 : 0 }}>
                  <TextField
                    variant="outlined"
                    placeholder="Buscar ingresos..."
                    size="small"
                    value={filtrosIngresos.search}
                    onChange={handleSearchChangeIngresos}
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
                    onClick={toggleFiltrosIngresos}
                    sx={{ mr: 1 }}
                  >
                    Filtros
                  </Button>
                  {Object.values(filtrosIngresos).some(value => value !== '') && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={resetFiltrosIngresos}
                    >
                      Limpiar
                    </Button>
                  )}
                </Box>

                {mostrarFiltrosIngresos && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="estado"
                        label="Estado"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresos.estado}
                        onChange={handleFilterChangeIngresos}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="CONFIRMADO">Confirmado</MenuItem>
                        <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                        <MenuItem value="ANULADO">Anulado</MenuItem>
                        <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="cliente"
                        label="Cliente"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresos.cliente}
                        onChange={handleFilterChangeIngresos}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {clientes.map(cliente => (
                          <MenuItem key={cliente.id} value={cliente.id}>
                            {cliente.razon_social}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="proyecto"
                        label="Proyecto"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresos.proyecto}
                        onChange={handleFilterChangeIngresos}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {proyectos.map(proyecto => (
                          <MenuItem key={proyecto.id} value={proyecto.id}>
                            {proyecto.nombre}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="tipo_ingreso"
                        label="Tipo de Ingreso"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresos.tipo_ingreso}
                        onChange={handleFilterChangeIngresos}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                        <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                        <MenuItem value="CHEQUE">Cheque</MenuItem>
                        <MenuItem value="OTRO">Otro</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="cuenta_bancaria"
                        label="Cuenta Bancaria"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresos.cuenta_bancaria}
                        onChange={handleFilterChangeIngresos}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {cuentasBancarias.map(cuenta => (
                          <MenuItem key={cuenta.id} value={cuenta.id}>
                            {cuenta.nombre}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        type="date"
                        name="desde"
                        label="Desde"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresos.desde}
                        onChange={handleFilterChangeIngresos}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        type="date"
                        name="hasta"
                        label="Hasta"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresos.hasta}
                        onChange={handleFilterChangeIngresos}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Paper>

              {ingresos.length > 0 ? (
                <DataTable
                  columns={columnasIngresos}
                  data={ingresos}
                  loading={loading}
                  page={pageIngresos}
                  rowsPerPage={rowsPerPage}
                  totalItems={totalIngresos}
                  onPageChange={handleChangePageIngresos}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  onSort={handleRequestSortIngresos}
                  orderBy={orderByIngresos}
                  order={order}
                  actions={[
                    {
                      label: 'Ver detalle',
                      icon: <VisibilityIcon />,
                      onClick: handleVerIngreso,
                      color: 'primary'
                    },
                    {
                      label: 'Editar',
                      icon: <EditIcon />,
                      onClick: handleEditarIngreso,
                      color: 'secondary',
                      hide: (ingreso) => ingreso.estado === 'ANULADO'
                    },
                    {
                      label: 'Eliminar',
                      icon: <DeleteIcon />,
                      onClick: handleEliminarIngreso,
                      color: 'error',
                      hide: (ingreso) => ingreso.estado === 'ANULADO' || ingreso.conciliado
                    }
                  ]}
                />
              ) : (
                <EmptyState
                  title="No hay ingresos registrados"
                  description="No se encontraron ingresos con los criterios de búsqueda actuales."
                  actionText="Registrar Ingreso"
                  onActionClick={handleNuevoIngreso}
                  icon={<PaymentsIcon sx={{ fontSize: 60 }} />}
                />
              )}
            </>
          )}

          {/* Panel de Egresos */}
          {tabValue === 1 && (
            <>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: mostrarFiltrosEgresos ? 2 : 0 }}>
                  <TextField
                    variant="outlined"
                    placeholder="Buscar egresos..."
                    size="small"
                    value={filtrosEgresos.search}
                    onChange={handleSearchChangeEgresos}
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
                    onClick={toggleFiltrosEgresos}
                    sx={{ mr: 1 }}
                  >
                    Filtros
                  </Button>
                  {Object.values(filtrosEgresos).some(value => value !== '') && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={resetFiltrosEgresos}
                    >
                      Limpiar
                    </Button>
                  )}
                </Box>

                {mostrarFiltrosEgresos && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="estado"
                        label="Estado"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresos.estado}
                        onChange={handleFilterChangeEgresos}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="PAGADO">Pagado</MenuItem>
                        <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                        <MenuItem value="ANULADO">Anulado</MenuItem>
                        <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        name="proveedor"
                        label="Proveedor"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresos.proveedor}
                        onChange={handleFilterChangeEgresos}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="proyecto"
                        label="Proyecto"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresos.proyecto}
                        onChange={handleFilterChangeEgresos}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {proyectos.map(proyecto => (
                          <MenuItem key={proyecto.id} value={proyecto.id}>
                            {proyecto.nombre}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="categoria"
                        label="Categoría"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresos.categoria}
                        onChange={handleFilterChangeEgresos}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="ARRIENDO">Arriendo</MenuItem>
                        <MenuItem value="SERVICIOS">Servicios</MenuItem>
                        <MenuItem value="MATERIALES">Materiales</MenuItem>
                        <MenuItem value="OTROS">Otros</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="cuenta_bancaria"
                        label="Cuenta Bancaria"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresos.cuenta_bancaria}
                        onChange={handleFilterChangeEgresos}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {cuentasBancarias.map(cuenta => (
                          <MenuItem key={cuenta.id} value={cuenta.id}>
                            {cuenta.nombre}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        type="date"
                        name="desde"
                        label="Desde"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresos.desde}
                        onChange={handleFilterChangeEgresos}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        type="date"
                        name="hasta"
                        label="Hasta"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresos.hasta}
                        onChange={handleFilterChangeEgresos}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Paper>

              {egresos.length > 0 ? (
                <DataTable
                  columns={columnasEgresos}
                  data={egresos}
                  loading={loading}
                  page={pageEgresos}
                  rowsPerPage={rowsPerPage}
                  totalItems={totalEgresos}
                  onPageChange={handleChangePageEgresos}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  onSort={handleRequestSortEgresos}
                  orderBy={orderByEgresos}
                  order={order}
                  actions={[
                    {
                      label: 'Ver detalle',
                      icon: <VisibilityIcon />,
                      onClick: handleVerEgreso,
                      color: 'primary'
                    },
                    {
                      label: 'Editar',
                      icon: <EditIcon />,
                      onClick: handleEditarEgreso,
                      color: 'secondary',
                      hide: (egreso) => egreso.estado === 'ANULADO'
                    },
                    {
                      label: 'Eliminar',
                      icon: <DeleteIcon />,
                      onClick: handleEliminarEgreso,
                      color: 'error',
                      hide: (egreso) => egreso.estado === 'ANULADO' || egreso.conciliado
                    }
                  ]}
                />
              ) : (
                <EmptyState
                  title="No hay egresos registrados"
                  description="No se encontraron egresos con los criterios de búsqueda actuales."
                  actionText="Registrar Egreso"
                  onActionClick={handleNuevoEgreso}
                  icon={<ReceiptIcon sx={{ fontSize: 60 }} />}
                />
              )}
            </>
          )}

          {/* Modal de confirmación para eliminar */}
          <Confirm
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={confirmarEliminacion}
            title={`Eliminar ${deleteType === 'ingreso' ? 'Ingreso' : 'Egreso'}`}
            message={`¿Está seguro que desea eliminar este ${deleteType === 'ingreso' ? 'ingreso' : 'egreso'}? Esta acción no se puede deshacer.`}
          />
        </>
      )}
    </Box>
  );
};

export default ProyeccionesView;
