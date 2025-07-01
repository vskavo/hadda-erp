import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

// Importación de componentes de autenticación
import { Login, Register, ForgotPassword, ResetPassword } from './pages/auth';
import { Dashboard } from './pages/dashboard';
import { NotFound } from './pages';
import { PrivateRoute } from './components/auth';

// Importaciones de módulos
import { ClientesList, ClienteDetail } from './pages/clientes';
import { ProyectosList, ProyectoRentabilidad, ProyectoSeguimiento, ProyectoForm } from './pages/proyectos';
import { CursosList } from './pages/cursos';
import { UsersList, UserDetail } from './pages/users';
import { FacturasList, FacturaDetail } from './pages/finanzas';
import { VentasList, VentaForm, VentaDetail } from './pages/ventas';

// Importaciones de rutas para reportes
import { ReportesList, ReporteDetail, GeneradorReportes } from './pages/reportes';

// Importar los nuevos componentes de gestión de roles
import { RolesList, RolForm } from './pages/administracion/roles'; // Asegúrate que la ruta de importación sea correcta
// Importar el componente de configuraciones
import ConfiguracionesERP from './pages/administracion/configuraciones/ConfiguracionesERP';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas de autenticación */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Rutas protegidas */}
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      
      {/* Clientes */}
      <Route path="/clientes" element={<PrivateRoute><ClientesList /></PrivateRoute>} />
      <Route path="/clientes/:id" element={<PrivateRoute><ClienteDetail /></PrivateRoute>} />
      
      {/* Proyectos */}
      <Route path="/proyectos" element={<PrivateRoute><ProyectosList /></PrivateRoute>} />
      <Route path="/proyectos/:id" element={<PrivateRoute><ProyectoForm /></PrivateRoute>} />
      <Route path="/proyectos/:id/rentabilidad" element={<PrivateRoute><ProyectoRentabilidad /></PrivateRoute>} />
      <Route path="/proyectos/:id/seguimiento" element={<PrivateRoute><ProyectoSeguimiento /></PrivateRoute>} />
      
      {/* Ventas */}
      <Route path="/ventas" element={<PrivateRoute><VentasList /></PrivateRoute>} />
      <Route path="/ventas/nueva" element={<PrivateRoute><VentaForm /></PrivateRoute>} />
      <Route path="/ventas/editar/:id" element={<PrivateRoute><VentaForm /></PrivateRoute>} />
      <Route path="/ventas/:id" element={<PrivateRoute><VentaDetail /></PrivateRoute>} />
      
      {/* Cursos */}
      <Route path="/cursos" element={<PrivateRoute><CursosList /></PrivateRoute>} />
      
      {/* Usuarios */}
      <Route path="/users" element={<PrivateRoute><UsersList /></PrivateRoute>} />
      <Route path="/users/:id" element={<PrivateRoute><UserDetail /></PrivateRoute>} />
      
      {/* Administración - Gestión de Roles */}
      <Route 
        path="/administracion/roles" 
        element={<PrivateRoute><RolesList /></PrivateRoute>} 
      />
      <Route 
        path="/administracion/roles/nuevo" 
        element={<PrivateRoute><RolForm /></PrivateRoute>} 
      />
      <Route 
        path="/administracion/roles/editar/:id" 
        element={<PrivateRoute><RolForm /></PrivateRoute>} 
      />
      {/* Administración - Configuraciones */}
      <Route 
        path="/admin/configuraciones-erp" 
        element={<PrivateRoute><ConfiguracionesERP /></PrivateRoute>} 
      />
      
      {/* Finanzas */}
      <Route path="/facturas" element={<PrivateRoute><FacturasList /></PrivateRoute>} />
      <Route path="/facturas/:id" element={<PrivateRoute><FacturaDetail /></PrivateRoute>} />
      
      {/* Reportes */}
      <Route path="/reportes" element={<PrivateRoute><ReportesList /></PrivateRoute>} />
      <Route path="/reportes/generador" element={<PrivateRoute><GeneradorReportes /></PrivateRoute>} />
      <Route path="/reportes/:id" element={<PrivateRoute><ReporteDetail /></PrivateRoute>} />
      
      {/* Ruta para página no encontrada */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes; 