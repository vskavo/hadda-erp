import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SyncIcon from '@mui/icons-material/Sync';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Importar componentes específicos para cada vista
import ProyeccionesView from './components/ProyeccionesView';
import SiiView from './components/SiiView';

// Componente principal para gestionar ingresos y egresos divididos por fuente
const MovimientosList = () => {
  const navigate = useNavigate();
  
  // Estado para la gestión de pestañas principales
  const [mainTabValue, setMainTabValue] = useState(0);

  // Funciones para manejar cambios de pestañas principales
  const handleMainTabChange = (event, newValue) => {
    setMainTabValue(newValue);
  };

  return (
    <Box sx={{ pb: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Ingresos y Egresos
            </Typography>

          <Paper sx={{ mb: 3 }}>
            <Tabs 
          value={mainTabValue}
          onChange={handleMainTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
          <Tab
            label="Proyecciones"
            icon={<TrendingUpIcon />}
            iconPosition="start"
            sx={{ fontWeight: 'medium' }}
          />
          <Tab
            label="SII"
            icon={<SyncIcon />}
            iconPosition="start"
            sx={{ fontWeight: 'medium' }}
          />
            </Tabs>
          </Paper>

      {/* Panel de Proyecciones */}
      {mainTabValue === 0 && (
        <ProyeccionesView />
      )}

      {/* Panel de SII */}
      {mainTabValue === 1 && (
        <SiiView />
      )}
    </Box>
  );
};

export default MovimientosList; 