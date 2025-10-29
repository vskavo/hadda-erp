import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid
  } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertMessage, LoadingIndicator } from '../../components/common';
import { useCursoForm } from './hooks/useCursoForm';
import { useParticipantes } from './hooks/useParticipantes';
import CursoInfoSection from './components/CursoInfoSection';
import CursoFinanzasSection from './components/CursoFinanzasSection';
import CursoParticipantesSection from './components/CursoParticipantesSection';
import CursoDeclaracionesSection from './components/CursoDeclaracionesSection';

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

        {cursoForm.syncResult && cursoForm.syncResult.success && (
          <AlertMessage
            type="success"
            message={`Sincronización completada: ${cursoForm.syncResult.participantes_procesados || 0} participantes procesados, ${cursoForm.syncResult.asistencias_creadas || 0} asistencias creadas.`}
            show={!!cursoForm.syncResult}
            onClose={() => cursoForm.setSyncResult(null)}
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
              <CursoInfoSection
                {...cursoForm}
                handleSyncSence={() => cursoForm.handleSyncSence(() => {
                  // Recargar participantes después de sincronización exitosa
                  participantesHook.loadParticipantes();
                })}
              />
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