import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Button, 
  Card, 
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
// Suponemos que usaremos la librería recharts para los gráficos
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { AlertMessage, LoadingIndicator } from '../../components/common';
import { proyectoService } from '../../services';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ProyectoRentabilidad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proyecto, setProyecto] = useState(null);
  const [rentabilidadData, setRentabilidadData] = useState(null);

  // Cargar datos del proyecto y rentabilidad
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener datos del proyecto
        const proyectoData = await proyectoService.getProyectoById(id);
        setProyecto(proyectoData);
        
        // Obtener datos de rentabilidad
        const rentabilidadInfo = await proyectoService.getRentabilidad(id);
        setRentabilidadData(rentabilidadInfo);
        
        setError('');
      } catch (err) {
        console.error('Error al cargar análisis de rentabilidad:', err);
        setError('Error al cargar análisis de rentabilidad. ' + (err.response?.data?.message || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleVolver = () => {
    navigate(`/proyectos/${id}`);
  };

  const formatCurrency = (value) => {
    return `$${value.toLocaleString('es-CL')}`;
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Renderizar un componente de carga mientras se obtienen los datos
  if (loading) {
    return <LoadingIndicator />;
  }

  // Renderizar mensaje de error si no se pudieron cargar los datos
  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 3 }}>
          <AlertMessage severity="error" message={error} />
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleVolver}
            sx={{ mt: 2 }}
          >
            Volver al Proyecto
          </Button>
        </Box>
      </Container>
    );
  }

  // Si no hay datos, mostrar mensaje
  if (!proyecto || !rentabilidadData) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 3 }}>
          <AlertMessage 
            severity="warning" 
            message="No se pudieron cargar los datos de rentabilidad del proyecto" 
          />
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleVolver}
            sx={{ mt: 2 }}
          >
            Volver al Proyecto
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={handleVolver}
            sx={{ mr: 2 }}
          >
            Volver al Proyecto
          </Button>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            Análisis de Rentabilidad - {proyecto.nombre}
          </Typography>
        </Box>

        {/* Tarjetas de Indicadores Clave */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader 
                title="Retorno de Inversión (ROI)" 
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={rentabilidadData.roi >= 0 ? 'success.main' : 'error'}>
                  {formatPercent(rentabilidadData.roi)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {rentabilidadData.roi >= 0 
                    ? 'El proyecto está generando rendimiento positivo sobre la inversión' 
                    : 'El proyecto no ha alcanzado su punto de equilibrio aún'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader 
                title="Margen de Beneficio" 
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={rentabilidadData.margenBeneficio >= 0 ? 'success.main' : 'error'}>
                  {formatPercent(rentabilidadData.margenBeneficio)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  El porcentaje de ingresos que se convierte en beneficio neto
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader 
                title="Punto de Equilibrio" 
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">
                  {formatCurrency(rentabilidadData.puntoEquilibrio)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Ingresos necesarios para cubrir todos los costos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Gráficos de Análisis */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Ingresos vs Gastos" 
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={rentabilidadData.comparativoMensual}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#2e7d32" />
                    <Bar dataKey="gastos" name="Gastos" fill="#d32f2f" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Distribución de Costos" 
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={rentabilidadData.distribucionCostos}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                      nameKey="categoria"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {rentabilidadData.distribucionCostos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tablas de Análisis Detallado */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Análisis Económico Detallado" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Indicador</TableCell>
                        <TableCell>Valor</TableCell>
                        <TableCell>Interpretación</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Inversión Total</TableCell>
                        <TableCell>{formatCurrency(rentabilidadData.inversionTotal)}</TableCell>
                        <TableCell>Capital inicial y gastos acumulados en el proyecto</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Ingresos Totales</TableCell>
                        <TableCell>{formatCurrency(rentabilidadData.ingresosTotales)}</TableCell>
                        <TableCell>Monto total percibido durante la vida del proyecto</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Costos Totales</TableCell>
                        <TableCell>{formatCurrency(rentabilidadData.costosTotales)}</TableCell>
                        <TableCell>Gastos acumulados del proyecto</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Beneficio Neto</TableCell>
                        <TableCell>
                          <Typography 
                            color={rentabilidadData.beneficioNeto >= 0 ? 'success.main' : 'error'}
                          >
                            {formatCurrency(rentabilidadData.beneficioNeto)}
                          </Typography>
                        </TableCell>
                        <TableCell>Ingresos menos costos totales</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Tasa Interna de Retorno (TIR)</TableCell>
                        <TableCell>{formatPercent(rentabilidadData.tir)}</TableCell>
                        <TableCell>
                          {rentabilidadData.tir > 0 
                            ? 'Rentabilidad interna del proyecto' 
                            : 'El proyecto necesita revisión económica'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Período de Recuperación</TableCell>
                        <TableCell>{rentabilidadData.periodoRecuperacion} meses</TableCell>
                        <TableCell>Tiempo estimado para recuperar la inversión</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Notas y Recomendaciones" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
                  {rentabilidadData.recomendaciones || 'No hay recomendaciones disponibles.'}
                </Typography>
                
                {rentabilidadData.advertencias && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" color="warning.main" gutterBottom>
                      Advertencias:
                    </Typography>
                    <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
                      {rentabilidadData.advertencias}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProyectoRentabilidad; 