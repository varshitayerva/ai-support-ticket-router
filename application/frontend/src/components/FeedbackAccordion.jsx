import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function FeedbackAccordion({
  title,
  feedback,
  index = 0,
  severity = 'info'
}) {
  const severityColors = {
    success: '#4ade80',
    warning: '#facc15',
    error: '#ef4444',
    info: '#3b82f6'
  };

  return (
    <Accordion
      sx={{
        backgroundColor: 'transparent',
        border: `2px solid ${severityColors[severity]}`,
        borderRadius: 2,
        mb: 1,
        animation: `fadeIn 0.3s ease-in-out ${index * 0.1}s`,
        '&:before': {
          display: 'none'
        },
        '&.Mui-expanded': {
          margin: 0
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: `${severityColors[severity]}20`,
          '&:hover': {
            backgroundColor: `${severityColors[severity]}30`
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={severity.charAt(0).toUpperCase() + severity.slice(1)}
            size="small"
            sx={{
              backgroundColor: severityColors[severity],
              color: 'white',
              fontWeight: 600
            }}
          />
          <Typography sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {feedback}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}

export default FeedbackAccordion;
