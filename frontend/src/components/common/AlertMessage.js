import React from 'react';
import { Alert, Snackbar, Box } from '@mui/material';

/**
 * Componente para mostrar mensajes de alerta o notificaciones
 * 
 * @param {Object} props
 * @param {string} props.type - Tipo de alerta (success, error, warning, info)
 * @param {string} props.message - Mensaje a mostrar
 * @param {boolean} props.show - Indica si se debe mostrar la alerta
 * @param {function} props.onClose - Función a ejecutar al cerrar la alerta
 * @param {boolean} props.autoHide - Indica si la alerta debe ocultarse automáticamente
 * @param {number} props.autoHideDuration - Duración en ms antes de ocultar automáticamente
 * @param {Object} props.sx - Estilos adicionales
 * @returns {JSX.Element}
 */
const AlertMessage = ({ 
  type = 'info', 
  message, 
  show = false, 
  onClose, 
  autoHide = false,
  autoHideDuration = 6000,
  sx = {},
  ...props
}) => {
  
  // Si autoHide es true, mostramos en Snackbar para que se cierre automáticamente
  if (autoHide) {
    return (
      <Snackbar
        open={show}
        autoHideDuration={autoHideDuration}
        onClose={onClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={onClose} 
          severity={type} 
          variant="filled" 
          sx={{ width: '100%', ...sx }}
          {...props}
        >
          {message}
        </Alert>
      </Snackbar>
    );
  }
  
  // Si autoHide es false, mostramos directamente el Alert
  return show ? (
    <Box sx={{ width: '100%', ...sx }}>
      <Alert 
        severity={type} 
        onClose={onClose}
        {...props}
      >
        {message}
      </Alert>
    </Box>
  ) : null;
};

export default AlertMessage; 