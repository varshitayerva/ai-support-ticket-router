import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

function LoadingOverlay({
  loading = false,
  message = 'Loading...'
}) {
  return (
    <Backdrop
      open={loading}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        animation: loading ? 'fadeIn 0.3s ease-in-out' : 'fadeOut 0.3s ease-in-out'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          animation: 'fadeIn 0.3s ease-in-out'
        }}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
          {message}
        </Typography>
      </Box>
    </Backdrop>
  );
}

export default LoadingOverlay;
