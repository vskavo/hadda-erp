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
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DescriptionIcon from '@mui/icons-material/Description';
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import { DataTable, EmptyState } from '../../../components/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import LoadingIndicator from '../../../components/common/LoadingIndicator';
import { siiIngresosService, siiEgresosService, siiService, proyectoService } from '../../../services';

// Componente para la vista de SII (ingresos/egresos reales sincronizados)
const SiiView = () => {
  const navigate = useNavigate();

  // Estados para la gestión de pestañas
  const [tabValue, setTabValue] = useState(0);

  // Estados para los datos
  const [ingresosSii, setIngresosSii] = useState([]);
  const [egresosSii, setEgresosSii] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [proyectos, setProyectos] = useState([]);

  // Estados para el modal de sincronización
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncCredentials, setSyncCredentials] = useState({
    rut: '',
    clave: '',
    proyecto_id: ''
  });

  // Estado para snackbar de notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Estados para el modal de edición de proyecto
  const [modalEditarProyectoOpen, setModalEditarProyectoOpen] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [tipoDocumentoSeleccionado, setTipoDocumentoSeleccionado] = useState(''); // 'ingreso' o 'egreso'
  const [nuevoProyectoId, setNuevoProyectoId] = useState('');

  // Estados para el filtrado
  const [filtrosIngresosSii, setFiltrosIngresosSii] = useState({
    search: '',
    tipo_dte: '',
    estado_sii: '',
    proyecto_id: '',
    cliente_rut: '',
    desde: '',
    hasta: ''
  });

  const [filtrosEgresosSii, setFiltrosEgresosSii] = useState({
    search: '',
    tipo_dte: '',
    estado_sii: '',
    proyecto_id: '',
    emisor_rut: '',
    desde: '',
    hasta: ''
  });

  const [mostrarFiltrosIngresosSii, setMostrarFiltrosIngresosSii] = useState(false);
  const [mostrarFiltrosEgresosSii, setMostrarFiltrosEgresosSii] = useState(false);

  // Estados para paginación y ordenamiento
  const [pageIngresosSii, setPageIngresosSii] = useState(0);
  const [pageEgresosSii, setPageEgresosSii] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderByIngresosSii, setOrderByIngresosSii] = useState('fecha_emision');
  const [orderByEgresosSii, setOrderByEgresosSii] = useState('fecha_emision');
  const [order, setOrder] = useState('desc');
  const [totalIngresosSii, setTotalIngresosSii] = useState(0);
  const [totalEgresosSii, setTotalEgresosSii] = useState(0);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar proyectos para los filtros
        try {
          const proyectosResponse = await proyectoService.getProyectos({ limit: 1000 });
          setProyectos(proyectosResponse.proyectos || proyectosResponse.rows || []);
        } catch (error) {
          console.error('Error al cargar proyectos:', error);
          setProyectos([]);
        }

        // Preparar parámetros de consulta
        const paramsBase = {
          page: tabValue === 0 ? pageIngresosSii + 1 : pageEgresosSii + 1,
          limit: rowsPerPage,
          sortBy: tabValue === 0 ? orderByIngresosSii : orderByEgresosSii,
          sortOrder: order
        };

        // Cargar ingresos SII
        if (tabValue === 0) {
          const filtrosActuales = filtrosIngresosSii;
          const paramsIngresos = {
            ...paramsBase,
            ...(filtrosActuales.search && { search: filtrosActuales.search }),
            ...(filtrosActuales.tipo_dte && { tipo_dte: filtrosActuales.tipo_dte }),
            ...(filtrosActuales.estado_sii && { estado_sii: filtrosActuales.estado_sii }),
            ...(filtrosActuales.proyecto_id && { proyecto_id: filtrosActuales.proyecto_id }),
            ...(filtrosActuales.cliente_rut && { cliente_rut: filtrosActuales.cliente_rut }),
            ...(filtrosActuales.desde && { desde: filtrosActuales.desde }),
            ...(filtrosActuales.hasta && { hasta: filtrosActuales.hasta })
          };

          try {
            const resultadoIngresos = await siiIngresosService.getSiiIngresos(paramsIngresos);
            setIngresosSii(resultadoIngresos.ingresos || []);
            setTotalIngresosSii(resultadoIngresos.total || 0);
          } catch (error) {
            console.error('Error al cargar ingresos SII:', error);
            // Si hay error, mostrar datos vacíos
            setIngresosSii([]);
            setTotalIngresosSii(0);
          }
        }

        // Cargar egresos SII
        if (tabValue === 1) {
          const filtrosActuales = filtrosEgresosSii;
          const paramsEgresos = {
            ...paramsBase,
            ...(filtrosActuales.search && { search: filtrosActuales.search }),
            ...(filtrosActuales.tipo_dte && { tipo_dte: filtrosActuales.tipo_dte }),
            ...(filtrosActuales.estado_sii && { estado_sii: filtrosActuales.estado_sii }),
            ...(filtrosActuales.proyecto_id && { proyecto_id: filtrosActuales.proyecto_id }),
            ...(filtrosActuales.emisor_rut && { emisor_rut: filtrosActuales.emisor_rut }),
            ...(filtrosActuales.desde && { desde: filtrosActuales.desde }),
            ...(filtrosActuales.hasta && { hasta: filtrosActuales.hasta })
          };

          try {
            const resultadoEgresos = await siiEgresosService.getSiiEgresos(paramsEgresos);
            setEgresosSii(resultadoEgresos.egresos || []);
            setTotalEgresosSii(resultadoEgresos.total || 0);
          } catch (error) {
            console.error('Error al cargar egresos SII:', error);
            // Si hay error, mostrar datos vacíos
            setEgresosSii([]);
            setTotalEgresosSii(0);
          }
        }

      } catch (error) {
        console.error('Error al cargar datos SII:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [tabValue, pageIngresosSii, pageEgresosSii, rowsPerPage, orderByIngresosSii, orderByEgresosSii, order, filtrosIngresosSii, filtrosEgresosSii]);

  // Funciones para manejar cambios de pestañas
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Funciones para manejo de paginación y ordenamiento
  const handleChangePageIngresosSii = (event, newPage) => {
    setPageIngresosSii(newPage);
  };

  const handleChangePageEgresosSii = (event, newPage) => {
    setPageEgresosSii(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIngresosSii(0);
    setPageEgresosSii(0);
  };

  const handleRequestSortIngresosSii = (property) => {
    const isAsc = orderByIngresosSii === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderByIngresosSii(property);
  };

  const handleRequestSortEgresosSii = (property) => {
    const isAsc = orderByEgresosSii === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderByEgresosSii(property);
  };

  // Funciones para el manejo de filtros
  const handleSearchChangeIngresosSii = (event) => {
    setFiltrosIngresosSii({
      ...filtrosIngresosSii,
      search: event.target.value
    });
    setPageIngresosSii(0);
  };

  const handleSearchChangeEgresosSii = (event) => {
    setFiltrosEgresosSii({
      ...filtrosEgresosSii,
      search: event.target.value
    });
    setPageEgresosSii(0);
  };

  const handleFilterChangeIngresosSii = (event) => {
    setFiltrosIngresosSii({
      ...filtrosIngresosSii,
      [event.target.name]: event.target.value
    });
    setPageIngresosSii(0);
  };

  const handleFilterChangeEgresosSii = (event) => {
    setFiltrosEgresosSii({
      ...filtrosEgresosSii,
      [event.target.name]: event.target.value
    });
    setPageEgresosSii(0);
  };

  const toggleFiltrosIngresosSii = () => {
    setMostrarFiltrosIngresosSii(!mostrarFiltrosIngresosSii);
  };

  const toggleFiltrosEgresosSii = () => {
    setMostrarFiltrosEgresosSii(!mostrarFiltrosEgresosSii);
  };

  const resetFiltrosIngresosSii = () => {
    setFiltrosIngresosSii({
      search: '',
      tipo_dte: '',
      estado_sii: '',
      proyecto_id: '',
      cliente_rut: '',
      desde: '',
      hasta: ''
    });
    setPageIngresosSii(0);
  };

  const resetFiltrosEgresosSii = () => {
    setFiltrosEgresosSii({
      search: '',
      tipo_dte: '',
      estado_sii: '',
      proyecto_id: '',
      emisor_rut: '',
      desde: '',
      hasta: ''
    });
    setPageEgresosSii(0);
  };

  // Funciones para el modal de sincronización
  const handleOpenSyncDialog = () => {
    setSyncDialogOpen(true);
  };

  const handleCloseSyncDialog = () => {
    setSyncDialogOpen(false);
    setSyncCredentials({
      rut: '',
      clave: '',
      proyecto_id: ''
    });
  };

  const handleSyncCredentialsChange = (field, value) => {
    setSyncCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSincronizarSii = async () => {
    if (!syncCredentials.rut || !syncCredentials.clave) {
      setSnackbar({
        open: true,
        message: 'Debe ingresar RUT y clave para sincronizar',
        severity: 'warning'
      });
      return;
    }

    setSyncLoading(true);
    try {
      let resultado;

      if (tabValue === 0) {
        // Sincronizar ingresos
        resultado = await siiIngresosService.sincronizarIngresosSii(syncCredentials);

        // Recargar ingresos SII
        const paramsIngresos = {
          page: pageIngresosSii + 1,
          limit: rowsPerPage,
          sortBy: orderByIngresosSii,
          sortOrder: order
        };
        const resultadoIngresos = await siiIngresosService.getSiiIngresos(paramsIngresos);
        setIngresosSii(resultadoIngresos.ingresos || []);
        setTotalIngresosSii(resultadoIngresos.total || 0);
      } else {
        // Sincronizar egresos usando el servicio correspondiente
        const { siiEgresosService } = await import('../../../services/siiService');
        resultado = await siiEgresosService.sincronizarEgresosSii(syncCredentials);

        // Recargar egresos SII
        const paramsEgresos = {
          page: pageEgresosSii + 1,
          limit: rowsPerPage,
          sortBy: orderByEgresosSii,
          sortOrder: order
        };
        const resultadoEgresos = await siiEgresosService.getSiiEgresos(paramsEgresos);
        setEgresosSii(resultadoEgresos.egresos || []);
        setTotalEgresosSii(resultadoEgresos.total || 0);
      }

      setSnackbar({
        open: true,
        message: `Sincronización completada: ${resultado.nuevosRegistros} nuevos, ${resultado.actualizados} actualizados`,
        severity: 'success'
      });

      handleCloseSyncDialog();

    } catch (error) {
      console.error('Error al sincronizar con SII:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al sincronizar con SII',
        severity: 'error'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // Funciones para navegación
  const handleVerIngresoSii = (ingreso) => {
    // TODO: Implementar navegación a detalle de ingreso SII
    console.log('Ver detalle de ingreso SII:', ingreso);
  };

  const handleVerEgresoSii = (egreso) => {
    // TODO: Implementar navegación a detalle de egreso SII
    console.log('Ver detalle de egreso SII:', egreso);
  };

  const handleEditarProyectoIngreso = (ingreso) => {
    setDocumentoSeleccionado(ingreso);
    setTipoDocumentoSeleccionado('ingreso');
    setNuevoProyectoId(ingreso.proyecto_id || '');
    setModalEditarProyectoOpen(true);
  };

  const handleEditarProyectoEgreso = (egreso) => {
    setDocumentoSeleccionado(egreso);
    setTipoDocumentoSeleccionado('egreso');
    setNuevoProyectoId(egreso.proyecto_id || '');
    setModalEditarProyectoOpen(true);
  };

  // Función para obtener el nombre del tipo de DTE
  const getTipoDteNombre = (tipoDte) => {
    const tipos = {
      '33': 'Factura Electrónica',
      '34': 'Factura No Afecta o Exenta Electrónica',
      '46': 'Factura de Compra Electrónica',
      '61': 'Nota de Crédito Electrónica',
      '56': 'Nota de Débito Electrónica'
    };
    return tipos[tipoDte] || `Tipo ${tipoDte}`;
  };

  // Columnas para las tablas SII
  const columnasIngresosSii = [
    {
      id: 'fecha_emision',
      label: 'Fecha Emisión',
      sortable: true,
      format: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })
    },
    {
      id: 'tipo_dte',
      label: 'Tipo DTE',
      sortable: true,
      format: (value) => `${value} - ${getTipoDteNombre(value)}`
    },
    {
      id: 'folio',
      label: 'Folio',
      sortable: true
    },
    {
      id: 'cliente_nombre',
      label: 'Cliente',
      sortable: false
    },
    {
      id: 'monto_total',
      label: 'Monto Total',
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
      id: 'proyecto',
      label: 'Proyecto',
      sortable: false,
      format: (value, row) => {
        // Usar la relación incluida desde el backend
        return row.Proyecto?.nombre || 'Sin asignar';
      }
    },
    {
      id: 'estado_sii',
      label: 'Estado SII',
      sortable: true,
      format: (value) => (
        <Chip
          label={value}
          color={
            value === 'ACEPTADO' ? 'success' :
            value === 'RECHAZADO' ? 'error' :
            value === 'PENDIENTE' ? 'warning' :
            'default'
          }
          size="small"
        />
      )
    }
  ];

  const columnasEgresosSii = [
    {
      id: 'fecha_emision',
      label: 'Fecha Emisión',
      sortable: true,
      format: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })
    },
    {
      id: 'tipo_dte',
      label: 'Tipo DTE',
      sortable: true,
      format: (value) => `${value} - ${getTipoDteNombre(value)}`
    },
    {
      id: 'folio',
      label: 'Folio',
      sortable: true
    },
    {
      id: 'emisor_nombre',
      label: 'Proveedor',
      sortable: false
    },
    {
      id: 'monto_total',
      label: 'Monto Total',
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
      id: 'proyecto',
      label: 'Proyecto',
      sortable: false,
      format: (value, row) => {
        // Usar la relación incluida desde el backend
        return row.Proyecto?.nombre || 'Sin asignar';
      }
    },
    {
      id: 'estado_sii',
      label: 'Estado SII',
      sortable: true,
      format: (value) => (
        <Chip
          label={value}
          color={
            value === 'ACEPTADO' ? 'success' :
            value === 'RECHAZADO' ? 'error' :
            value === 'PENDIENTE' ? 'warning' :
            'default'
          }
          size="small"
        />
      )
    }
  ];

  // Funciones para el modal de edición de proyecto
  const handleCloseModalEditarProyecto = () => {
    setModalEditarProyectoOpen(false);
    setDocumentoSeleccionado(null);
    setTipoDocumentoSeleccionado('');
    setNuevoProyectoId('');
  };

  const handleOpenModalEditarProyecto = () => {
    if (documentoSeleccionado) {
      setNuevoProyectoId(documentoSeleccionado.proyecto_id || '');
    }
    setModalEditarProyectoOpen(true);
  };

  const handleGuardarProyecto = async () => {
    if (!documentoSeleccionado || !tipoDocumentoSeleccionado) return;

    try {
      let resultado;
      if (tipoDocumentoSeleccionado === 'ingreso') {
        resultado = await siiIngresosService.actualizarProyecto(documentoSeleccionado.id, {
          proyecto_id: nuevoProyectoId || null
        });
        // Actualizar el estado local
        const proyectoSeleccionado = proyectos.find(p => p.id === (nuevoProyectoId || null));
        setIngresosSii(ingresosSii.map(ingreso =>
          ingreso.id === documentoSeleccionado.id
            ? {
                ...ingreso,
                proyecto_id: nuevoProyectoId || null,
                Proyecto: proyectoSeleccionado || null
              }
            : ingreso
        ));
      } else {
        resultado = await siiEgresosService.actualizarProyecto(documentoSeleccionado.id, {
          proyecto_id: nuevoProyectoId || null
        });
        // Actualizar el estado local
        const proyectoSeleccionado = proyectos.find(p => p.id === (nuevoProyectoId || null));
        setEgresosSii(egresosSii.map(egreso =>
          egreso.id === documentoSeleccionado.id
            ? {
                ...egreso,
                proyecto_id: nuevoProyectoId || null,
                Proyecto: proyectoSeleccionado || null
              }
            : egreso
        ));
      }

      setSnackbar({
        open: true,
        message: 'Proyecto actualizado exitosamente',
        severity: 'success'
      });

      handleCloseModalEditarProyecto();
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar el proyecto',
        severity: 'error'
      });
    }
  };

  const handleNuevoProyectoIdChange = (event) => {
    setNuevoProyectoId(event.target.value);
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom sx={{ color: 'text.secondary' }}>
        Documentos Tributarios Electrónicos (SII)
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Esta sección muestra los ingresos y egresos sincronizados automáticamente desde el Servicio de Impuestos Internos (SII).
      </Alert>

      {loading ? (
        <LoadingIndicator message="Cargando datos del SII..." fullPage={false} />
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
              Documentos Tributarios Electrónicos
            </Typography>

            {/* Indicador de progreso durante sincronización */}
            {syncLoading && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  🔄 Sincronizando documentos con el Servicio de Impuestos Internos...
                  Esta operación puede tomar hasta 60 segundos.
                </Typography>
                <LinearProgress />
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Button
                variant="contained"
                startIcon={syncLoading ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                onClick={handleOpenSyncDialog}
                disabled={syncLoading}
              >
                {syncLoading ? 'Sincronizando con SII...' : `Sincronizar ${tabValue === 0 ? 'Ingresos' : 'Egresos'} SII`}
              </Button>
            </Box>
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
              <Tab label="Ingresos Tributarios" />
              <Tab label="Egresos Tributarios" />
            </Tabs>
          </Paper>

          {/* Panel de Ingresos SII */}
          {tabValue === 0 && (
            <>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: mostrarFiltrosIngresosSii ? 2 : 0 }}>
                  <TextField
                    variant="outlined"
                    placeholder="Buscar ingresos SII..."
                    size="small"
                    value={filtrosIngresosSii.search}
                    onChange={handleSearchChangeIngresosSii}
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
                    onClick={toggleFiltrosIngresosSii}
                    sx={{ mr: 1 }}
                  >
                    Filtros
                  </Button>
                  {Object.values(filtrosIngresosSii).some(value => value !== '') && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={resetFiltrosIngresosSii}
                    >
                      Limpiar
                    </Button>
                  )}
                </Box>

                {mostrarFiltrosIngresosSii && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="tipo_dte"
                        label="Tipo DTE"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresosSii.tipo_dte}
                        onChange={handleFilterChangeIngresosSii}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="33">Factura Electrónica (33)</MenuItem>
                        <MenuItem value="34">Factura No Afecta (34)</MenuItem>
                        <MenuItem value="61">Nota de Crédito (61)</MenuItem>
                        <MenuItem value="56">Nota de Débito (56)</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="estado_sii"
                        label="Estado SII"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresosSii.estado_sii}
                        onChange={handleFilterChangeIngresosSii}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="ACEPTADO">Aceptado</MenuItem>
                        <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                        <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="proyecto_id"
                        label="Proyecto"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresosSii.proyecto_id}
                        onChange={handleFilterChangeIngresosSii}
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
                        name="cliente_rut"
                        label="RUT Cliente"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresosSii.cliente_rut}
                        onChange={handleFilterChangeIngresosSii}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        type="date"
                        name="desde"
                        label="Desde"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosIngresosSii.desde}
                        onChange={handleFilterChangeIngresosSii}
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
                        value={filtrosIngresosSii.hasta}
                        onChange={handleFilterChangeIngresosSii}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Paper>

              {ingresosSii.length > 0 ? (
                <DataTable
                  columns={columnasIngresosSii}
                  data={ingresosSii}
                  loading={loading}
                  page={pageIngresosSii}
                  rowsPerPage={rowsPerPage}
                  totalItems={totalIngresosSii}
                  onPageChange={handleChangePageIngresosSii}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  onSort={handleRequestSortIngresosSii}
                  orderBy={orderByIngresosSii}
                  order={order}
                  actions={[
                    {
                      label: 'Ver detalle',
                      icon: <VisibilityIcon />,
                      onClick: handleVerIngresoSii,
                      color: 'primary'
                    },
                    {
                      label: 'Editar proyecto',
                      icon: <EditIcon />,
                      onClick: handleEditarProyectoIngreso,
                      color: 'secondary'
                    }
                  ]}
                />
              ) : (
                <EmptyState
                  title="No hay ingresos tributarios registrados"
                  description="No se encontraron documentos tributarios de ingresos con los criterios de búsqueda actuales. Sincroniza con el SII para obtener tus documentos."
                  actionText="Sincronizar Ingresos SII"
                  onActionClick={handleOpenSyncDialog}
                  icon={<ReceiptIcon sx={{ fontSize: 60 }} />}
                />
              )}
            </>
          )}

          {/* Panel de Egresos SII */}
          {tabValue === 1 && (
            <>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: mostrarFiltrosEgresosSii ? 2 : 0 }}>
                  <TextField
                    variant="outlined"
                    placeholder="Buscar egresos SII..."
                    size="small"
                    value={filtrosEgresosSii.search}
                    onChange={handleSearchChangeEgresosSii}
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
                    onClick={toggleFiltrosEgresosSii}
                    sx={{ mr: 1 }}
                  >
                    Filtros
                  </Button>
                  {Object.values(filtrosEgresosSii).some(value => value !== '') && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={resetFiltrosEgresosSii}
                    >
                      Limpiar
                    </Button>
                  )}
                </Box>

                {mostrarFiltrosEgresosSii && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="tipo_dte"
                        label="Tipo DTE"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresosSii.tipo_dte}
                        onChange={handleFilterChangeEgresosSii}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="46">Factura de Compra (46)</MenuItem>
                        <MenuItem value="61">Nota de Crédito (61)</MenuItem>
                        <MenuItem value="56">Nota de Débito (56)</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="estado_sii"
                        label="Estado SII"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresosSii.estado_sii}
                        onChange={handleFilterChangeEgresosSii}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="ACEPTADO">Aceptado</MenuItem>
                        <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                        <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        name="proyecto_id"
                        label="Proyecto"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresosSii.proyecto_id}
                        onChange={handleFilterChangeEgresosSii}
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
                        name="emisor_rut"
                        label="RUT Proveedor"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresosSii.emisor_rut}
                        onChange={handleFilterChangeEgresosSii}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        type="date"
                        name="desde"
                        label="Desde"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filtrosEgresosSii.desde}
                        onChange={handleFilterChangeEgresosSii}
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
                        value={filtrosEgresosSii.hasta}
                        onChange={handleFilterChangeEgresosSii}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Paper>

              {egresosSii.length > 0 ? (
                <DataTable
                  columns={columnasEgresosSii}
                  data={egresosSii}
                  loading={loading}
                  page={pageEgresosSii}
                  rowsPerPage={rowsPerPage}
                  totalItems={totalEgresosSii}
                  onPageChange={handleChangePageEgresosSii}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  onSort={handleRequestSortEgresosSii}
                  orderBy={orderByEgresosSii}
                  order={order}
                  actions={[
                    {
                      label: 'Ver detalle',
                      icon: <VisibilityIcon />,
                      onClick: handleVerEgresoSii,
                      color: 'primary'
                    },
                    {
                      label: 'Editar proyecto',
                      icon: <EditIcon />,
                      onClick: handleEditarProyectoEgreso,
                      color: 'secondary'
                    }
                  ]}
                />
              ) : (
                <EmptyState
                  title="No hay egresos tributarios registrados"
                  description="No se encontraron documentos tributarios de egresos con los criterios de búsqueda actuales. Sincroniza con el SII para obtener tus documentos."
                  actionText="Sincronizar Egresos SII"
                  onActionClick={handleOpenSyncDialog}
                  icon={<ReceiptIcon sx={{ fontSize: 60 }} />}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Modal de sincronización SII */}
      <Dialog open={syncDialogOpen} onClose={handleCloseSyncDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Sincronizar {tabValue === 0 ? 'Ingresos' : 'Egresos'} con Servicio de Impuestos Internos
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa tus credenciales del SII para sincronizar los documentos tributarios electrónicos.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="RUT (sin puntos ni guión)"
                value={syncCredentials.rut}
                onChange={(e) => handleSyncCredentialsChange('rut', e.target.value)}
                placeholder="12345678"
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Clave SII"
                type="password"
                value={syncCredentials.clave}
                onChange={(e) => handleSyncCredentialsChange('clave', e.target.value)}
                placeholder="Ingresa tu clave"
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Proyecto (opcional)"
                value={syncCredentials.proyecto_id}
                onChange={(e) => handleSyncCredentialsChange('proyecto_id', e.target.value)}
                size="small"
              >
                <MenuItem value="">
                  <em>No asignar a proyecto</em>
                </MenuItem>
                {proyectos.map(proyecto => (
                  <MenuItem key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              La sincronización descargará todos los documentos tributarios electrónicos de {tabValue === 0 ? 'ingresos' : 'egresos'} de tu cuenta SII
              y los registrará en el sistema para su gestión financiera.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              ⏱️ Esta operación puede tomar hasta 60 segundos dependiendo de la cantidad de documentos.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSyncDialog} disabled={syncLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSincronizarSii}
            variant="contained"
            disabled={syncLoading || !syncCredentials.rut || !syncCredentials.clave}
            startIcon={syncLoading ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
          >
            {syncLoading ? 'Sincronizando con SII...' : 'Sincronizar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modal para editar proyecto */}
      <Dialog
        open={modalEditarProyectoOpen}
        onClose={handleCloseModalEditarProyecto}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Editar Proyecto del Documento
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {documentoSeleccionado && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Documento: {documentoSeleccionado.tipo_dte} - {documentoSeleccionado.folio}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {tipoDocumentoSeleccionado === 'ingreso' ? 'Cliente' : 'Proveedor'}: {tipoDocumentoSeleccionado === 'ingreso' ? documentoSeleccionado.cliente_nombre : documentoSeleccionado.emisor_nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Monto: {documentoSeleccionado.monto_total?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Proyecto</InputLabel>
                    <Select
                      value={nuevoProyectoId}
                      label="Proyecto"
                      onChange={handleNuevoProyectoIdChange}
                    >
                      <MenuItem value="">
                        <em>Sin asignar</em>
                      </MenuItem>
                      {proyectos.map((proyecto) => (
                        <MenuItem key={proyecto.id} value={proyecto.id}>
                          {proyecto.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModalEditarProyecto} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleGuardarProyecto} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SiiView;
