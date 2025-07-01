import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Componente para mostrar un indicador de carga
 * 
 * @param {Object} props
 * @param {string} props.size - Tamaño del indicador (small, medium, large)
 * @param {string} props.message - Mensaje a mostrar junto al indicador
 * @param {string} props.color - Color del indicador (primary, secondary, success, error, info, warning)
 * @param {boolean} props.fullPage - Si debe ocupar toda la página
 * @param {Object} props.sx - Estilos adicionales
 * @returns {JSX.Element}
 */
const LoadingIndicator = ({ 
  size = 'medium', 
  message, 
  color = 'primary',
  fullPage = false,
  sx = {} 
}) => {
  // Tamaño del spinner según el parámetro size
  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 60;
      case 'medium':
      default:
        return 40;
    }
  };

  // Altura del contenedor según si es página completa o no
  const containerHeight = fullPage ? '100vh' : '100%';

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        height: containerHeight,
        width: '100%',
        py: 4,
        ...sx
      }}
    >
      <CircularProgress 
        size={getSpinnerSize()} 
        color={color} 
        thickness={4}
        sx={{ mb: message ? 2 : 0 }}
      />
      
      {message && (
        <Typography 
          variant={size === 'small' ? 'body2' : 'body1'} 
          color="text.secondary"
          align="center"
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingIndicator; 