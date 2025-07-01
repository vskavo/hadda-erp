import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  InputAdornment,
  TextField,
  Grid,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TimerIcon from '@mui/icons-material/Timer';
import UpdateIcon from '@mui/icons-material/Update';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { 
  AlertMessage, 
  Confirm, 
  LoadingIndicator, 
  EmptyState 
} from '../../components/common';
import { cursoService } from '../../services';

// Componente de fila expandible
const ExpandableRow = ({ curso, onDelete, onToggleStatus }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Calcular días transcurridos
  const getDiasTranscurridos = () => {
    if (!curso.fecha_inicio) return null;
    const fechaInicio = new Date(curso.fecha_inicio + 'T00:00:00');
    const hoy = new Date();
    return differenceInDays(hoy, fechaInicio);
  };

  const diasTranscurridos = getDiasTranscurridos();

  // Determinar el color y el ícono según el estado
  const getDiasTranscurridosChipProps = () => {
    if (diasTranscurridos === null) return {};
    
    if (diasTranscurridos < 0) {
      return {
        icon: <CalendarTodayIcon />,
        label: `Inicia en ${Math.abs(diasTranscurridos)} días`,
        color: 'info',
        variant: 'outlined'
      };
    } else {
      return {
        icon: <UpdateIcon />,
        label: `${diasTranscurridos} días transcurridos`,
        color: 'primary',
        variant: 'outlined'
      };
    }
  };

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
        <TableCell component="th" scope="row">
          {curso.id_sence ? (
            <Chip 
              label={curso.id_sence} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          ) : (
            <Chip 
              label="Sin Id" 
              size="small" 
              color="default" 
              variant="outlined" 
            />
          )}
        </TableCell>
        <TableCell>{curso.nombre}</TableCell>
        <TableCell>
          {curso.cliente_razon_social ? (
            <Chip 
              icon={<BusinessIcon />}
              label={curso.cliente_razon_social} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          ) : 'Sin cliente'}
        </TableCell>
        <TableCell>
          {curso.estado === 'activo' || curso.estado === 'Ingresada' ? (
            <Chip 
              label="Activo" 
              color="success" 
              size="small" 
              icon={<CheckCircleIcon />} 
            />
          ) : curso.estado === 'Liquidada' ? (
             <Chip 
               label="Completado" 
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
          )}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Ver/Editar Curso">
              <IconButton
                size="small"
                color="secondary"
                onClick={() => navigate(`/cursos/editar/${curso.id}`)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar curso">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(curso)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={curso.estado === 'activo' ? "Desactivar curso" : "Activar curso"}>
              <IconButton
                size="small"
                color={curso.estado === 'activo' ? 'default' : 'success'}
                onClick={() => onToggleStatus(curso)}
              >
                {curso.estado === 'activo' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom component="div">
                    Proyecto
                  </Typography>
                  {curso.proyecto_nombre ? (
                    <>
                      <Chip 
                        icon={<SchoolIcon />}
                        label={curso.proyecto_nombre} 
                        size="small" 
                        color="info" 
                        variant="outlined" 
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>ID Proyecto:</strong> {curso.proyect_id || 'No disponible'}
                      </Typography>
                    </>
                  ) : 'Sin proyecto'}
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom component="div">
                    Fecha Inicio
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {curso.fecha_inicio ? (
                      <>
                        <Typography variant="body2">
                          {format(new Date(curso.fecha_inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                        </Typography>
                        {diasTranscurridos !== null && (
                          <Chip
                            {...getDiasTranscurridosChipProps()}
                            size="small"
                            sx={{ 
                              maxWidth: 'fit-content',
                              '& .MuiChip-icon': { fontSize: 16 }
                            }}
                          />
                        )}
                      </>
                    ) : 'No definida'}
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom component="div">
                    Participantes
                  </Typography>
                  <Chip 
                    icon={<GroupIcon />} 
                    label={curso.nro_participantes || "0"} 
                    size="small" 
                    color="info" 
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom component="div">
                    Estado SENCE
                  </Typography>
                  {(() => {
                    let color = 'default';
                    if (curso.estado_sence === 'aprobado') color = 'success';
                    else if (curso.estado_sence === 'rechazado') color = 'error';
                    else if (curso.estado_sence === 'en_revision') color = 'warning';
                    
                    return (
                      <Chip 
                        label={curso.estado_sence || 'Pendiente'} 
                        color={color} 
                        size="small" 
                      />
                    );
                  })()}
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const CursosList = () => {
  const [cursos, setCursos] = useState([]);
  const [filteredCursos, setFilteredCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openStatusConfirm, setOpenStatusConfirm] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Cargar cursos
  useEffect(() => {
    fetchCursos();
  }, []);

  // Filtrar cursos cuando cambia el término de búsqueda
  useEffect(() => {
    if (cursos.length > 0) {
      const filtered = cursos.filter(curso => 
        (curso.nombre && curso.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (curso.id_sence && curso.id_sence.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (curso.cliente_razon_social && curso.cliente_razon_social.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (curso.proyecto_nombre && curso.proyecto_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCursos(filtered);
    }
  }, [searchTerm, cursos]);

  const fetchCursos = async () => {
    setLoading(true);
    try {
      // Usar el servicio para obtener cursos sincronizados
      const cursosSincronizados = await cursoService.getCursosSincronizados();
      setCursos(cursosSincronizados);
      setFilteredCursos(cursosSincronizados);
      setError('');
    } catch (err) {
      setError('Error al cargar cursos. ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación de curso
  const handleDeleteCurso = async () => {
    try {
      // Asegurarnos de que el ID es un número
      if (!selectedCurso || !selectedCurso.id) {
        setError('No se ha seleccionado ningún curso para eliminar');
        setOpenDeleteConfirm(false);
        return;
      }
      
      console.log('Eliminando curso con ID:', Number(selectedCurso.id));
      await cursoService.deleteCurso(Number(selectedCurso.id));
      setOpenDeleteConfirm(false);
      setSuccessMessage('Curso eliminado con éxito');
      fetchCursos();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error al eliminar curso:', err);
      setError('Error al eliminar curso. ' + (err.response?.data?.message || err.message || ''));
      setOpenDeleteConfirm(false);
    }
  };

  // Manejar cambio de estado del curso
  const handleToggleStatus = async () => {
    try {
      const newStatus = selectedCurso.estado === 'activo' ? 'inactivo' : 'activo';
      await cursoService.cambiarEstadoCurso(selectedCurso.id, newStatus);
      setOpenStatusConfirm(false);
      setSuccessMessage(`Curso ${newStatus === 'activo' ? 'activado' : 'desactivado'} con éxito`);
      fetchCursos();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error al cambiar estado del curso. ' + (err.response?.data?.message || ''));
      setOpenStatusConfirm(false);
    }
  };

  if (loading && cursos.length === 0) {
    return <LoadingIndicator size="large" message="Cargando cursos..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Cursos
        </Typography>
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
      
      {/* Campo de búsqueda */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre, Id SENCE, cliente o proyecto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {/* Tabla de cursos */}
      {filteredCursos.length > 0 ? (
        <TableContainer component={Paper} sx={{ width: '100%', mb: 2 }}>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>ID SENCE</TableCell>
                <TableCell>Nombre del Curso</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCursos.map((curso) => (
                <ExpandableRow 
                  key={curso.id}
                  curso={curso}
                  onDelete={(curso) => {
                    setSelectedCurso(curso);
                    setOpenDeleteConfirm(true);
                  }}
                  onToggleStatus={(curso) => {
                    setSelectedCurso(curso);
                    setOpenStatusConfirm(true);
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState 
          title="No hay cursos disponibles" 
          description="Los cursos solo pueden ser creados desde el módulo de proyectos."
          icon={<SchoolIcon sx={{ fontSize: 60 }} />}
        />
      )}
      
      {/* Diálogos de confirmación */}
      <Confirm
        open={openDeleteConfirm}
        title="Eliminar Curso"
        message={`¿Está seguro que desea eliminar el curso "${selectedCurso?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteCurso}
        onCancel={() => setOpenDeleteConfirm(false)}
        onClose={() => setOpenDeleteConfirm(false)}
      />
      
      <Confirm
        open={openStatusConfirm}
        title={selectedCurso?.estado === 'activo' ? "Desactivar Curso" : "Activar Curso"}
        message={
          selectedCurso?.estado === 'activo'
            ? `¿Está seguro que desea desactivar el curso "${selectedCurso?.nombre}"?`
            : `¿Está seguro que desea activar el curso "${selectedCurso?.nombre}"?`
        }
        onConfirm={handleToggleStatus}
        onCancel={() => setOpenStatusConfirm(false)}
        onClose={() => setOpenStatusConfirm(false)}
      />
    </Container>
  );
};

export default CursosList; 