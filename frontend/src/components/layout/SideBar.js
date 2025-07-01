import React from 'react';
import { 
  Box, 
  Divider, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography,
  Collapse
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PaymentsIcon from '@mui/icons-material/Payments';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

const menuItems = [
  { name: 'Panel de Control', icon: <DashboardIcon />, path: '/dashboard', permission: 'dashboard:read' },
  { name: 'Clientes', icon: <PeopleIcon />, path: '/clientes', permission: 'clientes:read' },
  { name: 'Ventas', icon: <AssignmentIcon />, path: '/proyectos', permission: 'proyectos:read' },
  { name: 'Cursos', icon: <SchoolIcon />, path: '/cursos', permission: 'cursos:read' },
  { 
    name: 'Finanzas', 
    icon: <ReceiptIcon />, 
    path: '/finanzas', 
    permission: 'finanzas:dashboard:read',
    submenu: [
      { name: 'Dashboard Financiero', icon: <SsidChartIcon />, path: '/finanzas/dashboard' },
      { name: 'Facturación', icon: <ReceiptIcon />, path: '/finanzas/facturas' },
      { name: 'Ingresos y Egresos', icon: <PaymentsIcon />, path: '/finanzas/movimientos' },
      { name: 'Conciliación Bancaria', icon: <CompareArrowsIcon />, path: '/finanzas/conciliacion' }
    ]
  },
  { 
    name: 'Reportes', 
    icon: <BarChartIcon />, 
    path: '/reportes', 
    permission: 'reportes:list:read',
    submenu: [
      { name: 'Informes Predefinidos', icon: <ListAltIcon />, path: '/reportes' },
      { name: 'Generador de Informes', icon: <AddCircleOutlineIcon />, path: '/reportes/generador' }
    ]
  },
];

// Menú de administración solo para administradores
const adminMenuItems = [
  { name: 'Usuarios', icon: <ManageAccountsIcon />, path: '/admin/users', permission: 'admin:users:manage' },
  { name: 'Gestión de Roles', icon: <LockPersonIcon />, path: '/admin/roles', permission: 'admin:roles:manage' },
  { name: 'Configuraciones ERP', icon: <SettingsIcon />, path: '/admin/configuraciones-erp', permission: 'admin:settings:manage' },
];

const SideBar = ({ open, mobileOpen, drawerWidth, handleDrawerToggle }) => {
  // Obtener user Y loading desde el contexto
  const { user, loading: authLoading } = useAuth(); 
  // Obtener hasPermission y estado de carga/error de permisos
  const { hasPermission, loading: permissionsLoading, error: permissionsError } = usePermissions(); 
  const location = useLocation();
  const navigate = useNavigate();
  const [adminOpen, setAdminOpen] = React.useState(false);
  const [openSubmenus, setOpenSubmenus] = React.useState({});

  // --- Mover useEffect aquí, ANTES del return condicional ---
  React.useEffect(() => {
    const finanzasItem = menuItems.find(item => item.name === 'Finanzas');
    if (finanzasItem && location.pathname.startsWith(finanzasItem.path)) {
      setOpenSubmenus(prev => ({
        ...prev,
        [finanzasItem.path]: true
      }));
    }
  }, [location.pathname]);
  // --- Fin useEffect ---

  // Esperar a que termine la carga de auth Y permisos
  if (authLoading || permissionsLoading) {
    return null; // O un spinner 
  }
  
  // Manejar error de carga de permisos (opcional: mostrar mensaje)
  if (permissionsError) {
      console.error("Error cargando permisos para sidebar:", permissionsError);
      // Podrías mostrar un estado de error o menú vacío
  }

  // El rol de admin se maneja dentro de hasPermission ahora
  const isAdmin = user?.rol && user.rol.toLowerCase() === 'administrador'; 
  
  // Filtrar menú principal basado en permisos
  const filteredMenuItems = menuItems.filter((item) => 
    hasPermission(item.permission) 
  );
  
  // Filtrar menú admin basado en permisos (si se definieron)
  const filteredAdminMenuItems = adminMenuItems.filter((item) => {
    // Si es el menú de configuraciones y el usuario es admin, siempre mostrarlo
    if (item.path === '/admin/configuraciones-erp' && isAdmin) {
      return true;
    }
    // Para otros items, verificar el permiso normalmente
    return hasPermission(item.permission);
  });
  
  // Debug logs
  console.log('DEBUG SideBar - user:', user);
  console.log('DEBUG SideBar - user.rol:', user?.rol);
  console.log('DEBUG SideBar - isAdmin:', isAdmin);
  console.log('DEBUG SideBar - adminMenuItems:', adminMenuItems);
  console.log('DEBUG SideBar - filteredAdminMenuItems:', filteredAdminMenuItems);

  const handleAdminClick = () => {
    setAdminOpen(!adminOpen);
  };

  const handleSubmenuClick = (path) => {
    setOpenSubmenus({
      ...openSubmenus,
      [path]: !openSubmenus[path]
    });
  };

  // Verificar si un elemento o alguno de sus elementos secundarios está activo
  const isActiveItem = (item) => {
    if (location.pathname.startsWith(item.path)) {
      return true;
    }
    if (item.submenu) {
      return item.submenu.some(subItem => location.pathname.startsWith(subItem.path));
    }
    return false;
  };

  // Menú de administración - mostrar siempre si es admin
  const showAdminMenu = isAdmin && filteredAdminMenuItems.length > 0;

  // Debug final
  console.log('DEBUG SideBar - showAdminMenu:', showAdminMenu);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Hadda - ERP
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* Menú principal siempre visible para usuarios autenticados */}
      <List>
        {filteredMenuItems.map((item) => (
          <React.Fragment key={item.name}>
            <ListItem disablePadding>
              <ListItemButton
                selected={isActiveItem(item)}
                onClick={() => {
                  if (item.submenu) {
                    handleSubmenuClick(item.path);
                  } else {
                    navigate(item.path);
                    if (mobileOpen) handleDrawerToggle();
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.name} />
                {item.submenu && (
                  openSubmenus[item.path] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>
            
            {item.submenu && (
              <Collapse in={openSubmenus[item.path]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <ListItem key={subItem.name} disablePadding>
                      <ListItemButton
                        selected={location.pathname === subItem.path}
                        onClick={() => {
                          navigate(subItem.path);
                          if (mobileOpen) handleDrawerToggle();
                        }}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.name} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
      
      {/* Menú de administración solo para administradores */}
      {isAdmin && (
        <>
          <Divider sx={{ mt: 2, mb: 2 }} />
          <ListItem disablePadding>
            <ListItemButton onClick={handleAdminClick}>
              <ListItemIcon>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Administración" />
              {adminOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={adminOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {adminMenuItems.map((item) => (
                <ListItem key={item.name} disablePadding>
                  <ListItemButton
                    selected={location.pathname.startsWith(item.path)}
                    onClick={() => {
                      navigate(item.path);
                      if (mobileOpen) handleDrawerToggle();
                    }}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </>
      )}
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: open ? drawerWidth : drawerWidth / 4 }, flexShrink: { sm: 0 } }}
      aria-label="carpetas"
    >
      {/* Drawer para dispositivos móviles */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Mejor rendimiento en dispositivos móviles
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Drawer permanente para escritorio */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: open ? drawerWidth : drawerWidth / 4,
            overflowX: 'hidden',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default SideBar; 