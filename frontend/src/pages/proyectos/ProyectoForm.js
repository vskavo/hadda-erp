import React, { useState, useEffect } from 'react';
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
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useParams } from 'react-router-dom';

import { AlertMessage, LoadingIndicator } from '../../components/common';
import { usuarioService, comisionService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

// Componentes modulares
import ClienteSelector from './components/ClienteSelector';
import CursosSection from './components/CursosSection';
import CostosSection from './components/CostosSection';
import InformacionFinanciera from './components/InformacionFinanciera';

// Hooks personalizados
import { useProyectoForm } from './hooks/useProyectoForm';
import { useCursos } from './hooks/useCursos';
import { useCostos } from './hooks/useCostos';

const ProyectoFormPage = () => {
  // Obtener ID del proyecto desde la URL
  const { id } = useParams();
  
  // Estado para usuarios (necesario para los costos)
  const [usuarios, setUsuarios] = useState([]);
  
  // Obtener funcionalidad del hook principal
  const {
    formData,
    setFormData,
    isEditing,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    clientes,
    setClientes,
    responsablesDisponibles,
    holdings,
    holdingFilter,
    empresaFilter,
    rutFilter,
    filteredClientes,
    ivaValue,
    retencionHonorariosValue,
    gastosAdminSettingValue,
    handleChange,
    handleDateChange,
    handleSubmit,
    handleVolver,
    handleHoldingChange,
    handleEmpresaChange,
    handleRutChange,
    calcularPPM,
    ppmCalculatedValue,
    ppmPercentage,
    fondoAhorroCalculatedValue,
    fondoAhorroPercentage,
    comisionVentaPercentage,
    comisionVentaCalculatedValue,
    calcularComisionVentas,
    calcularFondoAhorro,
    handleAprobarProyecto,
    usarComisionManual,
    comisionManual,
    tipoComision,
    fuenteComision,
    handleToggleComisionManual,
    handleChangeComisionManual
  } = useProyectoForm();
  
  // Obtener funcionalidad de cursos
  const {
    cursosAgregados,
    cursoTemp,
    openCursoModal,
    editingCursoIndex,
    searchQuery,
    setSearchQuery,
    filteredCursos,
    handleOpenCursoModal,
    handleCloseCursoModal,
    handleCursoTempChange,
    handleAgregarCurso,
    handleEliminarCurso,
    getCursosParaGuardar,
    calcularValorIngresosCursos
  } = useCursos(isEditing ? id : null, formData, setError);
  
  // Obtener funcionalidad de costos
  const {
    costos,
    openCostoModal,
    nuevoCosto,
    costoTotalBase,
    totalIVAAplicado,
    totalCostosHonorariosBase,
    totalRetencionHonorarios,
    handleOpenCostoModal,
    handleCloseCostoModal,
    handleCostoInputChange,
    handleCostoSwitchChange,
    handleCostoDateChange,
    handleAgregarCosto,
    handleEliminarCosto,
    getCostosParaGuardar,
    editingCostoId,
    handleEditCosto
  } = useCostos(isEditing ? id : null, setError, ivaValue, retencionHonorariosValue);
  
  const { user } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  const [isResponsableDisabled, setIsResponsableDisabled] = useState(false);
  const [isCalculatingComision, setIsCalculatingComision] = useState(false);
  
  const PERMISO_ASIGNAR_RESPONSABLE = 'proyectos:assign:responsable';
  
  const bloqueado = !!(isEditing && formData.aprobado);
  
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const usuariosResponse = await usuarioService.getUsuarios();
        setUsuarios(usuariosResponse.usuarios || []);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };
    
    fetchUsuarios();
  }, []);
  
  useEffect(() => {
    if (!permissionsLoading) { 
      const puedeAsignar = hasPermission(PERMISO_ASIGNAR_RESPONSABLE);
      setIsResponsableDisabled(!puedeAsignar && user?.rol !== 'administrador');
    }
  }, [permissionsLoading, hasPermission, user, PERMISO_ASIGNAR_RESPONSABLE]);
  
  const handleFormSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    try {
      console.log('Inicio de handleFormSubmit. ID del proyecto:', id);
      console.log('Cursos agregados:', cursosAgregados);
      
      const valorTotalCursos = calcularValorIngresosCursos();
      console.log('Valor total de cursos calculado:', valorTotalCursos);
      
      const cursosParaGuardar = getCursosParaGuardar();
      console.log('Cursos preparados para guardar:', cursosParaGuardar);
      
      let errores = [];
      cursosParaGuardar.forEach((curso, index) => {
        if (!curso.nombre) {
          console.error(`Curso #${index + 1} no tiene nombre!`);
          errores.push(`El curso #${index + 1} no tiene nombre`);
        }
        
        const tieneHorasCurso = curso.horas_curso !== undefined && curso.horas_curso !== null && !isNaN(parseInt(curso.horas_curso));
        const horasValidas = tieneHorasCurso && parseInt(curso.horas_curso) >= 0;
        
        if (!horasValidas) {
          console.error(`Curso #${index + 1} (${curso.nombre}) no tiene horas definidas o no son válidas! Valor:`, curso.horas_curso);
          errores.push(`El curso "${curso.nombre}" no tiene horas definidas o no son válidas`);
        }
      });
      
      if (errores.length > 0) {
        setError(`Se encontraron errores: ${errores.join(', ')}`);
        return;
      }
      
      const updatedFormData = {
        ...formData,
        presupuesto: valorTotalCursos.toString(),
        cursos: cursosParaGuardar
      };
      
      console.log('FormData a enviar:', JSON.stringify(updatedFormData, null, 2));
      
      await handleSubmit(e, updatedFormData);
      
      await getCostosParaGuardar();
      
      setSuccess('Proyecto guardado correctamente');
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      setError('Error al guardar proyecto: ' + error.message);
    }
  };
  
  const valorTotalIngresosCursos = calcularValorIngresosCursos();
  
  useEffect(() => {
    if (calcularPPM) {
      calcularPPM(valorTotalIngresosCursos);
    }
  }, [valorTotalIngresosCursos, calcularPPM]);
  
  useEffect(() => {
    if (calcularFondoAhorro) { 
      calcularFondoAhorro(valorTotalIngresosCursos);
    }
  }, [valorTotalIngresosCursos, calcularFondoAhorro]);
  
  useEffect(() => {
    const calcularRentabilidadYComision = async () => {
      if (!formData.responsable_id || !(valorTotalIngresosCursos > 0)) {
        setIsCalculatingComision(false);
        if (calcularComisionVentas) {
           await calcularComisionVentas(0, formData.responsable_id, valorTotalIngresosCursos, 0);
        }
        return;
      }

      setIsCalculatingComision(true);
      try {
        const ingresos = valorTotalIngresosCursos || 0;
        const costosSinComision = (costoTotalBase || 0) +
                                 (totalCostosHonorariosBase || 0) +
                                 (totalIVAAplicado || 0) +
                                 (totalRetencionHonorarios || 0) +
                                 (ppmCalculatedValue || 0) +
                                 (gastosAdminSettingValue || 0) +
                                 (fondoAhorroCalculatedValue || 0);

        let comisionPctActual = 0;
        let comisionPctAnterior = -1;
        let rentabilidadCalculada = 0;
        let iteracion = 0;
        const MAX_ITERACIONES = 5;

        while (comisionPctActual !== comisionPctAnterior && iteracion < MAX_ITERACIONES) {
          iteracion++;
          comisionPctAnterior = comisionPctActual;
          const valorComisionActual = (ingresos * comisionPctActual) / 100;
          const costosTotales = costosSinComision + valorComisionActual;
          rentabilidadCalculada = (ingresos > 0) ? ((ingresos - costosTotales) / ingresos) * 100 : 0;

          try {
            const comisionData = await comisionService.getComisionByMargenAndRol(rentabilidadCalculada, formData.responsable_id);
            comisionPctActual = comisionData?.comisionPorcentaje || 0;
          } catch (error) {
            // Si no se encuentra rango de comisión o hay error en API, asumir 0%
            console.warn(`No se encontró rango de comisión para margen ${rentabilidadCalculada.toFixed(2)}% o error API. Asumiendo 0% comisión. Error: ${error.message || error}`);
            comisionPctActual = 0;
            // No hacemos break, permitimos que el bucle continúe e intente converger con 0% comisión.
          }
        }

        if (iteracion >= MAX_ITERACIONES && comisionPctActual !== comisionPctAnterior) {
           console.warn(`Cálculo de comisión no convergió después de ${MAX_ITERACIONES} iteraciones. Usando último valor: ${comisionPctActual}%`);
        }

        if (calcularComisionVentas) {
          await calcularComisionVentas(rentabilidadCalculada, formData.responsable_id, ingresos, comisionPctActual);
        }
      } catch (error) {
        console.error("Error detallado durante cálculo de comisión y rentabilidad:", error);
      } finally {
        setIsCalculatingComision(false);
      }
    };

    calcularRentabilidadYComision();
  }, [
    valorTotalIngresosCursos,
    costoTotalBase,
    totalCostosHonorariosBase,
    totalIVAAplicado,
    totalRetencionHonorarios,
    ppmCalculatedValue,
    gastosAdminSettingValue,
    fondoAhorroCalculatedValue,
    formData.responsable_id,
    calcularComisionVentas,
    // No incluir isCalculatingComision o setIsCalculatingComision aquí
  ]);
  
  if (loading) {
    return <LoadingIndicator />;
  }
  
  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleVolver}
            sx={{ mr: 2 }}
          >
            Volver a Ventas
          </Button>
          <Typography variant="h5" component="h1">
            {isEditing ? 'Cotizador' : 'Cotizador'}
          </Typography>
        </Box>
        
        {isEditing && formData.aprobado && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            borderRadius: 1, 
            border: '1px solid', 
            borderColor: 'success.main',
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <Typography variant="h6" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
              <span role="img" aria-label="check" style={{ marginRight: '8px', fontSize: '24px' }}>✅</span>
              COTIZADOR APROBADO
            </Typography>
            <Typography color="success.main" sx={{ ml: 2 }}>
              Este proyecto ha sido aprobado y está listo para su ejecución.
            </Typography>
          </Box>
        )}
        
        {error && <AlertMessage severity="error" message={error} sx={{ mb: 2 }} />}
        {success && <AlertMessage severity="success" message={success} sx={{ mb: 2 }} />}
        
        <form onSubmit={handleFormSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
              {/* Mostrar el ID único del proyecto solo en edición, alineado a la derecha */}
              {isEditing && formData.proyect_id && (
                <TextField
                  label="ID Único del Proyecto"
                  value={formData.proyect_id}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                  margin="none"
                  sx={{ minWidth: 280 }}
                />
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nombre del Proyecto"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                disabled={saving || bloqueado}
              />
            </Grid>
            
            <ClienteSelector 
              formData={formData}
              clientes={clientes}
              holdings={holdings}
              holdingFilter={holdingFilter}
              empresaFilter={empresaFilter}
              rutFilter={rutFilter}
              filteredClientes={filteredClientes}
              handleHoldingChange={handleHoldingChange}
              handleEmpresaChange={handleEmpresaChange}
              handleRutChange={handleRutChange}
              saving={saving || bloqueado}
              setClientes={setClientes}
              setFormData={setFormData}
            />
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={es}>
                <DatePicker
                  label="Fecha de Inicio"
                  value={formData.fecha_inicio}
                  onChange={handleDateChange('fecha_inicio')}
                  disabled={saving || bloqueado}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required 
                      disabled={saving || bloqueado}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={es}>
                <DatePicker
                  required
                  label="Fecha de Finalización (estimada)"
                  value={formData.fecha_fin}
                  onChange={handleDateChange('fecha_fin')}
                  disabled={saving || bloqueado}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      disabled={saving || bloqueado}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  disabled={saving || bloqueado}
                  label="Estado"
                >
                  <MenuItem value="No iniciado">No iniciado</MenuItem>
                  <MenuItem value="En curso">En curso</MenuItem>
                  <MenuItem value="Liquidado">Liquidado</MenuItem>
                  <MenuItem value="Facturado">Facturado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  disabled={saving || bloqueado}
                  label="Prioridad"
                >
                  <MenuItem value="baja">Baja</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="urgente">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Responsable</InputLabel>
                <Select
                  name="responsable_id"
                  value={formData.responsable_id}
                  onChange={handleChange}
                  disabled={isResponsableDisabled || bloqueado}
                  label="Responsable"
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {responsablesDisponibles.map(usuario => (
                    <MenuItem key={usuario.id} value={usuario.id}>
                      {`${usuario.nombre} ${usuario.apellido}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <CursosSection 
              cursosAgregados={cursosAgregados}
              openCursoModal={openCursoModal}
              cursoTemp={cursoTemp}
              searchQuery={searchQuery}
              filteredCursos={filteredCursos}
              editingCursoIndex={editingCursoIndex}
              saving={saving || bloqueado}
              handleOpenCursoModal={handleOpenCursoModal}
              handleCloseCursoModal={handleCloseCursoModal}
              handleCursoTempChange={handleCursoTempChange}
              handleAgregarCurso={handleAgregarCurso}
              handleEliminarCurso={handleEliminarCurso}
              setSearchQuery={setSearchQuery}
              bloqueado={bloqueado}
            />
            
            <CostosSection 
              costos={costos}
              openCostoModal={openCostoModal}
              nuevoCosto={nuevoCosto}
              usuarios={usuarios}
              saving={saving || bloqueado}
              editingCostoId={editingCostoId}
              handleOpenCostoModal={handleOpenCostoModal}
              handleCloseCostoModal={handleCloseCostoModal}
              handleCostoInputChange={handleCostoInputChange}
              handleCostoSwitchChange={handleCostoSwitchChange}
              handleCostoDateChange={handleCostoDateChange}
              handleAgregarCosto={handleAgregarCosto}
              handleEliminarCosto={handleEliminarCosto}
              handleEditCosto={handleEditCosto}
              bloqueado={bloqueado}
            />
            
            <InformacionFinanciera 
              valorIngresoCursos={valorTotalIngresosCursos}
              costos={costos}
              ivaValue={ivaValue}
              retencionHonorariosValue={retencionHonorariosValue}
              ppmCalculatedValue={ppmCalculatedValue}
              ppmPercentage={ppmPercentage}
              gastosAdminValue={gastosAdminSettingValue}
              fondoAhorroValue={fondoAhorroCalculatedValue}
              fondoAhorroPercentage={fondoAhorroPercentage}
              comisionVentaValue={comisionVentaCalculatedValue}
              comisionVentaPercentage={comisionVentaPercentage}
              isCalculatingComision={isCalculatingComision}
              tipoComision={tipoComision}
              fuenteComision={fuenteComision}
              usarComisionManual={usarComisionManual}
              comisionManual={comisionManual}
              isAdmin={user?.rol === 'administrador'}
              onChangeComisionManual={handleChangeComisionManual}
              onToggleComisionManual={handleToggleComisionManual}
              bloqueado={bloqueado}
            />
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Información Adicional
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                disabled={saving || bloqueado}
                multiline
                rows={4}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                disabled={saving || bloqueado}
                multiline
                rows={3}
              />
            </Grid>
            
            {isEditing && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.aprobado}
                      onChange={(e) => handleAprobarProyecto(e.target.checked)}
                      disabled={saving /* El switch solo se deshabilita si está guardando, no por bloqueado */}
                      color="primary"
                    />
                  }
                  label={formData.aprobado ? "Proyecto Aprobado" : "Aprobar Proyecto"}
                />
              </Grid>
            )}
            
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outlined"
                onClick={handleVolver}
                disabled={saving}
                sx={{ mr: 2 }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving || bloqueado}
              >
                {saving ? 'Guardando...' : 'Guardar Proyecto'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ProyectoFormPage; 