import React, { useState } from 'react';
import { Card, CardContent, CardHeader, Collapse, IconButton, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { styled } from '@mui/material/styles';

const ExpandMoreIconStyled = styled(IconButton)(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

function StepCard({
  step,
  title,
  description,
  index,
  expandable = false,
  onCopy
}) {
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    const text = `${title}\n${description}`;
    navigator.clipboard.writeText(text);
    if (onCopy) onCopy();
  };

  return (
    <Card
      sx={{
        mb: 2,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardHeader
        avatar={
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700
            }}
          >
            {index + 1}
          </Box>
        }
        title={<Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={handleCopy} title="Copy to clipboard">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            {expandable && (
              <ExpandMoreIconStyled
                expand={expanded}
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
              >
                <ExpandMoreIcon />
              </ExpandMoreIconStyled>
            )}
          </Box>
        }
      />
      {description && !expandable && (
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      )}
      {expandable && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </CardContent>
        </Collapse>
      )}
    </Card>
  );
}

export default StepCard;
