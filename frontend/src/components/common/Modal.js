import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Divider
} from '@mui/material';
import { FaTimes } from 'react-icons/fa';

/**
 * Yeniden kullanılabilir modal bileşeni
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmButtonText = 'Kaydet',
  cancelButtonText = 'İptal',
  maxWidth = 'sm',
  fullWidth = true,
  hideConfirmButton = false,
  hideCloseButton = false,
  confirmDisabled = false,
  confirmColor = 'primary'
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {title}
        {!hideCloseButton && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <FaTimes />
          </IconButton>
        )}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2 }}>
        {children}
      </DialogContent>
      
      {(!hideConfirmButton || !hideCloseButton) && (
        <>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            {!hideCloseButton && (
              <Button onClick={onClose} color="inherit" variant="outlined">
                {cancelButtonText}
              </Button>
            )}
            {!hideConfirmButton && onConfirm && (
              <Button 
                onClick={onConfirm} 
                color={confirmColor} 
                variant="contained"
                disabled={confirmDisabled}
              >
                {confirmButtonText}
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onConfirm: PropTypes.func,
  confirmButtonText: PropTypes.string,
  cancelButtonText: PropTypes.string,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  hideConfirmButton: PropTypes.bool,
  hideCloseButton: PropTypes.bool,
  confirmDisabled: PropTypes.bool,
  confirmColor: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'info', 'warning'])
};

export default Modal; 