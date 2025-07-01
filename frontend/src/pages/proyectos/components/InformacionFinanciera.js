import React, { useMemo } from 'react';
import { 
  Grid, 
  Typography, 
  TextField, 
  Divider, 
  InputAdornment, 
  Box,
  Alert,
  AlertTitle,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import { formatCurrency } from '../utils/formatUtils';

const InformacionFinanciera = ({ 
  valorIngresoCursos,
  costos = [],
  ivaValue,
  retencionHonorariosValue,
  ppmCalculatedValue,
  ppmPercentage,
  gastosAdminValue,
  fondoAhorroValue,
  fondoAhorroPercentage,
  comisionVentaValue,
  comisionVentaPercentage,
  isCalculatingComision,
  tipoComision,
  fuenteComision,
  usarComisionManual,
  comisionManual,
  isAdmin,
  onChangeComisionManual,
  onToggleComisionManual,
  bloqueado,
  ...rest
}) => {

  // Sumar costos por tipo
  const sumaCostosConIVA = useMemo(() => {
    return costos.filter(c => c.aplica_iva).reduce((acc, c) => acc + parseFloat(c.monto || 0), 0);
  }, [costos]);

  const sumaIVA = useMemo(() => {
    return costos.filter(c => c.aplica_iva).reduce((acc, c) => acc + parseFloat(c.monto || 0) * (ivaValue / 100), 0);
  }, [costos, ivaValue]);

  const sumaCostosHonorarios = useMemo(() => {
    return costos.filter(c => c.aplica_honorarios).reduce((acc, c) => acc + parseFloat(c.monto || 0), 0);
  }, [costos]);

  const sumaRetencionHonorarios = useMemo(() => {
    return costos.filter(c => c.aplica_honorarios).reduce((acc, c) => acc + parseFloat(c.monto || 0) * (retencionHonorariosValue / 100), 0);
  }, [costos, retencionHonorariosValue]);

  const sumaCostosSinIvaNiHonorarios = useMemo(() => {
    return costos.filter(c => !c.aplica_iva && !c.aplica_honorarios).reduce((acc, c) => acc + parseFloat(c.monto || 0), 0);
  }, [costos]);

  const comisionFinalAplicadaValue = useMemo(() => {
    return parseFloat(comisionVentaValue) || 0;
  }, [comisionVentaValue]);

  const rentabilidadEstimada = useMemo(() => {
    const ingresos = parseFloat(valorIngresoCursos) || 0;
    const costosNetos = 
      (sumaCostosConIVA || 0) +
      (sumaCostosSinIvaNiHonorarios || 0) +
      (sumaCostosHonorarios || 0) +
      (sumaRetencionHonorarios || 0) +
      (parseFloat(ppmCalculatedValue) || 0) +
      (parseFloat(gastosAdminValue) || 0) +
      (comisionFinalAplicadaValue || 0) +
      (parseFloat(fondoAhorroValue) || 0);

    if (ingresos <= 0) return 0;
    const profitNeto = ingresos - costosNetos;
    return (profitNeto / ingresos) * 100;
  }, [
    valorIngresoCursos, 
    sumaCostosConIVA,
    sumaCostosSinIvaNiHonorarios,
    sumaCostosHonorarios, 
    sumaRetencionHonorarios,
    ppmCalculatedValue, 
    gastosAdminValue,
    comisionFinalAplicadaValue,
    fondoAhorroValue
  ]);

  // Calcular gastos totales con impuestos (IVA y Retención de Honorarios)
  const gastosTotalesConImpuestos = useMemo(() => {
    return (
      (parseFloat(sumaCostosConIVA) || 0) +
      (parseFloat(sumaIVA) || 0) +
      (parseFloat(sumaCostosHonorarios) || 0) +
      (parseFloat(sumaRetencionHonorarios) || 0)
    );
  }, [sumaCostosConIVA, sumaIVA, sumaCostosHonorarios, sumaRetencionHonorarios]);

  // Calcular gastos que no tienen ni honorarios ni IVA
  const totalGastosSinIvaNiHonorarios = useMemo(() => {
    if (!Array.isArray(window.__COSTOS_PROYECTO__)) return 0;
    return window.__COSTOS_PROYECTO__
      .filter(c => !c.aplica_iva && !c.aplica_honorarios)
      .reduce((total, c) => total + parseFloat(c.monto || 0), 0);
  }, []);

  // --- NUEVO: Cálculos con comisión manual ---
  const comisionManualValue = useMemo(() => {
    return usarComisionManual && comisionManual !== '' ? parseFloat(comisionManual) : null;
  }, [usarComisionManual, comisionManual]);

  const comisionManualAplicada = useMemo(() => {
    if (!usarComisionManual || !comisionManualValue) return 0;
    const ingresos = parseFloat(valorIngresoCursos) || 0;
    return (ingresos * comisionManualValue) / 100;
  }, [usarComisionManual, comisionManualValue, valorIngresoCursos]);

  const rentabilidadManual = useMemo(() => {
    if (!usarComisionManual || !comisionManualValue) return null;
    const ingresos = parseFloat(valorIngresoCursos) || 0;
    const costosNetos =
      (sumaCostosConIVA || 0) +
      (sumaCostosSinIvaNiHonorarios || 0) +
      (sumaCostosHonorarios || 0) +
      (sumaRetencionHonorarios || 0) +
      (parseFloat(ppmCalculatedValue) || 0) +
      (parseFloat(gastosAdminValue) || 0) +
      (comisionManualAplicada || 0) +
      (parseFloat(fondoAhorroValue) || 0);
    if (ingresos <= 0) return 0;
    const profitNeto = ingresos - costosNetos;
    return (profitNeto / ingresos) * 100;
  }, [usarComisionManual, comisionManualValue, valorIngresoCursos, sumaCostosConIVA, sumaCostosSinIvaNiHonorarios, sumaCostosHonorarios, sumaRetencionHonorarios, ppmCalculatedValue, gastosAdminValue, fondoAhorroValue, comisionManualAplicada]);

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Información Financiera (Estimada)
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      
      <Grid item xs={12} sx={{ mb: 1 }}> 
        <TextField
          fullWidth
          label="Valor Ingreso Cursos"
          value={formatCurrency(valorIngresoCursos || 0)}
          InputProps={{
            readOnly: true,
          }}
          variant="filled"
        />
      </Grid>

      <Grid container spacing={1} sx={{ maxWidth: 'md', margin: 'auto', mt: 1, mb: 1 }}>
        {/* Sección: Gastos del Proyecto */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
            Gastos del Proyecto
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center" height="100%" textAlign="right">
            <Typography variant="subtitle1" fontWeight="bold">Suma de Gastos Totales:</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Subtotal Gastos"
            InputProps={{ readOnly: true }}
            value={formatCurrency((parseFloat(sumaCostosConIVA) || 0) + (parseFloat(sumaCostosSinIvaNiHonorarios) || 0))}
            variant="filled"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center" height="100%" textAlign="right">
            <Typography variant="subtitle1" fontWeight="bold">Suma de Honorarios Totales:</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Subtotal Honorarios"
            InputProps={{ readOnly: true }}
            value={formatCurrency((parseFloat(sumaCostosHonorarios) || 0) + (parseFloat(sumaRetencionHonorarios) || 0))}
            variant="filled"
          />
        </Grid>
        <Grid item xs={12} sm={6}></Grid>
        <Grid item xs={12} sm={6}>
          <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.300', borderRadius: 1, backgroundColor: 'grey.50', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="subtitle1" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
              Subtotal Gastos del Proyecto
            </Typography>
            {isCalculatingComision ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
            ) : (
              <>
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  {formatCurrency(
                    (parseFloat(sumaCostosConIVA) || 0) +
                    (parseFloat(sumaCostosSinIvaNiHonorarios) || 0) +
                    (parseFloat(sumaCostosHonorarios) || 0) +
                    (parseFloat(sumaRetencionHonorarios) || 0) +
                    (parseFloat(comisionFinalAplicadaValue) || 0)
                  )}
                </Typography>
                <Typography variant="caption" display="block" gutterBottom sx={{ color: 'text.secondary' }}>
                  Suma de costos con y sin IVA, honorarios y participación.
                </Typography>
              </>
            )}
          </Box>
        </Grid>

        {/* Sección: Gastos Administrativos */}
        <Grid item xs={12} sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
            Gastos Administrativos
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center" height="100%" textAlign="right">
            <Typography variant="subtitle1" fontWeight="bold">PPM:</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={`PPM (${ppmPercentage || 0}%)`}
            value={formatCurrency(ppmCalculatedValue || 0)}
            InputProps={{ readOnly: true }}
            variant="filled"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center" height="100%" textAlign="right">
            <Typography variant="subtitle1" fontWeight="bold">Gastos de Administración:</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Gastos de Administración ($)"
            value={formatCurrency(gastosAdminValue || 0)}
            InputProps={{ readOnly: true }}
            variant="filled"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center" height="100%" textAlign="right">
            <Typography variant="subtitle1" fontWeight="bold">Fondo Ahorro Caja:</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={`Fondo Ahorro Caja (${fondoAhorroPercentage || 0}%)`}
            value={formatCurrency(fondoAhorroValue || 0)}
            InputProps={{ readOnly: true }}
            variant="filled"
          />
        </Grid>

        {/* Total Gastos Administrativos (ahora antes de rentabilidad) */}
        <Grid item xs={12} sm={6}></Grid>
        <Grid item xs={12} sm={6}>
          <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.300', borderRadius: 1, backgroundColor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
              Total Gastos Administrativos
            </Typography>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {formatCurrency(
                (parseFloat(ppmCalculatedValue) || 0) +
                (parseFloat(gastosAdminValue) || 0) +
                (parseFloat(fondoAhorroValue) || 0)
              )}
            </Typography>
            <Typography variant="caption" display="block" gutterBottom sx={{ color: 'text.secondary' }}>
              Suma de PPM, gastos de administración y fondo de ahorro caja.
            </Typography>
          </Box>
        </Grid>

        {/* Apartado: Rentabilidad y Participación */}
        <Grid item xs={12} sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
            Rentabilidad y Participación
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        {/* UI de comisión manual para admins, va ANTES del condicional de visualización */}
        {isAdmin && (
          <Grid item xs={12} sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={usarComisionManual}
                    onChange={onToggleComisionManual}
                    color="primary"
                    disabled={bloqueado}
                  />
                }
                label={usarComisionManual ? '% de Participación manual autorizado' : 'Autorizar participación manual'}
                sx={{ mr: 2 }}
              />
              {usarComisionManual && (
                <TextField
                  label="% Participación Manual"
                  value={comisionManual}
                  onChange={onChangeComisionManual}
                  type="number"
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  sx={{ ml: 2, width: 180 }}
                  disabled={bloqueado}
                />
              )}
            </Box>
          </Grid>
        )}

        {/* Mostrar solo una de las dos secciones según usarComisionManual */}
        {usarComisionManual && typeof comisionManualValue === 'number' && comisionManualValue > 0 ? (
          // --- SECCIÓN CON PARTICIPACIÓN MANUAL ---
          <>
            <Grid item xs={12} sm={6}>
              <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center" height="100%" textAlign="right">
                <Typography variant="subtitle1" fontWeight="bold">Participación Manual Autorizada:</Typography>
                <Typography variant="caption" color="primary">
                  % Participación manual: {comisionManualValue} %
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subtotal Participación Manual"
                value={formatCurrency(comisionManualAplicada)}
                InputProps={{ readOnly: true }}
                variant="filled"
                disabled={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center" height="100%" textAlign="right">
                <Typography variant="subtitle2" fontWeight="bold">Porcentaje Participación Manual Aplicada:</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={isCalculatingComision ? "Calculando..." : "% Participación Manual"}
                value={isCalculatingComision ? "" : `${parseFloat(comisionManualValue || 0).toFixed(2)} %`}
                InputProps={{ readOnly: true }}
                variant="filled"
                sx={{ maxWidth: 180, alignSelf: 'flex-end' }}
                disabled={isCalculatingComision}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.300', borderRadius: 1, backgroundColor: 'grey.50', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="subtitle1" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                  Total Final de Gastos del Proyecto (Manual)
                </Typography>
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  {formatCurrency(
                    (parseFloat(sumaCostosConIVA) || 0) +
                    (parseFloat(sumaCostosSinIvaNiHonorarios) || 0) +
                    (parseFloat(sumaCostosHonorarios) || 0) +
                    (parseFloat(sumaRetencionHonorarios) || 0) +
                    (parseFloat(comisionManualAplicada) || 0) +
                    (parseFloat(fondoAhorroValue) || 0) +
                    (parseFloat(ppmCalculatedValue) || 0) +
                    (parseFloat(gastosAdminValue) || 0)
                  )}
                </Typography>
                <Typography variant="caption" display="block" gutterBottom sx={{ color: 'text.secondary' }}>
                  Suma de gastos del Proyecto, Gastos Administrativos y Participación manual.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.300', borderRadius: 1, backgroundColor: 'grey.50', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="subtitle1" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                  Rentabilidad Neta Estimada (Manual):
                </Typography>
                <Typography 
                  variant="h5" 
                  component="div" 
                  sx={{ fontWeight: 'bold', color: rentabilidadManual < 25 ? 'error.main' : 'success.main' }}
                >
                  {rentabilidadManual !== null ? rentabilidadManual.toFixed(2) : '--'}%
                </Typography>
                <Typography variant="caption" display="block" gutterBottom sx={{color: 'text.secondary'}}>
                  ((Ingresos - Gastos Proyecto - Gastos Administrativos) / Ingresos) * 100
                </Typography>
                {rentabilidadManual < 25 && (
                  <Alert severity="warning" sx={{ mt: 1, p: 0.5 }}>
                    <AlertTitle sx={{ fontSize: '0.8rem', mb: 0 }}>Sin Participación</AlertTitle>
                    <Typography variant="caption" display="block">
                      Rentabilidad inferior al mínimo para participación (25%).
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Grid>
          </>
        ) : (
          // --- SECCIÓN ORIGINAL AUTOMÁTICA (AHORA SÍ DENTRO DEL ELSE) ---
          <>
            <Grid item xs={12} sm={6}>
              <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center" height="100%" textAlign="right">
                <Typography variant="subtitle1" fontWeight="bold">Participación Según Rentabilidad de la Venta:</Typography>
                <Typography variant="caption" color="text.secondary">
                  {tipoComision === 'manual' ? 'Comisión definida manualmente por un administrador.' : 'Valor final de participación considerado según tabla de comisiones.'}
                </Typography>
                {tipoComision === 'manual' && fuenteComision && (
                  <Typography variant="caption" color="primary">% Comisión manual: {fuenteComision.valor} %</Typography>
                )}
                {tipoComision === 'automatica' && fuenteComision && (
                  <Typography variant="caption" color="secondary">% Comisión automática: {fuenteComision.valor} % (Rango: {fuenteComision.rango ? `${fuenteComision.rango[0]}% - ${fuenteComision.rango[1]}%` : 'N/A'})</Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subtotal Participación"
                value={formatCurrency(comisionFinalAplicadaValue)}
                InputProps={{ readOnly: true }}
                variant="filled"
                disabled={true}
              />
            </Grid>
            {/* Porcentaje de Comisión (informativo) */}
            <Grid item xs={12} sm={6}>
              <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center" height="100%" textAlign="right">
                <Typography variant="subtitle2" fontWeight="bold">Porcentaje Participación Aplicada:</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={isCalculatingComision ? "Calculando..." : "% Participación"}
                value={isCalculatingComision ? "" : `${parseFloat(comisionVentaPercentage || 0).toFixed(2)} %`}
                InputProps={{
                  readOnly: true,
                  startAdornment: isCalculatingComision ? (
                    <InputAdornment position="start">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : null,
                }}
                variant="filled"
                sx={{ maxWidth: 180, alignSelf: 'flex-end' }}
                disabled={isCalculatingComision}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.300', borderRadius: 1, backgroundColor: 'grey.50', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="subtitle1" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                  Total Final de Gastos del Proyecto
                </Typography>
                {isCalculatingComision ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
                ) : (
                  <>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {formatCurrency(
                        (parseFloat(sumaCostosConIVA) || 0) +
                        (parseFloat(sumaCostosSinIvaNiHonorarios) || 0) +
                        (parseFloat(sumaCostosHonorarios) || 0) +
                        (parseFloat(sumaRetencionHonorarios) || 0) +
                        (parseFloat(comisionFinalAplicadaValue) || 0) +
                        (parseFloat(fondoAhorroValue) || 0) +
                        (parseFloat(ppmCalculatedValue) || 0) +
                        (parseFloat(gastosAdminValue) || 0)
                      )}
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom sx={{ color: 'text.secondary' }}>
                      Suma de gastos del Proyecto, Gastos Administrativos y Participación.
                    </Typography>
                  </>
                )}
              </Box>
            </Grid> 
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.300', borderRadius: 1, backgroundColor: 'grey.50', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="subtitle1" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                  Rentabilidad Neta Estimada:
                </Typography>
                {isCalculatingComision ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
                ) : (
                  <>
                    <Typography 
                      variant="h5" 
                      component="div" 
                      sx={{ fontWeight: 'bold', color: rentabilidadEstimada < 25 ? 'error.main' : 'success.main' }}
                    >
                      {rentabilidadEstimada.toFixed(2)}%
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom sx={{color: 'text.secondary'}}>
                      ((Ingresos - Gastos Proyecto - Gastos Administrativos) / Ingresos) * 100
                    </Typography>
                    {rentabilidadEstimada < 25 && (
                      <Alert severity="warning" sx={{ mt: 1, p: 0.5 }}>
                        <AlertTitle sx={{ fontSize: '0.8rem', mb: 0 }}>Sin Participación</AlertTitle>
                        <Typography variant="caption" display="block">
                          Rentabilidad inferior al mínimo para participación (25%).
                        </Typography>
                      </Alert>
                    )}
                  </>
                )}
              </Box>
            </Grid>
          </>
        )}
      </Grid>
    </>
  );
};

export default InformacionFinanciera; 