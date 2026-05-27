import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip
} from '@mui/material';

import ProgressTracker from '../components/ProgressTracker';
import LoadingButton from '../components/LoadingButton';
import SnackbarAlert from '../components/SnackbarAlert';
import ScoreCard from '../components/ScoreCard';
import FeedbackAccordion from '../components/FeedbackAccordion';
import LoadingOverlay from '../components/LoadingOverlay';
import EditTicketModal from '../components/EditTicketModal';
import FeedbackIcon from '@mui/icons-material/Feedback';
import AssignmentIcon from '@mui/icons-material/Assignment';
import StarIcon from '@mui/icons-material/Star';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';

function AnalysisResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, ticket } = location.state || {};

  const [analysisJudge, setAnalysisJudge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(ticket);

  React.useEffect(() => {
    if (!analysis) {
      navigate('/');
    }
  }, [analysis, navigate]);

  const handleValidateAnalysis = async () => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/judge-analysis', {
        ticket,
        analysis
      });
      setAnalysisJudge(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to validate analysis.';
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (analysisJudge?.is_correct) {
      navigate('/troubleshooting-results', {
        state: { analysis, ticket: currentTicket, analysisJudge }
      });
    }
  };

  const handleEditTicket = (editedTicket) => {
    setCurrentTicket(editedTicket);
    setAnalysisJudge(null);
    setLoading(true);

    axios.post('http://localhost:8000/api/analyze', { ticket: editedTicket })
      .then((response) => {
        const newAnalysis = response.data;
        navigate('/analysis-results', {
          state: { analysis: newAnalysis, ticket: editedTicket }
        });
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.detail || 'Failed to reanalyze ticket.';
        setError(errorMessage);
        setShowError(true);
        setLoading(false);
      });
  };

  if (!analysis) {
    return null;
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <>
      <LoadingOverlay loading={loading} message="Validating analysis..." />
      <SnackbarAlert
        open={showError}
        message={error}
        severity="error"
        onClose={() => setShowError(false)}
      />

      <Box sx={{ minHeight: '100vh', background: '#FAFBFC', py: 6 }}>
        <Container maxWidth="lg">
          <ProgressTracker currentStep={0} showNavigation={false} />

          <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#0F172A' }}>
                  Ticket Analysis
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B', fontSize: '1.1rem', fontWeight: 400 }}>
                  Review the AI analysis of your support ticket below
                </Typography>
              </Box>
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditModalOpen(true)}
                variant="outlined"
                sx={{ mt: 1 }}
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

            <Card
              sx={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                mb: 4,
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #CBD5E1'
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 4, color: '#0F172A', fontSize: '1.1rem' }}>
                  Analysis Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Category
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
                        {analysis.category}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Urgency Level
                      </Typography>
                      <Box sx={{ mt: 1.5 }}>
                        <Chip
                          label={analysis.urgency}
                          color={getUrgencyColor(analysis.urgency)}
                          variant="filled"
                          sx={{ fontWeight: 700, fontSize: '0.9rem', height: 32 }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Sentiment
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
                        {analysis.sentiment}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Status
                      </Typography>
                      <Box sx={{ mt: 1.5 }}>
                        <Chip
                          label="Relevant"
                          color="success"
                          sx={{ fontWeight: 700, fontSize: '0.9rem', height: 32, background: '#DCFCE7', color: '#166534' }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#0F172A', fontSize: '0.95rem' }}>
                    Ticket Summary
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '0.95rem', fontWeight: 400 }}>
                    {ticket}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {analysisJudge && (
              <Card
                sx={{
                  background: analysisJudge.is_correct ? '#F0FDF4' : '#FEF2F2',
                  border: `2px solid ${analysisJudge.is_correct ? '#86EFAC' : '#FECACA'}`,
                  mb: 6,
                  animation: 'fadeIn 0.3s ease-in-out',
                  borderRadius: '12px',
                  boxShadow: analysisJudge.is_correct
                    ? '0 1px 3px rgba(22, 163, 74, 0.1)'
                    : '0 1px 3px rgba(220, 38, 38, 0.1)'
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                    <StarIcon sx={{ color: analysisJudge.is_correct ? '#16A34A' : '#DC2626', fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: analysisJudge.is_correct ? '#166534' : '#7F1D1D', fontSize: '1.1rem' }}>
                      {analysisJudge.is_correct ? '✓ Analysis Valid' : '✗ Analysis Invalid'}
                    </Typography>
                  </Box>

                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6}>
                      <ScoreCard
                        title="Confidence"
                        score={(analysisJudge.confidence * 100).toFixed(0)}
                        maxScore={100}
                        index={0}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#0F172A', fontSize: '0.95rem' }}>
                    Validation Feedback
                  </Typography>
                  <FeedbackAccordion
                    title="Analysis Details"
                    feedback={analysisJudge.feedback}
                    severity={analysisJudge.is_correct ? 'success' : 'error'}
                  />
                </CardContent>
              </Card>
            )}

          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 6, mb: 4, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{ minWidth: 150 }}
            >
              Start Over
            </Button>
            <LoadingButton
              loading={loading}
              disabled={analysisJudge !== null}
              onClick={handleValidateAnalysis}
              variant="contained"
              endIcon={<AssignmentIcon />}
              sx={{ minWidth: 150 }}
            >
              Validate Analysis
            </LoadingButton>
            <Button
              variant="contained"
              disabled={!analysisJudge?.is_correct}
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: analysisJudge?.is_correct ? 'primary.main' : 'action.disabled',
                color: analysisJudge?.is_correct ? 'white' : 'text.disabled',
                minWidth: 150
              }}
            >
              Next
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
}

export default AnalysisResultsPage;
