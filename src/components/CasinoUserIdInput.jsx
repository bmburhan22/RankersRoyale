import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Stack,
  Card,
  TextField
} from '@mui/material';

const CasinoUserIdInput = ({ 
  currentUser, 
  onUpdate, 
  inputValue,
  onInputChange, 
  styles,
  disabled = false,
  isTotal = false,
  casinoName = 'Casino'
}) => {
  // Don't render anything for total leaderboard
  if (isTotal) {
    return null;
  }

  return (
    <Card sx={{
      ...styles.card, 
      flex: { lg: 1 }, 
      minWidth: { lg: 0 }
    }}>
      <Stack direction="column" spacing={2}>
        <Box>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" mb={1}>
            Current {casinoName} ID
          </Typography>
          <Typography variant="h6" color="white" fontWeight="600">
            {currentUser?.casino_user_id || 'Not Set'}
          </Typography>
          {!currentUser && (
            <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mt: 1, fontStyle: 'italic' }}>
              You don't appear in this casino's leaderboard yet. Set your casino user ID to get started.
            </Typography>
          )}
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="center" sx={{ flexWrap: 'wrap' }}>
          <TextField
            placeholder={`Enter ${casinoName} ID`}
            value={inputValue}
            onChange={onInputChange}
            sx={{
              ...styles.input, 
              flex: { xs: 'none', sm: 1 }, 
              minWidth: { xs: '100%', sm: 250 },
              maxWidth: { xs: '100%', sm: 'none' }
            }}
            disabled={disabled}
          />
           
          <Button 
            variant="contained" 
            onClick={onUpdate}
            sx={{
              ...styles.button,
              minWidth: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: '100%', sm: 'none' },
              flexShrink: 0
            }}
            disabled={disabled}
          >
            Update ID
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

export default CasinoUserIdInput;
