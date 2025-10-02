import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  MenuItem, 
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AddCircleOutline as AddCircleOutlineIcon } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cuentaBancariaService, conciliacionBancariaService } from '../../services';

const ConciliacionBancaria = () => {
  // Estados para la conciliación
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [fechaConciliacion, setFechaConciliacion] = useState(new Date());
  const [mostrarConciliados, setMostrarConciliados] = useState(false);
  const [saldoContable, setSaldoContable] = useState(0);
  const [saldoEstadoCuenta, setSaldoEstadoCuenta] = useState(0);
  const [diferencia, setDiferencia] = useState(0);
  const [movimientosSinConciliar, setMovimientosSinConciliar] = useState({
    ingresos: [],
    egresos: []
  });
  const [movimientosConciliados, setMovimientosConciliados] = useState({
    ingresos: [],
    egresos: []
  });
  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar cuentas bancarias desde la API
        const respuesta = await cuentaBancariaService.getCuentasBancarias();
        setCuentasBancarias(respuesta.cuentas || []);
      } catch (error) {
        console.error('Error al cargar cuentas bancarias:', error);
        setError('Error al cargar las cuentas bancarias. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // Efecto para cargar movimientos cuando se selecciona una cuenta
  useEffect(() => {
    if (cuentaSeleccionada) {
      cargarMovimientos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuentaSeleccionada, fechaConciliacion]);

  // Función para cargar movimientos
  const cargarMovimientos = async () => {
    setLoading(true);
    try {
      setError(null);
      
      // Formato de fecha para la API
      const fechaFormateada = format(fechaConciliacion, 'yyyy-MM-dd');
      
      // Obtener datos de conciliación desde la API
      const params = {
        fecha: fechaFormateada,
        cuenta_bancaria_id: cuentaSeleccionada
      };
      
      const respuesta = await conciliacionBancariaService.getConciliaciones(params);
      
      if (respuesta && respuesta.data) {
        // Establecer saldos
        setSaldoContable(respuesta.data.saldo_contable || 0);
        setSaldoEstadoCuenta(respuesta.data.saldo_estado_cuenta || 0);
        setDiferencia(respuesta.data.diferencia || 0);
        
        // Establecer movimientos
        setMovimientosSinConciliar({
          ingresos: respuesta.data.movimientos_sin_conciliar?.ingresos || [],
          egresos: respuesta.data.movimientos_sin_conciliar?.egresos || []
        });
        
        setMovimientosConciliados({
          ingresos: respuesta.data.movimientos_conciliados?.ingresos || [],
          egresos: respuesta.data.movimientos_conciliados?.egresos || []
        });
      } else {
        // Si no hay datos de conciliación para esta fecha, inicializar con valores por defecto
        resetMovimientos();
        
        // Intentar obtener el saldo contable actual de la cuenta
        const cuentaActual = cuentasBancarias.find(c => c.id === parseInt(cuentaSeleccionada));
        setSaldoContable(cuentaActual?.saldo_actual || 0);
        setSaldoEstadoCuenta(0);
        calcularDiferencia(cuentaActual?.saldo_actual || 0, 0);
      }
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setError('Error al cargar los movimientos. Intente nuevamente.');
      resetMovimientos();
    } finally {
      setLoading(false);
    }
  };
  
  const resetMovimientos = () => {
    setMovimientosSinConciliar({
      ingresos: [],
      egresos: []
    });
    setMovimientosConciliados({
      ingresos: [],
      egresos: []
    });
  };

  // Función para calcular la diferencia entre saldo contable y estado de cuenta
  const calcularDiferencia = (contable, estadoCuenta) => {
    // Sumar montos de movimientos seleccionados
    const ingresosSeleccionados = movimientosSinConciliar.ingresos
      .filter(ingreso => ingreso.seleccionado)
      .reduce((sum, ingreso) => sum + ingreso.monto, 0);
    
    const egresosSeleccionados = movimientosSinConciliar.egresos
      .filter(egreso => egreso.seleccionado)
      .reduce((sum, egreso) => sum + egreso.monto, 0);
    
    const saldoAjustado = contable + ingresosSeleccionados - egresosSeleccionados;
    const diferencia = saldoAjustado - estadoCuenta;
    
    setDiferencia(diferencia);
  };

  // Función para manejar cambio en saldo del estado de cuenta
  const handleSaldoEstadoCuentaChange = (e) => {
    const nuevoSaldo = Number(e.target.value);
    setSaldoEstadoCuenta(nuevoSaldo);
    calcularDiferencia(saldoContable, nuevoSaldo);
  };

  // Función para seleccionar o deseleccionar un movimiento
  const toggleSeleccionMovimiento = (tipo, id, esIngreso) => {
    if (esIngreso) {
      const nuevosIngresos = movimientosSinConciliar.ingresos.map(ingreso => {
        if (ingreso.id === id) {
          return { ...ingreso, seleccionado: !ingreso.seleccionado };
        }
        return ingreso;
      });
      
      setMovimientosSinConciliar({
        ...movimientosSinConciliar,
        ingresos: nuevosIngresos
      });
    } else {
      const nuevosEgresos = movimientosSinConciliar.egresos.map(egreso => {
        if (egreso.id === id) {
          return { ...egreso, seleccionado: !egreso.seleccionado };
        }
        return egreso;
      });
      
      setMovimientosSinConciliar({
        ...movimientosSinConciliar,
        egresos: nuevosEgresos
      });
    }
    
    // Recalcular diferencia
    calcularDiferencia(saldoContable, saldoEstadoCuenta);
  };

  // Función para conciliar los movimientos seleccionados
  const conciliarMovimientos = async () => {
    setGuardando(true);
    setError(null);
    setExito(null);
    
    try {
      // Crear objeto con datos de conciliación
      const datosConciliacion = {
        cuenta_bancaria_id: parseInt(cuentaSeleccionada),
        fecha: format(fechaConciliacion, 'yyyy-MM-dd'),
        saldo_contable: saldoContable,
        saldo_estado_cuenta: saldoEstadoCuenta,
        diferencia: diferencia,
        movimientos_conciliados: {
          ingresos: movimientosConciliados.ingresos.map(ing => ing.id),
          egresos: movimientosConciliados.egresos.map(egr => egr.id)
        }
      };
      
      // Guardar en la API
      await conciliacionBancariaService.createConciliacion(datosConciliacion);
      
      setExito('Conciliación bancaria guardada exitosamente.');
      
      // Recargar datos
      cargarMovimientos();
    } catch (error) {
      console.error('Error al guardar conciliación:', error);
      setError('Error al guardar la conciliación. Intente nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  // Función para descargar el reporte de conciliación
  const descargarReporte = () => {
    // En una implementación real, aquí se llamaría a una API para generar y descargar el reporte
    console.log('Descargando reporte de conciliación...');
  };

  // Formatear montos para visualización
  const formatMonto = (monto) => {
    return `$${monto.toLocaleString('es-CL')}`;
  };

  // Formatear fechas
  const formatFecha = (fecha) => {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Conciliación Bancaria
      </Typography>
      
      {/* Selección de cuenta y fecha */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Cuenta Bancaria"
              value={cuentaSeleccionada}
              onChange={(e) => setCuentaSeleccionada(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">Seleccione una cuenta</MenuItem>
              {cuentasBancarias.map((cuenta) => (
                <MenuItem key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre} - {cuenta.banco}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <DatePicker
              label="Fecha de Conciliación"
              value={fechaConciliacion}
              onChange={(date) => setFechaConciliacion(date)}
              slotProps={{ textField: { fullWidth: true } }}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={mostrarConciliados}
                  onChange={(e) => setMostrarConciliados(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Mostrar movimientos conciliados"
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Mensajes de error o éxito */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {exito && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setExito(null)}
        >
          {exito}
        </Alert>
      )}
      
      {/* Saldos y diferencias */}
      {cuentaSeleccionada && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Saldo Contable
                </Typography>
                <Typography variant="h4">
                  {formatMonto(saldoContable)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Saldo según registros contables
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Saldo Estado de Cuenta
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={saldoEstadoCuenta}
                  onChange={handleSaldoEstadoCuentaChange}
                  placeholder="Ingrese el saldo del estado de cuenta"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Saldo según el estado de cuenta bancario
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Diferencia
                </Typography>
                <Typography 
                  variant="h4" 
                  color={diferencia === 0 ? 'success.main' : 'error.main'}
                >
                  {formatMonto(diferencia)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {diferencia === 0 
                    ? 'Los saldos coinciden' 
                    : 'Seleccione los movimientos para conciliar la diferencia'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Movimientos sin conciliar */}
      {cuentaSeleccionada && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Movimientos por Conciliar
          </Typography>
          
          {/* Ingresos por conciliar */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'success.main' }}>
            Ingresos
          </Typography>
          
          {movimientosSinConciliar.ingresos.length > 0 ? (
            <TableContainer sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="center">Conciliar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientosSinConciliar.ingresos.map((ingreso) => (
                    <TableRow 
                      key={ingreso.id}
                      sx={{ 
                        backgroundColor: ingreso.seleccionado ? 'rgba(76, 175, 80, 0.1)' : 'inherit',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <TableCell>{formatFecha(ingreso.fecha)}</TableCell>
                      <TableCell>{ingreso.descripcion}</TableCell>
                      <TableCell>
                        <Chip 
                          label={ingreso.tipo} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{ingreso.cliente}</TableCell>
                      <TableCell align="right">{formatMonto(ingreso.monto)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => toggleSeleccionMovimiento('ingreso', ingreso.id, true)}
                          color={ingreso.seleccionado ? 'success' : 'default'}
                        >
                          {ingreso.seleccionado ? <CheckIcon /> : <AddCircleOutlineIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic' }}>
              No hay ingresos pendientes por conciliar.
            </Typography>
          )}
          
          {/* Egresos por conciliar */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'error.main' }}>
            Egresos
          </Typography>
          
          {movimientosSinConciliar.egresos.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="center">Conciliar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientosSinConciliar.egresos.map((egreso) => (
                    <TableRow 
                      key={egreso.id}
                      sx={{ 
                        backgroundColor: egreso.seleccionado ? 'rgba(244, 67, 54, 0.1)' : 'inherit',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <TableCell>{formatFecha(egreso.fecha)}</TableCell>
                      <TableCell>{egreso.descripcion}</TableCell>
                      <TableCell>
                        <Chip 
                          label={egreso.tipo} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{egreso.proveedor}</TableCell>
                      <TableCell align="right">{formatMonto(egreso.monto)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => toggleSeleccionMovimiento('egreso', egreso.id, false)}
                          color={egreso.seleccionado ? 'error' : 'default'}
                        >
                          {egreso.seleccionado ? <CheckIcon /> : <AddCircleOutlineIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic' }}>
              No hay egresos pendientes por conciliar.
            </Typography>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={conciliarMovimientos}
              disabled={
                guardando || 
                diferencia !== 0 || 
                (!movimientosSinConciliar.ingresos.some(i => i.seleccionado) && 
                 !movimientosSinConciliar.egresos.some(e => e.seleccionado))
              }
              sx={{ mr: 2 }}
            >
              Conciliar Movimientos
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={descargarReporte}
              disabled={guardando}
            >
              Descargar Reporte
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Movimientos ya conciliados (histórico) */}
      {cuentaSeleccionada && mostrarConciliados && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Historial de Movimientos Conciliados
          </Typography>
          
          {/* Ingresos conciliados */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'success.main' }}>
            Ingresos Conciliados
          </Typography>
          
          {movimientosConciliados.ingresos.length > 0 ? (
            <TableContainer sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Fecha Conciliación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientosConciliados.ingresos.map((ingreso) => (
                    <TableRow key={ingreso.id}>
                      <TableCell>{formatFecha(ingreso.fecha)}</TableCell>
                      <TableCell>{ingreso.descripcion}</TableCell>
                      <TableCell>
                        <Chip 
                          label={ingreso.tipo} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{ingreso.cliente}</TableCell>
                      <TableCell align="right">{formatMonto(ingreso.monto)}</TableCell>
                      <TableCell>{formatFecha(ingreso.fecha_conciliacion)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic' }}>
              No hay ingresos conciliados.
            </Typography>
          )}
          
          {/* Egresos conciliados */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'error.main' }}>
            Egresos Conciliados
          </Typography>
          
          {movimientosConciliados.egresos.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Fecha Conciliación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientosConciliados.egresos.map((egreso) => (
                    <TableRow key={egreso.id}>
                      <TableCell>{formatFecha(egreso.fecha)}</TableCell>
                      <TableCell>{egreso.descripcion}</TableCell>
                      <TableCell>
                        <Chip 
                          label={egreso.tipo} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{egreso.proveedor}</TableCell>
                      <TableCell align="right">{formatMonto(egreso.monto)}</TableCell>
                      <TableCell>{formatFecha(egreso.fecha_conciliacion)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic' }}>
              No hay egresos conciliados.
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Mensaje si no se ha seleccionado cuenta */}
      {!cuentaSeleccionada && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Seleccione una cuenta bancaria para comenzar la conciliación.
        </Alert>
      )}
    </Box>
  );
};

export default ConciliacionBancaria; 