import React from 'react';
import { 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  Button,
  IconButton,
  Typography,
  Box,
  Divider,
  Slide,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

// Transición para la entrada del modal
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Componente de Modal reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.open - Estado para mostrar/ocultar el modal
 * @param {function} props.onClose - Función para cerrar el modal
 * @param {string} props.title - Título del modal
 * @param {string} [props.subtitle] - Subtítulo opcional
 * @param {React.ReactNode} props.children - Contenido del modal
 * @param {React.ReactNode} [props.actions] - Acciones para el footer (botones)
 * @param {string} [props.maxWidth='sm'] - Ancho máximo del modal (xs, sm, md, lg, xl)
 * @param {boolean} [props.fullWidth=true] - Si el modal debe ocupar el ancho máximo disponible
 * @param {boolean} [props.fullScreen=false] - Si el modal debe ser de pantalla completa
 * @param {function} [props.onSubmit] - Función para manejar el envío de un formulario
 * @param {boolean} [props.loading=false] - Estado de carga
 * @param {string} [props.submitText='Aceptar'] - Texto del botón de envío
 * @param {string} [props.cancelText='Cancelar'] - Texto del botón de cancelar
 * @param {boolean} [props.showCloseButton=true] - Si se debe mostrar el botón de cierre en el título
 * @param {boolean} [props.disableBackdropClick=false] - Si se debe deshabilitar el cierre al hacer clic en el fondo
 * @param {boolean} [props.disableEscapeKeyDown=false] - Si se debe deshabilitar el cierre al presionar Escape
 * @param {Object} [props.dialogProps={}] - Props adicionales para el componente Dialog
 * @returns {React.Component} Componente Modal
 */
const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen: forcedFullScreen = false,
  onSubmit,
  loading = false,
  submitText = 'Aceptar',
  cancelText = 'Cancelar',
  showCloseButton = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  dialogProps = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fullScreen = forcedFullScreen || isMobile;

  // Manejar clic en el backdrop
  const handleBackdropClick = (event) => {
    if (disableBackdropClick) {
      event.stopPropagation();
    }
  };

  // Renderizar acciones predeterminadas si no se proporcionan
  const renderActions = () => {
    if (actions) {
      return actions;
    }

    if (onSubmit) {
      return (
        <>
          <Button 
            onClick={onClose} 
            color="inherit" 
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button 
            onClick={onSubmit} 
            color="primary" 
            variant="contained" 
            disabled={loading}
            autoFocus
          >
            {loading ? 'Procesando...' : submitText}
          </Button>
        </>
      );
    }

    return (
      <Button onClick={onClose} color="primary" autoFocus>
        Cerrar
      </Button>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (disableEscapeKeyDown && e.key === 'Escape') {
          e.stopPropagation();
        }
      }}
      {...dialogProps}
    >
      {/* Título del modal */}
      <DialogTitle id="modal-title" sx={{ m: 0, p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="subtitle2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {showCloseButton && (
            <IconButton
              aria-label="cerrar"
              onClick={onClose}
              edge="end"
              size="large"
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      
      <Divider />
      
      {/* Contenido del modal */}
      <DialogContent>
        {typeof children === 'string' ? (
          <DialogContentText>{children}</DialogContentText>
        ) : (
          children
        )}
      </DialogContent>
      
      {/* Acciones del modal */}
      <DialogActions>
        {renderActions()}
      </DialogActions>
    </Dialog>
  );
};

export default Modal; 