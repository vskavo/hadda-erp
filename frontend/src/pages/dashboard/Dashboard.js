import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para los diferentes tipos de datos
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingCourses, setUpcomingCourses] = useState([]);

  // Cargar datos del dashboard al montar el componente
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        // Opción 1: Hacer múltiples llamadas independientes
        // const estadisticas = await dashboardService.getEstadisticas();
        // const actividades = await dashboardService.getActividadesRecientes();
        // const cursos = await dashboardService.getProximosCursos();
        
        // Opción 2: Hacer una sola llamada que devuelva todos los datos
        const dashboardData = await dashboardService.getDashboardCompleto();
        
        // Configurar estadísticas con íconos y colores
        const statsWithIcons = [
          { ...dashboardData.estadisticas.clientes, icon: <PersonIcon fontSize="large" />, color: '#1976d2' },
          { ...dashboardData.estadisticas.cursos, icon: <SchoolIcon fontSize="large" />, color: '#2e7d32' },
          { ...dashboardData.estadisticas.ingresos, icon: <AttachMoneyIcon fontSize="large" />, color: '#f57c00' },
          { ...dashboardData.estadisticas.proyectos, icon: <AssignmentIcon fontSize="large" />, color: '#d32f2f' },
        ];
        
        setStats(statsWithIcons);
        setRecentActivities(dashboardData.actividades);
        setUpcomingCourses(dashboardData.proximosCursos);
        
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar datos. Por favor, intente nuevamente.');
        
        // Cargar datos de fallback en caso de error para mantener la UI funcional
        setStats([
          { title: 'Clientes', value: '-', icon: <PersonIcon fontSize="large" />, color: '#1976d2' },
          { title: 'Cursos Activos', value: '-', icon: <SchoolIcon fontSize="large" />, color: '#2e7d32' },
          { title: 'Ingresos Mensuales', value: '-', icon: <AttachMoneyIcon fontSize="large" />, color: '#f57c00' },
          { title: 'Proyectos en Curso', value: '-', icon: <AssignmentIcon fontSize="large" />, color: '#d32f2f' },
        ]);
        setRecentActivities([]);
        setUpcomingCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Componente para mostrar durante la carga
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '80vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Bienvenido, {user?.nombre || 'Usuario'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" color="text.secondary">
                  {stat.title}
                </Typography>
                <Avatar sx={{ bgcolor: stat.color }}>
                  {stat.icon}
                </Avatar>
              </Box>
              <Typography component="p" variant="h4" sx={{ mt: 2 }}>
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      <Grid container spacing={3}>
        {/* Actividades recientes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Actividades Recientes"
              action={
                <IconButton aria-label="configuración">
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              {recentActivities.length === 0 ? (
                <Typography color="text.secondary" align="center">
                  No hay actividades recientes
                </Typography>
              ) : (
                <List sx={{ width: '100%', maxHeight: 300, overflow: 'auto' }}>
                  {recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            {activity.type === 'client' && <PersonIcon />}
                            {activity.type === 'course' && <SchoolIcon />}
                            {activity.type === 'invoice' && <AttachMoneyIcon />}
                            {activity.type === 'project' && <AssignmentIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="text.primary">
                                {activity.description}
                              </Typography>
                              {` — ${activity.time}`}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Próximos cursos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Próximos Cursos"
              action={
                <IconButton aria-label="configuración">
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              {upcomingCourses.length === 0 ? (
                <Typography color="text.secondary" align="center">
                  No hay cursos programados próximamente
                </Typography>
              ) : (
                <List sx={{ width: '100%' }}>
                  {upcomingCourses.map((course, index) => (
                    <React.Fragment key={course.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#2e7d32' }}>
                            <SchoolIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={course.name}
                          secondary={`${course.date} - ${course.participants} participantes`}
                        />
                      </ListItem>
                      {index < upcomingCourses.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 