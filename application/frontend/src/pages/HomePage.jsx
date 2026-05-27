import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Box, TextField, Typography, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

function HomePage() {
  const [ticket, setTicket] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const relevanceResponse = await axios.post('http://localhost:8000/api/judge-relevance', { ticket });

      if (!relevanceResponse.data.is_relevant) {
        alert(`Not a Support Issue: ${relevanceResponse.data.feedback}`);
        setLoading(false);
        return;
      }

      const analysisResponse = await axios.post('http://localhost:8000/api/analyze', { ticket });
      navigate('/analysis-results', { state: { analysis: analysisResponse.data, ticket } });
    } catch (err) {
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', pt: 8, pb: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6, color: 'white' }}>
          <Typography variant="h1" sx={{ mb: 2, fontWeight: 700 }}>
            AI Support Ticket Router
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400 }}>
            Intelligent ticket analysis and quality assurance
          </Typography>
        </Box>

        <Box sx={{ p: 4, background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            Enter Support Ticket
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              placeholder="Describe your support issue..."
              disabled={loading}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                disabled={!ticket.trim() || loading}
                variant="contained"
                color="primary"
                endIcon={<SendIcon />}
              >
                {loading ? 'Analyzing...' : 'Analyze Ticket'}
              </Button>
            </Box>
          </form>
        </Box>
      </Container>
    </Box>
  );
}

export default HomePage;
