import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard';
import NotFound from './pages/NotFound';
import UserProfile from './pages/users/UserProfile';
import UserManagement from './pages/users/UserManagement';

// Clientes
import ClientesList from './pages/clientes/ClientesList';
import ClienteDetail from './pages/clientes/ClienteDetail';
import ClienteForm from './pages/clientes/ClienteForm';
import ContactoForm from './pages/clientes/contactos/ContactoForm';
import ActividadForm from './pages/clientes/actividades/ActividadForm';
import HoldingsListPage from './pages/clientes/HoldingsListPage';
import HoldingDetailPage from './pages/clientes/HoldingDetailPage';

// Cursos
import CursosList from './pages/cursos/CursosList';
import CursoForm from './pages/cursos/CursoForm';
import ParticipanteForm from './pages/cursos/participantes/ParticipanteForm';
import SesionForm from './pages/cursos/sesiones/SesionForm';
import AsistenciaForm from './pages/cursos/sesiones/AsistenciaForm';

// Finanzas
import FacturasList from './pages/finanzas/FacturasList';
import FacturaForm from './pages/finanzas/FacturaForm';
import MovimientosList from './pages/finanzas/MovimientosList';
import FinancierosDashboard from './pages/finanzas/FinancierosDashboard';
import ConciliacionBancaria from './pages/finanzas/ConciliacionBancaria';

// Ventas
import { VentasList, VentaForm, VentaDetail } from './pages/ventas';

// Proyectos
import { 
  ProyectosList,
  ProyectoForm,
  ProyectoRentabilidad,
  ProyectoSeguimiento
} from './pages/proyectos';

// Reportes (Añadido)
import ReportesList from './pages/reportes/ReportesList';
import GeneradorReportes from './pages/reportes/GeneradorReportes';

// Protección de rutas
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';

// Importar los nuevos componentes de gestión de roles
import RolesList from './pages/administracion/roles/RolesList';
import RolForm from './pages/administracion/roles/RolForm';
import ConfiguracionesERP from './pages/administracion/configuraciones/ConfiguracionesERP';

// Componente para redireccionar a nueva venta con el ID del cliente
const RedirectToNewVenta = () => {
  const { clienteId } = useParams();
  return (
    <Navigate to="/ventas/nueva" state={{ clienteId }} replace />
  );
};

