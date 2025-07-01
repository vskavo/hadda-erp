import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import TopBar from './TopBar';
import SideBar from './SideBar';

const drawerWidth = 240;

const MainLayout = () => {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Barra superior */}
      <TopBar 
        open={open} 
        drawerWidth={drawerWidth} 
        toggleDrawer={toggleDrawer}
        handleDrawerToggle={handleDrawerToggle}
      />
      
      {/* Barra lateral */}
      <SideBar 
        open={open} 
        mobileOpen={mobileOpen}
        drawerWidth={drawerWidth} 
        handleDrawerToggle={handleDrawerToggle}
      />
      
      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginLeft: { sm: 0 },
          transition: (theme) =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout; 