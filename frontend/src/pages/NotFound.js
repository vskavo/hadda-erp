import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h1" color="primary" sx={{ fontSize: { xs: '6rem', md: '10rem' } }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Página no encontrada
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 600 }}>
        La página que estás buscando no existe o ha sido movida a otra ubicación.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Volver al Inicio
      </Button>
    </Box>
  );
};

export default NotFound; 