function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const { theme } = useTheme();

  // Corregido: Usar user?.rol y aceptar 'administrador'
  const isAdmin = user?.rol === 'admin' || user?.rol === 'administrador';
  const isFinanciero = isAdmin || user?.rol === 'finanzas';
  const canViewReportes = isAdmin || user?.rol === 'gerencia' || user?.rol === 'finanzas'; // Nueva variable para reportes

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: theme === 'dark' ? 'background.dark' : 'background.light',
        }}
      >
        Cargando...
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <CssBaseline />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
        <Route path="/reset-password/:token" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/dashboard" />} />
        <Route path="/auth/recuperar/:token" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/dashboard" />} />
        
        {/* Rutas protegidas */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<UserProfile />} />
          
          {/* Rutas de administración */}
          <Route path="admin">
            <Route index element={isAdmin ? <Navigate to="users" /> : <Navigate to="/dashboard" />} />
            <Route path="users" element={isAdmin ? <UserManagement /> : <Navigate to="/dashboard" />} />
            <Route path="roles" element={isAdmin ? <RolesList /> : <Navigate to="/dashboard" />} />
            <Route path="roles/nuevo" element={isAdmin ? <RolForm /> : <Navigate to="/dashboard" />} />
            <Route path="roles/editar/:id" element={isAdmin ? <RolForm /> : <Navigate to="/dashboard" />} />
            <Route path="configuraciones-erp" element={isAdmin ? <ConfiguracionesERP /> : <Navigate to="/dashboard" />} />
          </Route>
          
          {/* Clientes */}
          <Route path="clientes">
            <Route index element={<ClientesList />} />
            <Route path=":id" element={<ClienteDetail />} />
            <Route path="nuevo" element={<ClienteForm />} />
            <Route path="editar/:id" element={<ClienteForm />} />
            <Route path=":clienteId/contactos/nuevo" element={<ContactoForm />} />
            <Route path=":clienteId/contactos/editar/:id" element={<ContactoForm />} />
            <Route path=":clienteId/actividades/nueva" element={<ActividadForm />} />
            <Route path=":clienteId/actividades/:id" element={<ActividadForm />} />
            <Route path=":clienteId/actividades/editar/:id" element={<ActividadForm />} />
            <Route path=":clienteId/ventas/nueva" element={<ProtectedRoute><RedirectToNewVenta /></ProtectedRoute>} />
            <Route path="holdings-summary" element={<HoldingsListPage />} />
            <Route path="holdings-summary/:nombreHolding/detalles" element={<HoldingDetailPage />} />
          </Route>
          
          {/* Cursos */}
          <Route path="cursos">
            <Route index element={<CursosList />} />
            <Route path="nuevo" element={<Navigate to="/dashboard" replace />} />
            <Route path="editar/:id" element={<CursoForm />} />
            <Route path=":cursoId/participantes/nuevo" element={<ParticipanteForm />} />
            <Route path=":cursoId/participantes/editar/:id" element={<ParticipanteForm />} />
            <Route path=":cursoId/sesiones/nueva" element={<SesionForm />} />
            <Route path=":cursoId/sesiones/editar/:id" element={<SesionForm />} />
            <Route path=":cursoId/sesiones/:sesionId/asistencia" element={<AsistenciaForm />} />
            <Route path=":cursoId/declaraciones/:id" element={<Navigate to="/dashboard" />} />
          </Route>
          
          {/* Finanzas */}
          <Route path="finanzas">
            <Route index element={isFinanciero ? <FinancierosDashboard /> : <Navigate to="/dashboard" />} />
            <Route path="dashboard" element={isFinanciero ? <FinancierosDashboard /> : <Navigate to="/dashboard" />} />
            <Route path="facturas" element={isFinanciero ? <FacturasList /> : <Navigate to="/dashboard" />} />
            <Route path="facturas/nueva" element={isFinanciero ? <FacturaForm /> : <Navigate to="/dashboard" />} />
            <Route path="facturas/:id" element={isFinanciero ? <FacturaForm /> : <Navigate to="/dashboard" />} />
            <Route path="facturas/editar/:id" element={isFinanciero ? <FacturaForm /> : <Navigate to="/dashboard" />} />
            <Route path="movimientos" element={isFinanciero ? <MovimientosList /> : <Navigate to="/dashboard" />} />
            <Route path="conciliacion" element={isFinanciero ? <ConciliacionBancaria /> : <Navigate to="/dashboard" />} />
          </Route>
          
          {/* Ventas */}
          <Route path="ventas">
            <Route index element={<VentasList />} />
            <Route path="nueva" element={<VentaForm />} />
            <Route path=":id" element={<VentaDetail />} />
            <Route path="editar/:id" element={<VentaForm />} />
          </Route>
          
          {/* Proyectos */}
          <Route path="proyectos">
            <Route index element={<ProyectosList />} />
            <Route path="nuevo" element={<ProyectoForm />} />
            <Route path=":id/editar" element={<ProyectoForm />} />
            <Route path=":id/rentabilidad" element={<ProyectoRentabilidad />} />
            <Route path=":id/seguimiento" element={<ProyectoSeguimiento />} />
          </Route>
          
          {/* Reportes */}
          <Route path="reportes">
            <Route index element={canViewReportes ? <ReportesList /> : <Navigate to="/dashboard" />} />
            <Route path="generador" element={canViewReportes ? <GeneradorReportes /> : <Navigate to="/dashboard" />} />
          </Route>
        </Route>

        {/* Ruta de 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </LocalizationProvider>
  );
}

export default App; 