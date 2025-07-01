import React from 'react';
import {
  Typography,
  Divider,
  Paper,
  Box,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ParticipantesSection from '../participantes/ParticipantesSection';
import ParticipanteDialog from '../participantes/ParticipanteDialog';

/**
 * Sección de participantes del curso.
 * Recibe props desde el hook principal useCursoForm y useParticipantes.
 */
const CursoParticipantesSection = ({
  participantes = [],
  loadingParticipantes,
  errorParticipantes,
  importLoading,
  importError,
  importResult,
  openParticipanteDialog,
  editingParticipante,
  handleOpenParticipanteDialog,
  handleCloseParticipanteDialog,
  handleDeleteParticipante,
  handleReactivarParticipante,
  handleSaveParticipante,
  handleImportCSV,
  handleCertificadoChange,
  handleCertificadoMasivoChange
}) => {
  // Separar participantes activos y retirados
  const participantesActivos = participantes.filter(p => p.estado !== 'retirado');
  const participantesRetirados = participantes.filter(p => p.estado === 'retirado');

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Participantes
        </Typography>
        <Box>
          <Button
            variant="contained"
            component="label"
            color="secondary"
            sx={{ mr: 2 }}
            disabled={importLoading}
          >
            Importar CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleImportCSV(file);
              }}
            />
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenParticipanteDialog()}
          >
            Añadir Participante
          </Button>
        </Box>
      </Box>
      {importLoading && <Alert severity="info">Importando participantes...</Alert>}
      {importError && <Alert severity="error" sx={{ mt: 1 }}>{importError}</Alert>}
      {importResult && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {`Importados: ${importResult.exitosos}, Fallidos: ${importResult.fallidos}`}
          {importResult.errores && importResult.errores.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {importResult.errores.map((err, idx) => (
                <li key={idx}>{err.rut}: {err.error}</li>
              ))}
            </ul>
          )}
        </Alert>
      )}
      <Divider sx={{ mb: 2 }} />
      {loadingParticipantes ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      ) : participantes.length > 0 ? (
        <>
          {/* Participantes activos */}
          <ParticipantesSection
            participantes={participantesActivos}
            tipo="activo"
            loading={loadingParticipantes}
            onEdit={handleOpenParticipanteDialog}
            onRetirar={handleDeleteParticipante}
            onCertificadoChange={handleCertificadoChange}
            onCertificadoMasivoChange={handleCertificadoMasivoChange}
          />
          {/* Participantes retirados */}
          <ParticipantesSection
            participantes={participantesRetirados}
            tipo="retirado"
            loading={loadingParticipantes}
            onReactivar={handleReactivarParticipante}
          />
        </>
      ) : (
        <Alert severity="info" sx={{ mt: 1 }}>
          No hay participantes registrados en este curso.
        </Alert>
      )}

      {/* Diálogo para añadir/editar participante */}
      <ParticipanteDialog
        open={openParticipanteDialog}
        participante={editingParticipante}
        onClose={handleCloseParticipanteDialog}
        onSave={handleSaveParticipante}
        loading={loadingParticipantes}
        error={errorParticipantes}
      />
    </Paper>
  );
};

export default CursoParticipantesSection; 