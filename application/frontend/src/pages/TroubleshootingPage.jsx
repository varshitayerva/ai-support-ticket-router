import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent
} from '@mui/material';

import ProgressTracker from '../components/ProgressTracker';
import LoadingButton from '../components/LoadingButton';
import StepCard from '../components/StepCard';
import SnackbarAlert from '../components/SnackbarAlert';
import LoadingOverlay from '../components/LoadingOverlay';
import SkeletonLoader from '../components/SkeletonLoader';
import EditTicketModal from '../components/EditTicketModal';
import { parseSteps, cleanMarkdown } from '../utils/markdownCleaner';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';

function TroubleshootingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, ticket, analysisJudge } = location.state || {};

  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(ticket);

  React.useEffect(() => {
    if (!analysis) {
      navigate('/');
    }
  }, [analysis, navigate]);

  const handleGenerateGuidance = async () => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/guidance', {
        ticket,
        analysis
      });
      const steps = parseSteps(response.data.guidance);
      setGuidance({
        raw: response.data.guidance,
        steps: steps.length > 0 ? steps : [{ id: 0, title: cleanMarkdown(response.data.guidance) }]
      });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to generate guidance.';
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(guidance?.raw || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNext = () => {
    if (guidance) {
      navigate('/email-results', {
        state: { analysis, ticket: currentTicket, analysisJudge, guidance: guidance.raw }
      });
    }
  };

  const handleEditTicket = (editedTicket) => {
    setCurrentTicket(editedTicket);
    setGuidance(null);
    setLoading(true);

    axios.post('http://localhost:8000/api/guidance', {
      ticket: editedTicket,
      analysis
    })
      .then((response) => {
        const steps = parseSteps(response.data.guidance);
        setGuidance({
          raw: response.data.guidance,
          steps: steps.length > 0 ? steps : [{ id: 0, title: cleanMarkdown(response.data.guidance) }]
        });
        setLoading(false);
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.detail || 'Failed to regenerate guidance.';
        setError(errorMessage);
        setShowError(true);
        setLoading(false);
      });
  };

  if (!analysis) {
    return null;
  }

  const guidanceTitle = analysis.urgency === 'High' ? 'Troubleshooting Steps' : 'Self-Service Guidance';

  return (
    <>
      <LoadingOverlay loading={loading} message="Generating troubleshooting steps..." />
      <SnackbarAlert
        open={showError}
        message={error}
        severity="error"
        onClose={() => setShowError(false)}
      />
      <SnackbarAlert
        open={copied}
        message="Copied to clipboard!"
        severity="success"
        onClose={() => setCopied(false)}
        autoHideDuration={2000}
      />

      <Box sx={{ minHeight: '100vh', background: '#F8FAFC', py: 4 }}>
        <Container maxWidth="lg">
          <ProgressTracker currentStep={1} showNavigation={false} />

          <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {guidanceTitle}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Step-by-step guidance to resolve the customer issue
                </Typography>
              </Box>
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditModalOpen(true)}
                variant="outlined"
                size="small"
              >
                Edit Ticket
              </Button>
            </Box>

            <EditTicketModal
              ticket={currentTicket}
              open={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              onSave={handleEditTicket}
            />

            {!guidance && (
              <Box sx={{ mb: 4 }}>
                <LoadingButton
                  loading={loading}
                  disabled={loading}
                  onClick={handleGenerateGuidance}
                  variant="contained"
                  color="primary"
                  sx={{ mb: 3 }}
                >
                  Generate {guidanceTitle}
                </LoadingButton>
                {loading && <SkeletonLoader count={3} />}
              </Box>
            )}

            {guidance && (
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  mb: 4,
                  animation: 'fadeIn 0.3s ease-in-out'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {guidance.steps.length} Steps
                    </Typography>
                    <Button
                      startIcon={<ContentCopyIcon />}
                      onClick={handleCopy}
                      variant="outlined"
                      size="small"
                    >
                      Copy All
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {guidance.steps.map((step, index) => (
                      <StepCard
                        key={step.id}
                        index={index}
                        title={step.title}
                        description={step.description}
                        onCopy={handleCopy}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/analysis-results', {
                  state: { analysis, ticket }
                })}
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
              >
                Start Over
              </Button>
              <LoadingButton
                disabled={!guidance}
                onClick={handleNext}
                variant="contained"
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </LoadingButton>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}

export default TroubleshootingPage;
