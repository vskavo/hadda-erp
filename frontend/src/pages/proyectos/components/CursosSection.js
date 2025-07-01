import React from 'react';
import { 
  Grid, 
  Typography, 
  Button, 
  Divider, 
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

import { formatNumber } from '../utils/formatUtils';

const CursosSection = ({ 
  cursosAgregados,
  openCursoModal,
  cursoTemp,
  searchQuery,
  filteredCursos,
  editingCursoIndex,
  saving,
  handleOpenCursoModal,
  handleCloseCursoModal,
  handleCursoTempChange,
  handleAgregarCurso,
  handleEliminarCurso,
  setSearchQuery,
  bloqueado = false
}) => {
  
  return (
    <>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Detalles del Curso
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleIcon />}
            onClick={() => handleOpenCursoModal()}
            disabled={saving || bloqueado}
          >
            Agregar Curso
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      
      {/* Lista de cursos agregados */}
      <Grid item xs={12}>
        {cursosAgregados.length > 0 ? (
          <TableContainer component={Card}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Código SENCE</TableCell>
                  <TableCell>ID SENCE</TableCell>
                  <TableCell>Horas</TableCell>
                  <TableCell>Participantes</TableCell>
                  <TableCell>Valor por Participante</TableCell>
                  <TableCell>Valor Total</TableCell>
                  <TableCell>Estado SENCE</TableCell>
                  <TableCell>Tipo Contrato</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cursosAgregados.map((curso, index) => (
                  <TableRow key={curso.id || `new-${index}`}>
                    <TableCell title={curso.nombre}>
                      {/* Mostrar el nombre del curso y añadir tooltip si es largo */}
                      {curso.nombre?.length > 30 ? `${curso.nombre.substring(0, 30)}...` : curso.nombre}
                    </TableCell>
                    <TableCell>{curso.codigo_sence}</TableCell>
                    <TableCell>{curso.id_sence}</TableCell>
                    <TableCell title={`${curso.duracion_horas} horas`}>
                      {curso.duracion_horas || 'N/A'}
                    </TableCell>
                    <TableCell>{curso.cantidad_participantes}</TableCell>
                    <TableCell>${formatNumber(curso.valor_participante)}</TableCell>
                    <TableCell>${formatNumber(curso.valor_total)}</TableCell>
                    <TableCell>{curso.estado_sence}</TableCell>
                    <TableCell>{curso.tipo_de_contrato}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenCursoModal(index)}
                        disabled={saving || bloqueado}
                        title="Editar curso"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleEliminarCurso(index)}
                        disabled={saving || bloqueado}
                        title="Eliminar curso"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" color="text.secondary">
                No hay cursos agregados a este proyecto. Haga clic en "Agregar Curso" para comenzar.
              </Typography>
            </CardContent>
          </Card>
        )}
        
        {/* Valor total de cursos */}
        {cursosAgregados.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Valor Ingreso Cursos: ${formatNumber(
                cursosAgregados.reduce(
                  (total, curso) => total + parseFloat(curso.valor_total || 0), 
                  0
                )
              )}
            </Typography>
          </Box>
        )}
      </Grid>
      
      {/* Modal para añadir nuevo curso */}
      <Dialog open={openCursoModal} onClose={handleCloseCursoModal} maxWidth="md" fullWidth>
        <DialogTitle>{editingCursoIndex >= 0 ? 'Editar Curso' : 'Agregar Nuevo Curso al Proyecto'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Selector de curso con búsqueda */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Curso</InputLabel>
                <Select
                  name="curso_sence_id"
                  value={cursoTemp.curso_sence_id}
                  onChange={handleCursoTempChange}
                  disabled={saving || bloqueado}
                  label="Curso"
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                    disableAutoFocusItem: true,
                    autoFocus: false
                  }}
                >
                  <MenuItem 
                    value="" 
                    style={{ padding: '8px', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TextField
                      fullWidth
                      placeholder="Buscar curso..."
                      size="small"
                      value={searchQuery}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSearchQuery(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </MenuItem>
                  <Divider />
                  {searchQuery && filteredCursos.length === 0 && (
                    <MenuItem disabled>
                      No se encontraron resultados
                    </MenuItem>
                  )}
                  {filteredCursos.map(curso => (
                    <MenuItem key={curso.id} value={curso.id}>
                      {curso.nombre_curso}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Cantidad de participantes */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Cantidad de Participantes"
                name="cantidad_participantes"
                type="text"
                value={formatNumber(cursoTemp.cantidad_participantes)}
                onChange={handleCursoTempChange}
                disabled={saving || bloqueado}
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
            </Grid>
            
            {/* Horas del curso */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Horas del Curso"
                name="duracion_horas"
                value={cursoTemp.duracion_horas}
                onChange={handleCursoTempChange}
                type="number"
                required
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
            </Grid>
            
            {/* Valor por persona */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor sence por persona"
                name="valor_por_persona"
                type="text"
                value={formatNumber(cursoTemp.valor_por_persona)}
                disabled={true}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            {/* Valor por participante */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor por participante"
                name="valor_participante"
                type="text"
                value={formatNumber(cursoTemp.valor_participante)}
                onChange={handleCursoTempChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Valor total curso */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor total curso"
                name="valor_total"
                type="text"
                value={formatNumber(cursoTemp.valor_total)}
                onChange={handleCursoTempChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            {/* Código SENCE */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                id="codigo_sence"
                name="codigo_sence"
                label="Código SENCE"
                value={cursoTemp.codigo_sence}
                onChange={handleCursoTempChange}
                disabled={Boolean(cursoTemp.curso_sence_id) || bloqueado}
              />
            </Grid>
            
            {/* ID SENCE */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                id="id_sence"
                name="id_sence"
                label="ID SENCE"
                value={cursoTemp.id_sence}
                onChange={handleCursoTempChange}
              />
            </Grid>
            
            {/* Modalidad */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Modalidad"
                name="modalidad"
                value={cursoTemp.modalidad}
                disabled={true}
              />
            </Grid>
            
            {/* Estado SENCE */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado SENCE</InputLabel>
                <Select
                  name="estado_sence"
                  value={cursoTemp.estado_sence}
                  onChange={handleCursoTempChange}
                  label="Estado SENCE"
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="aprobado">Aprobado</MenuItem>
                  <MenuItem value="rechazado">Rechazado</MenuItem>
                  <MenuItem value="en_revision">En Revisión</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Tipo de Contrato */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Contrato</InputLabel>
                <Select
                  name="tipo_de_contrato"
                  value={cursoTemp.tipo_de_contrato}
                  onChange={handleCursoTempChange}
                  label="Tipo de Contrato"
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="Pre-Contrato">Pre-Contrato</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Estado Pre-Contrato */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado Pre-Contrato</InputLabel>
                <Select
                  name="estado_pre_contrato"
                  value={cursoTemp.estado_pre_contrato}
                  onChange={handleCursoTempChange}
                  label="Estado Pre-Contrato"
                >
                  <MenuItem value="No Aplica">No Aplica</MenuItem>
                  <MenuItem value="Enviado">Enviado</MenuItem>
                  <MenuItem value="Aprobado">Aprobado</MenuItem>
                  <MenuItem value="Con Observación">Con Observación</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseCursoModal} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={handleAgregarCurso} 
            color="primary" 
            variant="contained"
          >
            {editingCursoIndex >= 0 ? 'Actualizar Curso' : 'Agregar Curso'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CursosSection; 