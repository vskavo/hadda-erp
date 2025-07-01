import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Divider, 
  Card, 
  CardContent, 
  CardHeader,
  TextField,
  MenuItem,
  ButtonGroup,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Componente para el dashboard financiero
const FinancierosDashboard = () => {
  // Estado para filtros de fecha
  const [fechaInicio, setFechaInicio] = useState(startOfMonth(subMonths(new Date(), 5)));
  const [fechaFin, setFechaFin] = useState(endOfMonth(new Date()));
  const [periodoActivo, setPeriodoActivo] = useState('semestre');
  
  // Estados para los datos financieros
  const [resumen, setResumen] = useState({
    ingresos_total: 0,
    egresos_total: 0,
    balance: 0,
    facturas_pendientes: 0,
    pagos_pendientes: 0
  });
  
  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [datosIngresosPorMes, setDatosIngresosPorMes] = useState([]);
  const [datosEgresosPorMes, setDatosEgresosPorMes] = useState([]);
  const [datosIngresosPorCategoria, setDatosIngresosPorCategoria] = useState([]);
  const [datosEgresosPorCategoria, setDatosEgresosPorCategoria] = useState([]);
  const [facturasRecientes, setFacturasRecientes] = useState([]);
  const [pagosRecientes, setPagosRecientes] = useState([]);
  
  // Colores para los gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Efecto para cargar datos
  useEffect(() => {
    const cargarDatosFinancieros = async () => {
      try {
        // En una implementación real, aquí se cargarían los datos desde la API
        // Por ahora usamos datos ficticios
        
        // Resumen financiero
        setResumen({
          ingresos_total: 24500000,
          egresos_total: 18700000,
          balance: 5800000,
          facturas_pendientes: 4,
          pagos_pendientes: 7
        });
        
        // Cuentas bancarias
        setCuentasBancarias([
          { id: 1, nombre: 'Cuenta Corriente Principal', banco: 'Banco Estado', saldo: 4250000 },
          { id: 2, nombre: 'Cuenta Ahorro', banco: 'Banco Santander', saldo: 1850000 },
          { id: 3, nombre: 'Cuenta Proyectos', banco: 'Banco BCI', saldo: 3200000 }
        ]);
        
        // Datos para gráfico de ingresos y egresos por mes
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
        const ingresosMensuales = [3800000, 4200000, 3950000, 4500000, 4100000, 3950000];
        const egresosMensuales = [2900000, 3100000, 3050000, 3300000, 3200000, 3150000];
        
        const datosPorMes = meses.map((mes, index) => ({
          name: mes,
          ingresos: ingresosMensuales[index],
          egresos: egresosMensuales[index],
          balance: ingresosMensuales[index] - egresosMensuales[index]
        }));
        
        setDatosIngresosPorMes(datosPorMes);
        setDatosEgresosPorMes(datosPorMes);
        
        // Datos para gráficos de categorías
        setDatosIngresosPorCategoria([
          { name: 'Cursos', value: 14500000 },
          { name: 'Consultorías', value: 6200000 },
          { name: 'Proyectos', value: 3800000 }
        ]);
        
        setDatosEgresosPorCategoria([
          { name: 'Personal', value: 9200000 },
          { name: 'Arriendo', value: 3600000 },
          { name: 'Materiales', value: 2400000 },
          { name: 'Servicios', value: 1900000 },
          { name: 'Otros', value: 1600000 }
        ]);
        
        // Facturas recientes
        setFacturasRecientes([
          { id: 1, numero: 'F-2023015', cliente: 'Empresa ABC', fecha: new Date(2023, 5, 28), monto: 1250000, estado: 'PENDIENTE' },
          { id: 2, numero: 'F-2023014', cliente: 'Corporación XYZ', fecha: new Date(2023, 5, 25), monto: 950000, estado: 'PAGADA' },
          { id: 3, numero: 'F-2023013', cliente: 'Consultora 123', fecha: new Date(2023, 5, 20), monto: 780000, estado: 'PENDIENTE' },
          { id: 4, numero: 'F-2023012', cliente: 'Empresa DEF', fecha: new Date(2023, 5, 15), monto: 1450000, estado: 'PAGADA' },
          { id: 5, numero: 'F-2023011', cliente: 'Corporación MNO', fecha: new Date(2023, 5, 10), monto: 825000, estado: 'PAGADA' }
        ]);
        
        // Pagos recientes
        setPagosRecientes([
          { id: 1, descripcion: 'Pago arriendo oficina', proveedor: 'Inmobiliaria XYZ', fecha: new Date(2023, 5, 26), monto: 850000, estado: 'PAGADO' },
          { id: 2, descripcion: 'Honorarios instructor', proveedor: 'Juan Pérez', fecha: new Date(2023, 5, 24), monto: 650000, estado: 'PAGADO' },
          { id: 3, descripcion: 'Servicios informáticos', proveedor: 'IT Solutions', fecha: new Date(2023, 5, 20), monto: 320000, estado: 'PENDIENTE' },
          { id: 4, descripcion: 'Materiales capacitación', proveedor: 'Distribuidora ABC', fecha: new Date(2023, 5, 18), monto: 180000, estado: 'PAGADO' },
          { id: 5, descripcion: 'Servicio cafetería', proveedor: 'Coffee Break SPA', fecha: new Date(2023, 5, 15), monto: 95000, estado: 'PENDIENTE' }
        ]);
      } catch (error) {
        console.error('Error al cargar datos financieros:', error);
      }
    };
    
    cargarDatosFinancieros();
  }, [fechaInicio, fechaFin]);

  // Funciones para manejar cambios en los filtros de fecha
  const handlePeriodoClick = (periodo) => {
    setPeriodoActivo(periodo);
    const now = new Date();
    
    switch (periodo) {
      case 'mes':
        setFechaInicio(startOfMonth(now));
        setFechaFin(endOfMonth(now));
        break;
      case 'trimestre':
        setFechaInicio(startOfMonth(subMonths(now, 2)));
        setFechaFin(endOfMonth(now));
        break;
      case 'semestre':
        setFechaInicio(startOfMonth(subMonths(now, 5)));
        setFechaFin(endOfMonth(now));
        break;
      case 'anio':
        setFechaInicio(startOfMonth(subMonths(now, 11)));
        setFechaFin(endOfMonth(now));
        break;
      default:
        break;
    }
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
        Estados Financieros
      </Typography>
      
      {/* Filtros de fechas */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <ButtonGroup variant="outlined" size="small" sx={{ mb: { xs: 2, md: 0 } }}>
              <Button 
                onClick={() => handlePeriodoClick('mes')}
                variant={periodoActivo === 'mes' ? 'contained' : 'outlined'}
              >
                Mes actual
              </Button>
              <Button 
                onClick={() => handlePeriodoClick('trimestre')}
                variant={periodoActivo === 'trimestre' ? 'contained' : 'outlined'}
              >
                Trimestre
              </Button>
              <Button 
                onClick={() => handlePeriodoClick('semestre')}
                variant={periodoActivo === 'semestre' ? 'contained' : 'outlined'}
              >
                Semestre
              </Button>
              <Button 
                onClick={() => handlePeriodoClick('anio')}
                variant={periodoActivo === 'anio' ? 'contained' : 'outlined'}
              >
                Año
              </Button>
            </ButtonGroup>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Fecha inicio"
              value={fechaInicio}
              onChange={(date) => {
                setFechaInicio(date);
                setPeriodoActivo('personalizado');
              }}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Fecha fin"
              value={fechaFin}
              onChange={(date) => {
                setFechaFin(date);
                setPeriodoActivo('personalizado');
              }}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ bgcolor: 'success.light', borderRadius: '50%', p: 1, mr: 2 }}>
                  <ArrowUpwardIcon color="success" />
                </Box>
                <Typography variant="h6" component="div">
                  Ingresos
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {formatMonto(resumen.ingresos_total)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Período: {formatFecha(fechaInicio)} - {formatFecha(fechaFin)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ bgcolor: 'error.light', borderRadius: '50%', p: 1, mr: 2 }}>
                  <ArrowDownwardIcon color="error" />
                </Box>
                <Typography variant="h6" component="div">
                  Egresos
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {formatMonto(resumen.egresos_total)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Período: {formatFecha(fechaInicio)} - {formatFecha(fechaFin)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ bgcolor: 'primary.light', borderRadius: '50%', p: 1, mr: 2 }}>
                  <AttachMoneyIcon color="primary" />
                </Box>
                <Typography variant="h6" component="div">
                  Balance
                </Typography>
              </Box>
              <Typography variant="h4" component="div" color={resumen.balance >= 0 ? 'success.main' : 'error.main'}>
                {formatMonto(resumen.balance)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {resumen.balance >= 0 ? (
                  <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                )}
                <Typography variant="body2" color="text.secondary">
                  {resumen.balance >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ bgcolor: 'info.light', borderRadius: '50%', p: 1, mr: 2 }}>
                  <AccountBalanceIcon color="info" />
                </Box>
                <Typography variant="h6" component="div">
                  Saldos Bancarios
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {formatMonto(cuentasBancarias.reduce((sum, cuenta) => sum + cuenta.saldo, 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {cuentasBancarias.length} cuentas activas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Gráficos financieros */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Gráfico de Ingresos vs Egresos */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Evolución Ingresos vs Egresos
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Comparativa mensual
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={datosIngresosPorMes}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatMonto(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="#4caf50" strokeWidth={2} name="Ingresos" />
                  <Line type="monotone" dataKey="egresos" stroke="#f44336" strokeWidth={2} name="Egresos" />
                  <Line type="monotone" dataKey="balance" stroke="#2196f3" strokeWidth={2} name="Balance" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Distribución de ingresos */}
        <Grid item xs={12} sm={6} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Distribución de Ingresos
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Por categoría
            </Typography>
            <Box sx={{ height: 300, mt: 2, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosIngresosPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {datosIngresosPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMonto(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Distribución de egresos */}
        <Grid item xs={12} sm={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Distribución de Egresos
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Por categoría
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosEgresosPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {datosEgresosPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMonto(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Cuentas bancarias */}
        <Grid item xs={12} sm={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Saldos Bancarios
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Por cuenta
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cuentasBancarias.map(cuenta => ({
                    name: cuenta.nombre,
                    saldo: cuenta.saldo
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatMonto(value)} />
                  <Legend />
                  <Bar dataKey="saldo" name="Saldo" fill="#3f51b5" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Facturas recientes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Facturas Recientes
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {facturasRecientes.map((factura) => (
                    <TableRow key={factura.id}>
                      <TableCell>{factura.numero}</TableCell>
                      <TableCell>{factura.cliente}</TableCell>
                      <TableCell>{formatFecha(factura.fecha)}</TableCell>
                      <TableCell align="right">{formatMonto(factura.monto)}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: factura.estado === 'PAGADA' ? 'success.main' : 'warning.main',
                            fontWeight: 'medium'
                          }}
                        >
                          {factura.estado}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Pagos recientes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pagos Recientes
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosRecientes.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>{pago.descripcion}</TableCell>
                      <TableCell>{pago.proveedor}</TableCell>
                      <TableCell>{formatFecha(pago.fecha)}</TableCell>
                      <TableCell align="right">{formatMonto(pago.monto)}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: pago.estado === 'PAGADO' ? 'success.main' : 'warning.main',
                            fontWeight: 'medium'
                          }}
                        >
                          {pago.estado}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancierosDashboard; 