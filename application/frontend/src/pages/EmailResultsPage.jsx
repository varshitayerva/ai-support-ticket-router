import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Button
} from '@mui/material';

import ProgressTracker from '../components/ProgressTracker';
import LoadingButton from '../components/LoadingButton';
import EmailPreview from '../components/EmailPreview';
import SnackbarAlert from '../components/SnackbarAlert';
import LoadingOverlay from '../components/LoadingOverlay';
import SkeletonLoader from '../components/SkeletonLoader';
import EditTicketModal from '../components/EditTicketModal';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';

function EmailResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, ticket, analysisJudge, guidance } = location.state || {};

  const [finalEmail, setFinalEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [emailDownloaded, setEmailDownloaded] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(ticket);

  React.useEffect(() => {
    if (!analysis || !guidance) {
      navigate('/');
    }
  }, [analysis, guidance, navigate]);

  const handleGenerateEmail = async () => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/email', {
        ticket,
        analysis,
        guidance
      });
      setFinalEmail(response.data.finalEmail);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to generate email.';
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (finalEmail) {
      navigate('/quality-results', {
        state: { analysis, ticket: currentTicket, analysisJudge, guidance, finalEmail }
      });
    }
  };

  const handleEditTicket = (editedTicket) => {
    setCurrentTicket(editedTicket);
    setFinalEmail(null);
    setLoading(true);

    axios.post('http://localhost:8000/api/email', {
      ticket: editedTicket,
      analysis,
      guidance
    })
      .then((response) => {
        setFinalEmail(response.data.finalEmail);
        setLoading(false);
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.detail || 'Failed to regenerate email.';
        setError(errorMessage);
        setShowError(true);
        setLoading(false);
      });
  };

  if (!analysis || !guidance) {
    return null;
  }

  return (
    <>
      <LoadingOverlay loading={loading} message="Generating email response..." />
      <SnackbarAlert
        open={showError}
        message={error}
        severity="error"
        onClose={() => setShowError(false)}
      />
      <SnackbarAlert
        open={emailCopied}
        message="Email copied to clipboard!"
        severity="success"
        onClose={() => setEmailCopied(false)}
        autoHideDuration={2000}
      />
      <SnackbarAlert
        open={emailDownloaded}
        message="Email downloaded successfully!"
        severity="success"
        onClose={() => setEmailDownloaded(false)}
        autoHideDuration={2000}
      />

      <Box sx={{ minHeight: '100vh', background: '#F8FAFC', py: 4 }}>
        <Container maxWidth="lg">
          <ProgressTracker currentStep={2} showNavigation={false} />

          <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Suggested Email Response
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Professional email draft ready to send to the customer
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

            {!finalEmail && (
              <Box sx={{ mb: 4 }}>
                <LoadingButton
                  loading={loading}
                  disabled={loading}
                  onClick={handleGenerateEmail}
                  variant="contained"
                  color="primary"
                  sx={{ mb: 3 }}
                >
                  Generate Email
                </LoadingButton>
                {loading && <SkeletonLoader count={1} />}
              </Box>
            )}

            {finalEmail && (
              <Box sx={{ mb: 4, animation: 'fadeIn 0.3s ease-in-out' }}>
                <EmailPreview
                  email={finalEmail}
                  onCopy={() => setEmailCopied(true)}
                  onDownload={() => setEmailDownloaded(true)}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/troubleshooting-results', {
                  state: { analysis, ticket, analysisJudge }
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
                disabled={!finalEmail}
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

export default EmailResultsPage;
