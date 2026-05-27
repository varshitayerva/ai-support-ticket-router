import React, { useState } from 'react';
import { Card, CardContent, Box, Typography, Button, TextField, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { parseEmail } from '../utils/markdownCleaner';

function EmailPreview({ email, onCopy, onDownload }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState(email);
  const { subject, body } = parseEmail(email);

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    if (onCopy) onCopy();
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([editedEmail], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `email_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    if (onDownload) onDownload();
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Email Preview
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              variant={isEditing ? 'contained' : 'outlined'}
              size="small"
            >
              {isEditing ? 'Save' : 'Edit'}
            </Button>
            <Button
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
              variant="outlined"
              size="small"
            >
              Copy
            </Button>
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={handleDownload}
              variant="outlined"
              size="small"
            >
              Download
            </Button>
          </Box>
        </Box>

        {isEditing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Subject"
              fullWidth
              value={editedEmail.split('\n')[0]}
              onChange={(e) => setEditedEmail(e.target.value)}
              variant="outlined"
              size="small"
            />
            <TextField
              label="Body"
              fullWidth
              multiline
              rows={12}
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              variant="outlined"
            />
          </Box>
        ) : (
          <Box
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              p: 3,
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.05)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              lineHeight: 1.6
            }}
          >
            {editedEmail}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default EmailPreview;
