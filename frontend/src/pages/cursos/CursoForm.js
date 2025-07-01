import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Alert,
  Autocomplete,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertMessage, LoadingIndicator, EmptyState } from '../../components/common';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SyncIcon from '@mui/icons-material/Sync';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import ParticipanteDialog from './participantes/ParticipanteDialog';
import Papa from 'papaparse';
import ParticipantesSection from './participantes/ParticipantesSection';
import usuarioService from '../../services/usuarioService';
import DescriptionIcon from '@mui/icons-material/Description';
import { useCursoForm } from './hooks/useCursoForm';
import { useParticipantes } from './hooks/useParticipantes';
import CursoInfoSection from './components/CursoInfoSection';
import CursoFinanzasSection from './components/CursoFinanzasSection';
import CursoParticipantesSection from './components/CursoParticipantesSection';
import CursoDeclaracionesSection from './components/CursoDeclaracionesSection';

// Esquema de validación (mantenemos para compatibilidad)
const validationSchema = yup.object({
  // Solo validamos id_sence cuando estamos editando
  id_sence: yup
    .string()
    .max(50, 'El ID SENCE no debe exceder los 50 caracteres'),
  // El resto de validaciones solo aplican para nuevo curso
  nombre: yup.string().when('$isEditing', {
    is: false,
    then: () => yup
    .string()
    .required('El nombre del curso es obligatorio')
    .max(200, 'El nombre no debe exceder los 200 caracteres'),
  }),
  codigo_sence: yup.string().when('$isEditing', {
    is: false,
    then: () => yup
    .string()
      .max(50, 'El código SENCE no debe exceder los 50 caracteres'),
  }),
  duracion_horas: yup.number().when('$isEditing', {
    is: false,
    then: () => yup
    .number()
    .positive('La duración debe ser un número positivo')
    .integer('La duración debe ser un número entero')
      .required('La duración en horas es obligatoria')
    .typeError('La duración debe ser un número'),
  }),
  valor_hora: yup.number().when('$isEditing', {
    is: false,
    then: () => yup
    .number()
      .positive('El valor por hora debe ser un número positivo')
      .required('El valor por hora es obligatorio')
      .typeError('El valor por hora debe ser un número'),
  }),
  valor_total: yup.number().when('$isEditing', {
    is: false,
    then: () => yup
    .number()
      .positive('El valor total debe ser un número positivo')
      .required('El valor total es obligatorio')
      .typeError('El valor total debe ser un número'),
  }),
  modalidad: yup.string().when('$isEditing', {
    is: false,
    then: () => yup
    .string()
    .required('La modalidad es obligatoria'),
  }),
  nro_participantes: yup.number().when('$isEditing', {
    is: false,
    then: () => yup
      .number()
      .min(0, 'El número de participantes no puede ser negativo')
      .integer('El número de participantes debe ser un número entero')
      .typeError('El número de participantes debe ser un número'),
  }),
  estado_sence: yup.string().oneOf(
    ['pendiente', 'aprobado', 'rechazado', 'en_revision'],
    'Estado SENCE no válido'
  ),
  tipo_de_contrato: yup.string().max(100, 'El tipo de contrato no debe exceder los 100 caracteres'),
  estado_pre_contrato: yup.string().max(100, 'El estado de pre-contrato no debe exceder los 100 caracteres')
});

/**
 * Formulario de curso refactorizado.
 * Utiliza hooks personalizados para separar la lógica de la UI.
 */
const CursoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Usar el hook principal para manejar la lógica del formulario
  const cursoForm = useCursoForm({ id });
  
  // Usar el hook de participantes para manejar la lógica de participantes
  const participantesHook = useParticipantes({ 
    cursoId: id,
    onUpdateSuccess: (data) => {
      // Actualizar contadores en el formulario principal según el tipo de operación
      if (data.type === 'delete') {
        // Actualizar el contador de participantes eliminados
        const newEliminados = (cursoForm.formik.values.participantes_eliminados || 0) + 1;
        cursoForm.formik.setFieldValue('participantes_eliminados', newEliminados);
        
        // Actualizar número de participantes
        const newCount = Math.max(0, (cursoForm.formik.values.nro_participantes || 0) - 1);
        cursoForm.formik.setFieldValue('nro_participantes', newCount);
        
        // Enviar actualización al servidor
        axios.put(`/api/cursos/${id}`, { 
          id_sence: cursoForm.formik.values.id_sence,
          nro_participantes: newCount,
          participantes_eliminados: newEliminados
        }).catch(err => console.error('Error actualizando contadores:', err));
      } else if (data.type === 'add') {
        // Actualizar número de participantes
        const newCount = (cursoForm.formik.values.nro_participantes || 0) + 1;
        cursoForm.formik.setFieldValue('nro_participantes', newCount);
        
        // Enviar actualización al servidor
        axios.put(`/api/cursos/${id}`, { 
          id_sence: cursoForm.formik.values.id_sence,
          nro_participantes: newCount
        }).catch(err => console.error('Error actualizando contadores:', err));
      }
    }
  });

  if (cursoForm.loading) {
    return <LoadingIndicator message="Cargando datos del curso..." />;
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Button 
            variant="text" 
            onClick={() => navigate('/cursos')}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            {cursoForm.isEditing ? 'Editar Curso' : 'Nuevo Curso'}
          </Typography>
        </Box>
        
        {cursoForm.error && (
          <AlertMessage
            type="error"
            message={cursoForm.error}
            show={!!cursoForm.error}
            onClose={() => cursoForm.setError('')}
            sx={{ mb: 2 }}
          />
        )}
        
        {cursoForm.successMessage && (
          <AlertMessage
            type="success"
            message={cursoForm.successMessage}
            show={!!cursoForm.successMessage}
            onClose={() => cursoForm.setSuccessMessage('')}
            sx={{ mb: 2 }}
          />
        )}
        
        {participantesHook.successMessage && (
          <AlertMessage
            type="success"
            message={participantesHook.successMessage}
            show={!!participantesHook.successMessage}
            onClose={() => participantesHook.setSuccessMessage('')}
            sx={{ mb: 2 }}
          />
        )}
        
        <form onSubmit={cursoForm.formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Información del curso */}
            <Grid item xs={12} md={6}>
              <CursoInfoSection {...cursoForm} />
            </Grid>
            
            {/* Información financiera y proyecto */}
            <Grid item xs={12} md={6}>
              <CursoFinanzasSection {...cursoForm} navigate={navigate} />
            </Grid>
            
            {/* Sección de Participantes - Solo mostrar en modo edición */}
            {cursoForm.isEditing && (
              <Grid item xs={12}>
                <CursoParticipantesSection 
                  // Pasamos props del hook de participantes
                  participantes={participantesHook.participantes}
                  loadingParticipantes={participantesHook.loadingParticipantes}
                  errorParticipantes={participantesHook.errorParticipantes}
                  importLoading={participantesHook.importLoading}
                  importError={participantesHook.importError}
                  importResult={participantesHook.importResult}
                  openParticipanteDialog={participantesHook.openParticipanteDialog}
                  editingParticipante={participantesHook.editingParticipante}
                  handleOpenParticipanteDialog={participantesHook.handleOpenParticipanteDialog}
                  handleCloseParticipanteDialog={participantesHook.handleCloseParticipanteDialog}
                  handleDeleteParticipante={participantesHook.handleDeleteParticipante}
                  handleReactivarParticipante={participantesHook.handleReactivarParticipante}
                  handleSaveParticipante={participantesHook.handleSaveParticipante}
                  handleImportCSV={participantesHook.handleImportCSV}
                  handleCertificadoChange={participantesHook.handleCertificadoChange}
                  handleCertificadoMasivoChange={participantesHook.handleCertificadoMasivoChange}
                />
              </Grid>
            )}

            {/* Sección de Declaraciones - Solo mostrar en modo edición */}
            {cursoForm.isEditing && (
              <Grid item xs={12}>
                <CursoDeclaracionesSection 
                  formik={cursoForm.formik}
                  declaraciones={cursoForm.declaraciones}
                  handleSyncDeclaraciones={cursoForm.handleSyncDeclaraciones}
                  cancelSyncDeclaraciones={cursoForm.cancelSyncDeclaraciones}
                  syncLoading={cursoForm.syncLoading}
                  declaracionesSyncStatus={cursoForm.declaracionesSyncStatus}
                  declaracionesSyncProgress={cursoForm.declaracionesSyncProgress}
                  declaracionesSyncMessage={cursoForm.declaracionesSyncMessage}
                />
              </Grid>
            )}
            
            {/* Sección de botones de acción */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/cursos')}
                  sx={{ mr: 2 }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary" 
                  disabled={cursoForm.formik.isSubmitting}
                  onClick={cursoForm.handleSubmit}
                >
                  {cursoForm.isEditing ? 'Actualizar Información' : 'Crear Curso'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CursoForm; 