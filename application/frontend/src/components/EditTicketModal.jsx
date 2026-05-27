import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

function EditTicketModal({ ticket, onSave, open, onClose }) {
  const [editedTicket, setEditedTicket] = useState(ticket);

  const handleSave = () => {
    if (editedTicket.trim()) {
      onSave(editedTicket);
      onClose();
    }
  };

  const handleReset = () => {
    setEditedTicket(ticket);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.2rem' }}>
        Edit Support Ticket
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
          Modify your support ticket and continue with the analysis:
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={8}
          value={editedTicket}
          onChange={(e) => setEditedTicket(e.target.value)}
          variant="outlined"
          placeholder="Describe your support issue..."
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: 'inherit'
            }
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={() => {
            handleReset();
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!editedTicket.trim()}
        >
          Save & Reanalyze
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditTicketModal;
