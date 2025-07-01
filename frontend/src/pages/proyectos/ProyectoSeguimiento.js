import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Button, 
  Card, 
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import UpdateIcon from '@mui/icons-material/Update';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
// Suponemos que usaremos la librería recharts para los gráficos
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend
} from 'recharts';

import { AlertMessage, LoadingIndicator } from '../../components/common';
import { proyectoService } from '../../services';

const ProyectoSeguimiento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [proyecto, setProyecto] = useState(null);
  const [seguimientoData, setSeguimientoData] = useState(null);
  
  // Estados para diálogos
  const [openActualizarAvance, setOpenActualizarAvance] = useState(false);
  const [openAgregarHito, setOpenAgregarHito] = useState(false);
  const [openActualizarActividad, setOpenActualizarActividad] = useState(false);
  
  // Estados para formularios
  const [avanceForm, setAvanceForm] = useState({
    porcentaje_completado: 0,
    comentarios: ''
  });
  const [hitoForm, setHitoForm] = useState({
    nombre: '',
    descripcion: '',
    fecha_planificada: '',
    completado: false
  });
  const [actividadForm, setActividadForm] = useState({
    id: null,
    estado: '',
    comentarios: ''
  });
  
  // Cargar datos del proyecto y seguimiento
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener datos del proyecto
        const proyectoData = await proyectoService.getProyectoById(id);
        setProyecto(proyectoData);
        
        // Obtener datos de seguimiento
        const seguimientoInfo = await proyectoService.getSeguimiento(id);
        setSeguimientoData(seguimientoInfo);
        
        setError('');
      } catch (err) {
        console.error('Error al cargar seguimiento de proyecto:', err);
        setError('Error al cargar seguimiento de proyecto. ' + (err.response?.data?.message || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleVolver = () => {
    navigate(`/proyectos/${id}`);
  };

  // Manejadores para diálogos
  const handleOpenActualizarAvance = () => {
    setAvanceForm({
      porcentaje_completado: seguimientoData.porcentaje_avance,
      comentarios: ''
    });
    setOpenActualizarAvance(true);
  };

  const handleOpenAgregarHito = () => {
    setHitoForm({
      nombre: '',
      descripcion: '',
      fecha_planificada: format(new Date(), 'yyyy-MM-dd'),
      completado: false
    });
    setOpenAgregarHito(true);
  };

  const handleOpenActualizarActividad = (actividad) => {
    setActividadForm({
      id: actividad.id,
      estado: actividad.estado,
      comentarios: ''
    });
    setOpenActualizarActividad(true);
  };

  // Manejadores para cambios en formularios
  const handleAvanceChange = (e) => {
    const { name, value } = e.target;
    setAvanceForm({
      ...avanceForm,
      [name]: name === 'porcentaje_completado' ? Number(value) : value
    });
  };

  const handleHitoChange = (e) => {
    const { name, value, checked, type } = e.target;
    setHitoForm({
      ...hitoForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleActividadChange = (e) => {
    const { name, value } = e.target;
    setActividadForm({
      ...actividadForm,
      [name]: value
    });
  };

  // Manejadores para envío de formularios
  const handleActualizarAvance = async () => {
    try {
      await proyectoService.updateAvance(id, avanceForm);
      // Actualizar datos
      const seguimientoInfo = await proyectoService.getSeguimiento(id);
      setSeguimientoData(seguimientoInfo);
      setSuccessMessage('Avance actualizado correctamente');
      setOpenActualizarAvance(false);

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al actualizar avance: ' + (err.response?.data?.message || ''));
    }
  };

  const handleAgregarHito = async () => {
    try {
      await proyectoService.addHito(id, hitoForm);
      // Actualizar datos
      const seguimientoInfo = await proyectoService.getSeguimiento(id);
      setSeguimientoData(seguimientoInfo);
      setSuccessMessage('Hito agregado correctamente');
      setOpenAgregarHito(false);

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al agregar hito: ' + (err.response?.data?.message || ''));
    }
  };

  const handleActualizarActividad = async () => {
    try {
      await proyectoService.updateAvance(id, {
        actividad_id: actividadForm.id,
        estado: actividadForm.estado,
        comentarios: actividadForm.comentarios
      });
      // Actualizar datos
      const seguimientoInfo = await proyectoService.getSeguimiento(id);
      setSeguimientoData(seguimientoInfo);
      setSuccessMessage('Actividad actualizada correctamente');
      setOpenActualizarActividad(false);

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al actualizar actividad: ' + (err.response?.data?.message || ''));
    }
  };

  // Función para obtener el ícono de estado
  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'completada':
        return <CheckCircleIcon color="success" />;
      case 'pendiente':
        return <AccessTimeIcon color="warning" />;
      case 'cancelada':
        return <CancelIcon color="error" />;
      case 'en_progreso':
        return <UpdateIcon color="info" />;
      default:
        return <AccessTimeIcon />;
    }
  };

  // Renderizar un componente de carga mientras se obtienen los datos
  if (loading) {
    return <LoadingIndicator />;
  }

  // Renderizar mensaje de error si no se pudieron cargar los datos
  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 3 }}>
          <AlertMessage severity="error" message={error} />
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleVolver}
            sx={{ mt: 2 }}
          >
            Volver al Proyecto
          </Button>
        </Box>
      </Container>
    );
  }

  // Si no hay datos, mostrar mensaje
  if (!proyecto || !seguimientoData) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 3 }}>
          <AlertMessage 
            severity="warning" 
            message="No se pudieron cargar los datos de seguimiento del proyecto" 
          />
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleVolver}
            sx={{ mt: 2 }}
          >
            Volver al Proyecto
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={handleVolver}
            sx={{ mr: 2 }}
          >
            Volver al Proyecto
          </Button>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            Seguimiento de Avance - {proyecto.nombre}
          </Typography>
        </Box>

        {/* Mensaje de éxito */}
        {successMessage && (
          <Box sx={{ mb: 3 }}>
            <AlertMessage 
              severity="success" 
              message={successMessage}
              onClose={() => setSuccessMessage('')}
            />
          </Box>
        )}

        {/* Resumen de Avance */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader 
                title="Progreso General" 
                titleTypographyProps={{ variant: 'subtitle1' }}
                action={
                  <Tooltip title="Actualizar avance">
                    <IconButton onClick={handleOpenActualizarAvance}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Porcentaje completado
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={seguimientoData.porcentaje_avance} 
                        color={
                          seguimientoData.porcentaje_avance >= 75 ? 'success' :
                          seguimientoData.porcentaje_avance >= 50 ? 'info' :
                          seguimientoData.porcentaje_avance >= 25 ? 'warning' : 
                          'error'
                        }
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {`${seguimientoData.porcentaje_avance}%`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Estado actual
                  </Typography>
                  <Chip 
                    label={{
                      'No iniciado': 'No iniciado',
                      'En curso': 'En curso',
                      'Liquidado': 'Liquidado',
                      'Facturado': 'Facturado',
                      // Mantener antiguos por si acaso
                      'planificacion': 'Planificación',
                      'en_progreso': 'En Progreso', 
                      'completado': 'Completado',
                      'cancelado': 'Cancelado'
                    }[proyecto.estado] || proyecto.estado}
                    color={{
                      'No iniciado': 'default',
                      'En curso': 'warning',
                      'Liquidado': 'info',
                      'Facturado': 'success',
                      // Mantener antiguos por si acaso
                      'planificacion': 'info',
                      'en_progreso': 'warning',
                      'completado': 'success',
                      'cancelado': 'error'
                    }[proyecto.estado] || 'default'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader 
                title="Tiempo" 
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Avance de tiempo
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={seguimientoData.porcentaje_tiempo} 
                        color={
                          seguimientoData.porcentaje_tiempo > seguimientoData.porcentaje_avance + 10 ? 'error' :
                          seguimientoData.porcentaje_tiempo > seguimientoData.porcentaje_avance ? 'warning' :
                          'success'
                        }
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {`${seguimientoData.porcentaje_tiempo}%`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha de inicio
                    </Typography>
                    <Typography variant="body1">
                      {proyecto.fecha_inicio 
                        ? format(new Date(proyecto.fecha_inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) 
                        : 'Sin definir'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha de fin
                    </Typography>
                    <Typography variant="body1">
                      {proyecto.fecha_fin 
                        ? format(new Date(proyecto.fecha_fin + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) 
                        : 'Sin definir'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader 
                title="Hitos Clave" 
                titleTypographyProps={{ variant: 'subtitle1' }}
                action={
                  <Tooltip title="Agregar hito">
                    <IconButton onClick={handleOpenAgregarHito}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <List dense>
                  {seguimientoData.hitos && seguimientoData.hitos.slice(0, 4).map((hito) => (
                    <ListItem key={hito.id}>
                      <ListItemIcon>
                        {hito.completado ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <AccessTimeIcon color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={hito.nombre}
                        secondary={hito.fecha_planificada 
                          ? format(new Date(hito.fecha_planificada), 'dd/MM/yyyy', { locale: es }) 
                          : 'Sin fecha'}
                      />
                    </ListItem>
                  ))}
                  {(!seguimientoData.hitos || seguimientoData.hitos.length === 0) && (
                    <ListItem>
                      <ListItemText
                        primary="No hay hitos definidos"
                        secondary="Agrega hitos para seguir el progreso"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Gráfico de Avance */}
        <Card sx={{ mb: 4 }}>
          <CardHeader 
            title="Evolución del Avance" 
            titleTypographyProps={{ variant: 'h6' }}
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={seguimientoData.historico_avance}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: es })} 
                />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <RechartsTooltip 
                  formatter={(value, name) => [`${value}%`, name === 'porcentaje' ? 'Avance' : 'Tiempo']}
                  labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="porcentaje" 
                  name="Progreso" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="porcentaje_tiempo" 
                  name="Tiempo Transcurrido" 
                  stroke="#FF8042" 
                  strokeDasharray="5 5" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabla de Actividades */}
        <Card sx={{ mb: 4 }}>
          <CardHeader 
            title="Actividades" 
            titleTypographyProps={{ variant: 'h6' }}
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Inicio</TableCell>
                    <TableCell>Fecha Fin</TableCell>
                    <TableCell>Responsable</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seguimientoData.actividades && seguimientoData.actividades.map((actividad) => (
                    <TableRow key={actividad.id}>
                      <TableCell>{actividad.nombre}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getEstadoIcon(actividad.estado)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {actividad.estado === 'completada' ? 'Completada' : 
                             actividad.estado === 'en_progreso' ? 'En progreso' : 
                             actividad.estado === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {actividad.fecha_inicio 
                          ? format(new Date(actividad.fecha_inicio), 'dd/MM/yyyy', { locale: es }) 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {actividad.fecha_fin 
                          ? format(new Date(actividad.fecha_fin), 'dd/MM/yyyy', { locale: es }) 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{actividad.responsable?.nombre || 'N/A'}</TableCell>
                      <TableCell>
                        <Tooltip title="Actualizar estado">
                          <IconButton size="small" onClick={() => handleOpenActualizarActividad(actividad)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!seguimientoData.actividades || seguimientoData.actividades.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay actividades registradas para este proyecto
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Sección de Comentarios */}
        <Card>
          <CardHeader 
            title="Comentarios y Observaciones" 
            titleTypographyProps={{ variant: 'h6' }}
          />
          <CardContent>
            {seguimientoData.comentarios && seguimientoData.comentarios.length > 0 ? (
              <List>
                {seguimientoData.comentarios.map((comentario, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={format(new Date(comentario.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="text.primary">
                              {comentario.usuario}: 
                            </Typography>
                            {` ${comentario.texto}`}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No hay comentarios registrados sobre el avance del proyecto.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Diálogo para actualizar avance */}
        <Dialog open={openActualizarAvance} onClose={() => setOpenActualizarAvance(false)}>
          <DialogTitle>Actualizar Avance del Proyecto</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Actualiza el porcentaje de avance y añade un comentario para registrar el progreso.
            </DialogContentText>
            <Box sx={{ mt: 2 }}>
              <TextField
                name="porcentaje_completado"
                label="Porcentaje completado"
                type="number"
                fullWidth
                value={avanceForm.porcentaje_completado}
                onChange={handleAvanceChange}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                sx={{ mb: 2 }}
              />
              <TextField
                name="comentarios"
                label="Comentarios"
                multiline
                rows={4}
                fullWidth
                value={avanceForm.comentarios}
                onChange={handleAvanceChange}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenActualizarAvance(false)}>Cancelar</Button>
            <Button onClick={handleActualizarAvance} variant="contained">Guardar</Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para agregar hito */}
        <Dialog open={openAgregarHito} onClose={() => setOpenAgregarHito(false)}>
          <DialogTitle>Agregar Nuevo Hito</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Define un nuevo hito para el seguimiento del proyecto.
            </DialogContentText>
            <Box sx={{ mt: 2 }}>
              <TextField
                name="nombre"
                label="Nombre del hito"
                fullWidth
                value={hitoForm.nombre}
                onChange={handleHitoChange}
                sx={{ mb: 2 }}
              />
              <TextField
                name="descripcion"
                label="Descripción"
                multiline
                rows={3}
                fullWidth
                value={hitoForm.descripcion}
                onChange={handleHitoChange}
                sx={{ mb: 2 }}
              />
              <TextField
                name="fecha_planificada"
                label="Fecha planificada"
                type="date"
                fullWidth
                value={hitoForm.fecha_planificada}
                onChange={handleHitoChange}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel id="completado-label">Estado</InputLabel>
                <Select
                  labelId="completado-label"
                  name="completado"
                  value={hitoForm.completado}
                  onChange={(e) => setHitoForm({...hitoForm, completado: e.target.value === 'true'})}
                  label="Estado"
                >
                  <MenuItem value="false">Pendiente</MenuItem>
                  <MenuItem value="true">Completado</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAgregarHito(false)}>Cancelar</Button>
            <Button onClick={handleAgregarHito} variant="contained">Guardar</Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para actualizar actividad */}
        <Dialog open={openActualizarActividad} onClose={() => setOpenActualizarActividad(false)}>
          <DialogTitle>Actualizar Estado de Actividad</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Actualiza el estado de la actividad y añade un comentario.
            </DialogContentText>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  name="estado"
                  value={actividadForm.estado}
                  onChange={handleActividadChange}
                  label="Estado"
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="en_progreso">En Progreso</MenuItem>
                  <MenuItem value="completada">Completada</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="comentarios"
                label="Comentarios"
                multiline
                rows={4}
                fullWidth
                value={actividadForm.comentarios}
                onChange={handleActividadChange}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenActualizarActividad(false)}>Cancelar</Button>
            <Button onClick={handleActualizarActividad} variant="contained">Guardar</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default ProyectoSeguimiento; 