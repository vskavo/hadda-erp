import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';

/**
 * Componente para mostrar un estado vacío o sin resultados
 * 
 * @param {Object} props
 * @param {string} props.type - Tipo de estado vacío (empty, noResults, error, notFound)
 * @param {string} props.title - Título del mensaje
 * @param {string} props.message - Mensaje descriptivo
 * @param {string} props.actionText - Texto del botón de acción
 * @param {function} props.onAction - Función a ejecutar al hacer clic en el botón de acción
 * @param {JSX.Element} props.icon - Ícono personalizado
 * @param {string} props.description - Descripción alternativa a message (para compatibilidad)
 * @param {function} props.onActionClick - Función alternativa a onAction (para compatibilidad)
 * @param {Object} props.sx - Estilos adicionales
 * @returns {JSX.Element}
 */
const EmptyState = ({ 
  type = 'empty', 
  title, 
  message, 
  description, // Para compatibilidad con el nuevo formato
  actionText, 
  onAction,
  onActionClick, // Para compatibilidad con el nuevo formato
  icon, // Ícono personalizado
  sx = {}
}) => {
  // Determinar el icono según el tipo o usar el personalizado
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'empty':
        return <InboxIcon sx={{ fontSize: 80, color: 'text.secondary' }} />;
      case 'noResults':
        return <SearchOffIcon sx={{ fontSize: 80, color: 'text.secondary' }} />;
      case 'error':
        return <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main' }} />;
      case 'notFound':
        return <SentimentDissatisfiedIcon sx={{ fontSize: 80, color: 'text.secondary' }} />;
      default:
        return <InboxIcon sx={{ fontSize: 80, color: 'text.secondary' }} />;
    }
  };

  // Determinar título por defecto según el tipo si no se proporciona
  const getDefaultTitle = () => {
    switch (type) {
      case 'empty':
        return 'No hay datos disponibles';
      case 'noResults':
        return 'No se encontraron resultados';
      case 'error':
        return 'Se produjo un error';
      case 'notFound':
        return 'No encontrado';
      default:
        return 'No hay datos disponibles';
    }
  };

  // Para compatibilidad con diferentes nombres de props
  const finalMessage = message || description;
  const handleAction = onAction || onActionClick;

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 4, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: 300,
        ...sx
      }}
    >
      <Box sx={{ mb: 2 }}>
        {getIcon()}
      </Box>
      <Typography variant="h5" gutterBottom>
        {title || getDefaultTitle()}
      </Typography>
      {finalMessage && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {finalMessage}
        </Typography>
      )}
      {actionText && handleAction && (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleAction}
        >
          {actionText}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState; 