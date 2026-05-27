import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';

import ProgressTracker from '../components/ProgressTracker';
import LoadingButton from '../components/LoadingButton';
import StatusBadge from '../components/StatusBadge';
import ScoreCard from '../components/ScoreCard';
import FeedbackAccordion from '../components/FeedbackAccordion';
import SnackbarAlert from '../components/SnackbarAlert';
import LoadingOverlay from '../components/LoadingOverlay';
import SkeletonLoader from '../components/SkeletonLoader';
import EditTicketModal from '../components/EditTicketModal';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EditIcon from '@mui/icons-material/Edit';

function QualityJudgePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, ticket, analysisJudge, guidance, finalEmail } = location.state || {};

  const [judgeResult, setJudgeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(ticket);

  React.useEffect(() => {
    if (!analysis || !finalEmail) {
      navigate('/');
    }
  }, [analysis, finalEmail, navigate]);

  const handleJudgeQuality = async () => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/judge', {
        ticket: currentTicket,
        analysis,
        guidance,
        finalEmail
      });
      setJudgeResult(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to judge response quality.';
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTicket = (editedTicket) => {
    setCurrentTicket(editedTicket);
    setJudgeResult(null);
    handleJudgeQuality();
  };

  if (!analysis || !finalEmail) {
    return null;
  }

  return (
    <>
      <LoadingOverlay loading={loading} message="Evaluating response quality..." />
      <SnackbarAlert
        open={showError}
        message={error}
        severity="error"
        onClose={() => setShowError(false)}
      />

      <Box sx={{ minHeight: '100vh', background: '#F8FAFC', py: 4 }}>
        <Container maxWidth="lg">
          <ProgressTracker currentStep={3} showNavigation={false} />

          <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Quality Review
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Comprehensive evaluation of the generated response
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

            {!judgeResult && (
              <Box sx={{ mb: 4 }}>
                <LoadingButton
                  loading={loading}
                  disabled={loading}
                  onClick={handleJudgeQuality}
                  variant="contained"
                  color="primary"
                  sx={{ mb: 3 }}
                >
                  Evaluate Quality
                </LoadingButton>
                {loading && <SkeletonLoader count={4} />}
              </Box>
            )}

            {judgeResult && (
              <>
                <Card
                  sx={{
                    background: judgeResult.is_approved
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
                      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                    border: `2px solid ${judgeResult.is_approved ? '#10B981' : '#EF4444'}`,
                    mb: 4,
                    animation: 'fadeIn 0.3s ease-in-out'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          Overall Status
                        </Typography>
                        <StatusBadge approved={judgeResult.is_approved} variant="filled" />
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Overall Score
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            color: judgeResult.overall_score >= 7 ? '#10B981' : '#F59E0B',
                            mt: 0.5
                          }}
                        >
                          {judgeResult.overall_score}/10
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Detailed Scores
                </Typography>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <ScoreCard
                      title="Quality"
                      score={judgeResult.quality_score}
                      icon={EmojiEventsIcon}
                      index={0}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <ScoreCard
                      title="Correctness"
                      score={judgeResult.correctness_score}
                      icon={VerifiedIcon}
                      index={1}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <ScoreCard
                      title="Relevance"
                      score={judgeResult.relevance_score}
                      icon={CheckCircleIcon}
                      index={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <ScoreCard
                      title="Friendliness"
                      score={judgeResult.overall_score}
                      icon={TrendingUpIcon}
                      index={3}
                    />
                  </Grid>
                </Grid>

                <Card
                  sx={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    mb: 4
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Validator Feedback
                    </Typography>
                    <FeedbackAccordion
                      title="Quality Assessment"
                      feedback={judgeResult.feedback}
                      severity={judgeResult.is_approved ? 'success' : 'warning'}
                      index={0}
                    />
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Process Summary
                    </Typography>
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 600 }}>Response Generation Process</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              ✓ Step 1: Analysis
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Ticket analyzed and categorized: {analysis.category}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              ✓ Step 2: Troubleshooting
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Guidance generated for {analysis.urgency} urgency ticket
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              ✓ Step 3: Email Drafting
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Professional customer response generated
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              ✓ Step 4: Quality Verification
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Response validated and scored
                            </Typography>
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/email-results', {
                  state: { analysis, ticket, analysisJudge, guidance }
                })}
              >
                Previous
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => navigate('/')}
              >
                Complete & Start Over
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}

export default QualityJudgePage;
