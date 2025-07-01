import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Button,
  Divider,
  FormControlLabel,
  TextField,
  Chip
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertMessage, LoadingIndicator } from '../../../components/common';

const AsistenciaForm = () => {
  const { cursoId, sesionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [curso, setCurso] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estado para controlar selección de todos
  const [selectAll, setSelectAll] = useState(false);
  
  // Estado para comentarios de cada asistencia
  const [comentarios, setComentarios] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar información del curso
        const cursoResponse = await axios.get(`/api/cursos/${cursoId}`);
        setCurso(cursoResponse.data);
        
        // Cargar información de la sesión
        const sesionResponse = await axios.get(`/api/sesiones/${sesionId}`);
        setSesion(sesionResponse.data);
        
        // Cargar participantes del curso
        const participantesResponse = await axios.get(`/api/cursos/${cursoId}/participantes`);
        setParticipantes(participantesResponse.data);
        
        // Cargar asistencias existentes
        const asistenciasResponse = await axios.get(`/api/sesiones/${sesionId}/asistencias`);
        const asistenciasData = asistenciasResponse.data;
        
        // Inicializar estado de asistencias y comentarios
        const asistenciaIds = new Set(asistenciasData.map(a => a.participanteId));
        setAsistencias(asistenciaIds);
        
        // Inicializar comentarios
        const comentariosObj = {};
        asistenciasData.forEach(a => {
          if (a.comentario) {
            comentariosObj[a.participanteId] = a.comentario;
          }
        });
        setComentarios(comentariosObj);
        
        // Verificar si todos están presentes
        if (participantesResponse.data.length > 0 && 
            asistenciaIds.size === participantesResponse.data.length) {
          setSelectAll(true);
        }
        
        setError('');
      } catch (err) {
        setError('Error al cargar los datos: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cursoId, sesionId]);

  // Manejar cambio en asistencia
  const handleAsistenciaChange = (participanteId) => {
    const newAsistencias = new Set(asistencias);
    
    if (newAsistencias.has(participanteId)) {
      newAsistencias.delete(participanteId);
    } else {
      newAsistencias.add(participanteId);
    }
    
    setAsistencias(newAsistencias);
    
    // Actualizar estado de "seleccionar todos"
    setSelectAll(newAsistencias.size === participantes.length);
  };

  // Manejar "seleccionar todos"
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    const newAsistencias = new Set();
    if (newSelectAll) {
      // Seleccionar todos
      participantes.forEach(p => newAsistencias.add(p.id));
    }
    
    setAsistencias(newAsistencias);
  };

  // Manejar cambio en comentarios
  const handleComentarioChange = (participanteId, comentario) => {
    setComentarios({
      ...comentarios,
      [participanteId]: comentario
    });
  };

  // Guardar asistencias
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Preparar datos para enviar
      const asistenciasData = participantes.map(participante => ({
        sesionId: parseInt(sesionId),
        participanteId: participante.id,
        presente: asistencias.has(participante.id),
        comentario: comentarios[participante.id] || ''
      }));
      
      // Enviar datos al servidor
      await axios.post(`/api/sesiones/${sesionId}/asistencias/bulk`, {
        asistencias: asistenciasData
      });
      
      setSuccessMessage('Asistencia registrada con éxito');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(`/cursos/${cursoId}`);
      }, 2000);
    } catch (err) {
      setError('Error al guardar la asistencia: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingIndicator message="Cargando datos..." />;
  }

  if (!curso || !sesion) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <AlertMessage
          type="error"
          message="No se pudieron encontrar los datos solicitados"
          show={true}
        />
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained"
            onClick={() => navigate(`/cursos/${cursoId}`)}
          >
            Volver al Curso
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Registro de Asistencia
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            Curso: {curso.nombre}
          </Typography>
          <Typography variant="subtitle1">
            Sesión: {sesion.tema || 'Sin tema'} ({sesion.fecha ? format(new Date(sesion.fecha), 'dd MMMM yyyy', { locale: es }) : 'Fecha no definida'})
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Horario: {sesion.horaInicio || '00:00'} - {sesion.horaFin || '00:00'}
          </Typography>
        </Box>
        
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
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectAll}
                  onChange={handleSelectAll}
                  color="primary"
                />
              }
              label="Seleccionar Todos"
            />
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {participantes.length === 0 ? (
            <Typography sx={{ my: 4, textAlign: 'center' }}>
              No hay participantes registrados en este curso
            </Typography>
          ) : (
            <List>
              {participantes.map((participante) => (
                <ListItem 
                  key={participante.id} 
                  divider
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      checked={asistencias.has(participante.id)}
                      onChange={() => handleAsistenciaChange(participante.id)}
                      inputProps={{ 'aria-labelledby': `participante-${participante.id}` }}
                    />
                  }
                >
                  <ListItemText
                    id={`participante-${participante.id}`}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography>{`${participante.nombre} ${participante.apellido}`}</Typography>
                        {participante.empresa && (
                          <Chip 
                            label={participante.empresa} 
                            size="small" 
                            variant="outlined" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Comentario (opcional)"
                        value={comentarios[participante.id] || ''}
                        onChange={(e) => handleComentarioChange(participante.id, e.target.value)}
                        variant="outlined"
                        margin="dense"
                        disabled={!asistencias.has(participante.id)}
                      />
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/cursos/${cursoId}`)}
              sx={{ mr: 2 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || participantes.length === 0}
            >
              Guardar Asistencia
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default AsistenciaForm; 