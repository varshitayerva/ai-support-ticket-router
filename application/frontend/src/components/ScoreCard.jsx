import React from 'react';
import { Card, CardContent, Box, Typography, LinearProgress, Tooltip } from '@mui/material';

const getColorForScore = (score) => {
  if (score >= 8) return '#4ade80';
  if (score >= 6) return '#facc15';
  return '#ef4444';
};

function ScoreCard({
  title,
  score,
  maxScore = 10,
  description = '',
  index = 0,
  icon: Icon
}) {
  const percentage = (score / maxScore) * 100;
  const color = getColorForScore(score);

  return (
    <Card
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        animation: `fadeIn 0.3s ease-in-out ${index * 0.1}s`,
        '&:hover': {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {Icon && (
          <Box sx={{ fontSize: '2.5rem' }}>
            <Icon sx={{ fontSize: 'inherit', color }} />
          </Box>
        )}
        <Tooltip title={description || title}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Tooltip>

        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}
          >
            <Typography
              sx={{
                fontSize: '2rem',
                fontWeight: 700,
                color,
                animation: 'fadeIn 0.5s ease-in-out 0.2s'
              }}
            >
              {score}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: color
              }
            }}
          />
          <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
            {percentage.toFixed(0)}%
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ScoreCard;
