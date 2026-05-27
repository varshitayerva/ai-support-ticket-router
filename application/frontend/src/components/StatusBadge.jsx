import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

function StatusBadge({ approved = true, variant = 'standard' }) {
  if (approved) {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="Approved"
        color="success"
        variant={variant}
        sx={{ fontWeight: 600, fontSize: '1rem', py: 2, px: 2 }}
      />
    );
  }

  return (
    <Chip
      icon={<CancelIcon />}
      label="Needs Review"
      color="error"
      variant={variant}
      sx={{ fontWeight: 600, fontSize: '1rem', py: 2, px: 2 }}
    />
  );
}

export default StatusBadge;
