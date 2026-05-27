import React from 'react';
import { Box, Stepper, Step, StepLabel, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

const STEPS = [
  { label: 'Analysis', path: '/analysis-results', index: 0 },
  { label: 'Troubleshooting', path: '/troubleshooting-results', index: 1 },
  { label: 'Email', path: '/email-results', index: 2 },
  { label: 'Quality Review', path: '/quality-results', index: 3 }
];

function ProgressTracker({ currentStep = 0, onPrevious, onNext, showNavigation = true }) {
  const navigate = useNavigate();

  const handleStepClick = (stepPath) => {
    navigate(stepPath);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
        {STEPS.map((step) => (
          <Step key={step.path}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {showNavigation && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button
            startIcon={<NavigateBeforeIcon />}
            onClick={onPrevious}
            disabled={currentStep === 0}
            variant="outlined"
          >
            Previous
          </Button>
          <Button
            endIcon={<NavigateNextIcon />}
            onClick={onNext}
            disabled={currentStep === STEPS.length - 1}
            variant="contained"
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default ProgressTracker;
