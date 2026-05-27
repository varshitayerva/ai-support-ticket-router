import React from 'react';
import { Button, CircularProgress, Box } from '@mui/material';

function LoadingButton({
  loading = false,
  disabled = false,
  children,
  onClick,
  variant = 'contained',
  color = 'primary',
  type = 'button',
  endIcon,
  sx,
  ...props
}) {
  return (
    <Button
      type={type}
      variant={variant}
      color={color}
      disabled={loading || disabled}
      onClick={onClick}
      endIcon={loading ? undefined : endIcon}
      sx={{
        position: 'relative',
        textTransform: 'none',
        fontSize: '1rem',
        fontWeight: 600,
        ...sx
      }}
      {...props}
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} color="inherit" />
          <span>Loading...</span>
        </Box>
      ) : (
        children
      )}
    </Button>
  );
}

export default LoadingButton;
