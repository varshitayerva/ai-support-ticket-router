import React from 'react';
import { Snackbar, Alert } from '@mui/material';

function SnackbarAlert({
  open = false,
  message = '',
  severity = 'info',
  onClose,
  autoHideDuration = 5000
}) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{
          width: '100%',
          fontSize: '1rem',
          padding: '16px 24px',
          '& .MuiAlert-message': {
            fontSize: '1rem',
            fontWeight: 500
          }
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

export default SnackbarAlert;
