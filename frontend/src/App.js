import React from 'react';
import { CssBaseline, Box } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';

// Importar las rutas desde el archivo separado
import AppRoutes from './routes';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';

function App() {
  const { loading } = useAuth();
  const { theme } = useTheme();

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
      <AppRoutes />
    </LocalizationProvider>
  );
}

export default App; 