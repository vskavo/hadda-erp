import React from 'react';
import { Button } from '@mui/material';
import Modal from './Modal';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Componente de diálogo de confirmación
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.open - Estado para mostrar/ocultar el diálogo
 * @param {function} props.onClose - Función para cerrar el diálogo
 * @param {function} props.onCancel - Función a ejecutar cuando se cancela
 * @param {function} props.onConfirm - Función a ejecutar cuando se confirma
 * @param {string} [props.title='Confirmación'] - Título del diálogo
 * @param {string} props.message - Mensaje de confirmación
 * @param {string} [props.confirmText='Confirmar'] - Texto del botón de confirmar
 * @param {string} [props.cancelText='Cancelar'] - Texto del botón de cancelar
 * @param {string} [props.type='warning'] - Tipo de confirmación (warning, info, error, success)
 * @param {boolean} [props.loading=false] - Estado de carga
 * @param {boolean} [props.disableBackdropClick=true] - Si se debe deshabilitar el cierre al hacer clic en el fondo
 * @param {boolean} [props.disableEscapeKeyDown=true] - Si se debe deshabilitar el cierre al presionar Escape
 * @returns {React.Component} Componente de confirmación
 */
const Confirm = ({
  open,
  onClose,
  onCancel,
  onConfirm,
  title = 'Confirmación',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  loading = false,
  disableBackdropClick = true,
  disableEscapeKeyDown = true,
}) => {
  // Función para manejar el cierre del diálogo
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    if (onCancel) {
      onCancel();
    }
  };

  // Acciones para el diálogo
  const actions = (
    <>
      <Button
        onClick={handleClose}
        color="inherit"
        disabled={loading}
        variant="text"
      >
        {cancelText}
      </Button>
      <Button
        onClick={onConfirm}
        color={
          type === 'warning' ? 'warning' :
          type === 'error' ? 'error' :
          type === 'success' ? 'success' :
          'primary'
        }
        variant="contained"
        disabled={loading}
        autoFocus
      >
        {loading ? 'Procesando...' : confirmText}
      </Button>
    </>
  );

  // Icono según el tipo
  const getIcon = () => {
    const iconStyle = { 
      fontSize: 48, 
      marginBottom: 2,
      color: type === 'warning' ? '#ED6C02' :
             type === 'error' ? '#D32F2F' :
             type === 'success' ? '#2E7D32' :
             '#1976D2',
    };

    switch (type) {
      case 'warning':
        return <WarningIcon sx={iconStyle} />;
      case 'error':
        return <ErrorIcon sx={iconStyle} />;
      case 'success':
        return <CheckCircleIcon sx={iconStyle} />;
      case 'info':
      default:
        return <InfoIcon sx={iconStyle} />;
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      actions={actions}
      maxWidth="xs"
      disableBackdropClick={disableBackdropClick}
      disableEscapeKeyDown={disableEscapeKeyDown}
    >
      <div style={{ textAlign: 'center', padding: '16px 8px' }}>
        {getIcon()}
        <p style={{ marginTop: 16 }}>{message}</p>
      </div>
    </Modal>
  );
};

export default Confirm; 