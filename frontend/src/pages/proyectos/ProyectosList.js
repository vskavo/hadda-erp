import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button,
  IconButton,
  Grid,
  TextField,
  MenuItem,
  Chip,
  InputAdornment,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimelineIcon from '@mui/icons-material/Timeline';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SellIcon from '@mui/icons-material/Sell';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { 
  AlertMessage, 
  Confirm, 
  LoadingIndicator, 
  EmptyState 
} from '../../components/common';
import { proyectoService } from '../../services';

// Componente de fila expandible para proyectos
const ExpandableRow = ({ proyecto, onEdit, onDelete, onRentabilidad, onSeguimiento, onConvertirVenta }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Formato de moneda
  const formatCurrency = (value) => {
    return `$${parseFloat(value || 0).toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  // Cálculo de rentabilidad
  const calcularRentabilidad = () => {
    const presupuesto = parseFloat(proyecto.presupuesto || 0);
    const costoReal = parseFloat(proyecto.costo_real || 0);
    
    if (presupuesto <= 0) return '0,00%';
    
    const rentabilidad = ((presupuesto - costoReal) / presupuesto) * 100;
    
    let color = 'default';
    if (rentabilidad >= 20) color = 'success';
    else if (rentabilidad >= 0) color = 'primary';
    else color = 'error';
    
    return (
      <Chip 
        label={`${rentabilidad.toLocaleString('es-CL', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}%`} 
        color={color}
        size="small"
      />
    );
  };

  // Formato de estado
  const formatEstado = (estado) => {
    let color = 'default';
    // La etiqueta será el mismo estado, ya que los valores ahora son descriptivos.

    switch (estado) {
      case 'No iniciado':
        color = 'default';
        break;
      case 'En curso':
        color = 'warning';
        break;
      case 'Liquidado':
        color = 'info';
        break;
      case 'Facturado':
        color = 'success';
        break;
      // Mantener casos antiguos por si existen datos así
      case 'planificacion':
        color = 'info';
        break;
      case 'en_progreso':
        color = 'warning';
        break;
      case 'completado':
        color = 'success';
        break;
      case 'cancelado':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={estado} // La etiqueta es el mismo valor del estado
        color={color}
        size="small"
      />
    );
  };

  // --- INICIO: Formato de estado de aprobación ---
  const formatAprobado = (aprobado) => {
    return (
      <Chip
        label={aprobado ? "Aprobado" : "Pendiente"}
        color={aprobado ? "success" : "warning"}
        size="small"
        variant="outlined"
      />
    );
  };
  // --- FIN: Formato de estado de aprobación ---

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <Tooltip title={open ? "Ocultar detalles" : "Mostrar detalles"}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Tooltip>
        </TableCell>
        <TableCell>{proyecto.nombre}
          {proyecto.proyect_id && (
            <Typography variant="caption" color="text.secondary" display="block">
              ID: {proyecto.proyect_id}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          {proyecto.Cliente?.razon_social ? (
            <Chip 
              label={proyecto.Cliente.razon_social} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          ) : 'N/A'}
        </TableCell>
        <TableCell>
          {formatEstado(proyecto.estado)}
        </TableCell>
        <TableCell>
          {formatAprobado(proyecto.aprobado)}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={proyecto.aprobado ? "Ver proyecto aprobado" : "Editar proyecto"}>
              <IconButton
                size="small"
                color={proyecto.aprobado ? "primary" : "secondary"}
                onClick={() => onEdit(proyecto)}
              >
                {proyecto.aprobado ? <VisibilityIcon fontSize="small" /> : <EditIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Análisis de rentabilidad">
              <IconButton
                size="small"
                color="success"
                onClick={() => onRentabilidad(proyecto)}
              >
                <AssessmentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Seguimiento de avance">
              <IconButton
                size="small"
                color="info"
                onClick={() => onSeguimiento(proyecto)}
              >
                <TimelineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar proyecto">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(proyecto)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={2}>
              {/* Mostrar el ID único del proyecto en el detalle expandido */}
              {proyecto.proyect_id && (
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ID Único del Proyecto: {proyecto.proyect_id}
                </Typography>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom component="div">
                    Fechas
                  </Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Inicio: {proyecto.fecha_inicio ? format(new Date(proyecto.fecha_inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) : 'Sin definir'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fin: {proyecto.fecha_fin ? format(new Date(proyecto.fecha_fin + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) : 'Sin definir'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom component="div">
                    Monto de Venta
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(proyecto.presupuesto)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom component="div">
                  Gastos Totales
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(proyecto.costo_real)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom component="div">
                    Rentabilidad
                  </Typography>
                  {calcularRentabilidad()}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom component="div">
                    Cursos Asociados
                  </Typography>
                  {proyecto.Cursos && proyecto.Cursos.length > 0 ? (
                    <Box sx={{ maxHeight: '150px', overflowY: 'auto', mt: 1 }}>
                      {proyecto.Cursos.map((curso) => (
                        <Chip
                          key={curso.id}
                          label={curso.nombre}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                          onClick={() => navigate(`/cursos/${curso.id}`)}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Este proyecto no tiene cursos asociados
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<TimelineIcon />}
                      onClick={() => onSeguimiento(proyecto)}
                    >
                      Seguimiento de avance
                    </Button>
                    {/* Mostrar botón solo si el proyecto NO tiene venta */}
                    {!proyecto.tieneVenta && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<SellIcon />}
                        onClick={() => onConvertirVenta(proyecto)}
                      >
                        Convertir a venta
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const ProyectosList = () => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [openVentaConfirm, setOpenVentaConfirm] = useState(false);
  const [filtros, setFiltros] = useState({
    search: '',
    estado: '',
    cliente: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados para paginación y ordenamiento
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('fecha_inicio');
  const [order, setOrder] = useState('desc');
  const [totalProyectos, setTotalProyectos] = useState(0);

  // Cargar proyectos
  useEffect(() => {
    fetchProyectos();
  }, [page, rowsPerPage, orderBy, order, filtros]);

  const fetchProyectos = async () => {
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
        include: 'Cliente,Cursos',  // Incluir relaciones necesarias
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.cliente && { cliente_id: filtros.cliente }),
        ...(filtros.fechaDesde && { desde: filtros.fechaDesde }),
        ...(filtros.fechaHasta && { hasta: filtros.fechaHasta })
      };
        
      const result = await proyectoService.getProyectos(params);
      // Consultar si cada proyecto tiene venta
      const proyectosConVenta = await Promise.all(
        (result.proyectos || []).map(async (proy) => {
          try {
            const ventaRes = await proyectoService.getTieneVenta(proy.id);
            return { ...proy, tieneVenta: !!ventaRes.tieneVenta };
          } catch {
            return { ...proy, tieneVenta: false };
          }
        })
      );
      setProyectos(proyectosConVenta);
      setTotalProyectos(result.total || 0);
      setError('');
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
      setError('Error al cargar proyectos. ' + (err.response?.data?.message || ''));
      // Establecer un array vacío en caso de error para evitar problemas de renderizado
      setProyectos([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación de proyecto
  const handleDeleteProyecto = async () => {
    try {
      await proyectoService.deleteProyecto(selectedProyecto.id);
      setOpenDeleteConfirm(false);
      setSuccessMessage('Proyecto eliminado con éxito');
      fetchProyectos();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al eliminar proyecto. ' + (err.response?.data?.message || ''));
    }
  };

  // Manejadores para paginación y ordenamiento
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

  // Manejadores para filtros
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
      estado: '',
      cliente: '',
      fechaDesde: '',
      fechaHasta: ''
    });
    setPage(0);
  };

  // Navegación
  const handleNuevoProyecto = () => {
    navigate('/proyectos/nuevo');
  };

  const handleEditarProyecto = (proyecto) => {
    navigate(`/proyectos/${proyecto.id}/editar`);
  };

  const handleVerRentabilidad = (proyecto) => {
    navigate(`/proyectos/${proyecto.id}/rentabilidad`);
  };

  const handleVerSeguimiento = (proyecto) => {
    navigate(`/proyectos/${proyecto.id}/seguimiento`);
  };

  // Convertir proyecto a venta
  const handleConvertirAVenta = async () => {
    try {
      await proyectoService.convertirAVenta(selectedProyecto.id);
      setOpenVentaConfirm(false);
      setSuccessMessage(`Proyecto "${selectedProyecto.nombre}" convertido a venta exitosamente`);
      fetchProyectos(); // Recargar la lista para mostrar el estado actualizado
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al convertir proyecto a venta. ' + (err.response?.data?.message || ''));
    }
  };

  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Ventas
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleNuevoProyecto}
          >
            Nuevo Proyecto
          </Button>
        </Box>

        {/* Barra de búsqueda y filtros */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                label="Buscar proyecto"
                value={filtros.search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={toggleFiltros}
              >
                Filtros
              </Button>
            </Grid>
            {filtros.estado || filtros.cliente || filtros.fechaDesde || filtros.fechaHasta ? (
              <Grid item>
                <Button
                  variant="text"
                  color="error"
                  onClick={resetFiltros}
                >
                  Limpiar filtros
                </Button>
              </Grid>
            ) : null}
          </Grid>

          {mostrarFiltros && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Estado"
                  name="estado"
                  value={filtros.estado}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="planificacion">Planificación</MenuItem>
                  <MenuItem value="en_progreso">En Progreso</MenuItem>
                  <MenuItem value="completado">Completado</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Desde"
                  name="fechaDesde"
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Hasta"
                  name="fechaHasta"
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Alertas de éxito o error */}
        {successMessage && (
          <AlertMessage 
            severity="success" 
            message={successMessage}
            onClose={() => setSuccessMessage('')} 
          />
        )}
        
        {error && (
          <AlertMessage 
            severity="error" 
            message={error}
            onClose={() => setError('')} 
          />
        )}

        {/* Tabla de proyectos */}
        {loading ? (
          <LoadingIndicator />
        ) : proyectos.length === 0 ? (
          <EmptyState
            message="No se encontraron proyectos"
            description="Intenta cambiar los filtros o crea un nuevo proyecto"
            actionText="Crear proyecto"
            onAction={handleNuevoProyecto}
          />
        ) : (
          <TableContainer component={Paper} sx={{ width: '100%', mb: 2 }}>
            <Table aria-label="tabla expandible de proyectos">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Nombre</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Aprobación</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proyectos.map((proyecto) => (
                  <ExpandableRow 
                    key={proyecto.id}
                    proyecto={proyecto}
                    onEdit={handleEditarProyecto}
                    onDelete={(proyecto) => {
                      setSelectedProyecto(proyecto);
                      setOpenDeleteConfirm(true);
                    }}
                    onRentabilidad={handleVerRentabilidad}
                    onSeguimiento={handleVerSeguimiento}
                    onConvertirVenta={(proyecto) => {
                      setSelectedProyecto(proyecto);
                      setOpenVentaConfirm(true);
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Confirmación para eliminar */}
      <Confirm
        open={openDeleteConfirm}
        title="Eliminar Proyecto"
        message={`¿Estás seguro de que deseas eliminar el proyecto "${selectedProyecto?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteProyecto}
        onClose={() => setOpenDeleteConfirm(false)}
      />

      {/* Confirmación para convertir a venta */}
      <Confirm
        open={openVentaConfirm}
        title="Convertir Proyecto a Venta"
        message={`¿Confirmas cambiar el estado del proyecto "${selectedProyecto?.nombre}" a "en curso" y registrarlo como venta? Esta acción generará un registro en el módulo de ventas.`}
        onConfirm={handleConvertirAVenta}
        onClose={() => setOpenVentaConfirm(false)}
      />
    </Container>
  );
};

export default ProyectosList; 