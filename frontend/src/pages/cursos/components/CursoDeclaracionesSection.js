import React from 'react';
import {
  Grid,
  Typography,
  Divider,
  Paper,
  Box,
  Button,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import DescriptionIcon from '@mui/icons-material/Description';
import CancelIcon from '@mui/icons-material/Cancel';
import { EmptyState } from '../../../components/common';

/**
 * Sección de declaraciones juradas del curso.
 * Recibe props desde el hook principal useCursoForm.
 */
const CursoDeclaracionesSection = ({
  formik,
  declaraciones,
  handleSyncDeclaraciones,
  cancelSyncDeclaraciones,
  syncLoading,
  declaracionesSyncStatus,
  declaracionesSyncProgress,
  declaracionesSyncMessage
}) => {
  // Renderizar el estado de sincronización
  const renderSyncStatus = () => {
    if (declaracionesSyncStatus === 'idle') return null;
    
    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            {declaracionesSyncMessage || 'Procesando...'}
          </Typography>
          {declaracionesSyncStatus === 'polling' && (
            <CircularProgress size={20} />
          )}
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={declaracionesSyncProgress} 
          sx={{ height: 8, borderRadius: 4 }}
        />
        {(declaracionesSyncStatus === 'polling' || declaracionesSyncStatus === 'initializing') && (
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelIcon />}
              onClick={cancelSyncDeclaraciones}
            >
              Cancelar
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>Declaraciones Juradas</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={syncLoading ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
          onClick={handleSyncDeclaraciones}
          disabled={syncLoading}
        >
          {syncLoading ? 'Sincronizando...' : 'Sincronizar'}
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {/* Mostrar el estado de sincronización */}
      {renderSyncStatus()}
      
      {formik.values.id_sence ? (
        declaraciones.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID SENCE</TableCell>
                  <TableCell>RUT</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Sesiones</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {declaraciones.map((declaracion) => (
                  <TableRow key={declaracion.id}>
                    <TableCell>{declaracion.id_sence || 'No disponible'}</TableCell>
                    <TableCell>{declaracion.rut || 'No disponible'}</TableCell>
                    <TableCell>{declaracion.nombre || 'No disponible'}</TableCell>
                    <TableCell>{declaracion.sesiones || '0'}</TableCell>
                    <TableCell>
                      <Chip
                        label={declaracion.estado}
                        color={
                          declaracion.estado?.toLowerCase() === 'emitida' ? 'success' :
                          declaracion.estado?.toLowerCase() === 'pendiente' ? 'warning' :
                          declaracion.estado?.toLowerCase() === 'rechazada' ? 'error' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          syncLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <EmptyState
              icon={<DescriptionIcon sx={{ fontSize: 60 }} />}
              title="No hay declaraciones juradas"
              description="No hay declaraciones juradas disponibles para este curso."
            />
          )
        )
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          Este curso no tiene un ID SENCE asignado, por lo que no hay declaraciones juradas asociadas.
        </Alert>
      )}
    </Paper>
  );
};

export default CursoDeclaracionesSection; 