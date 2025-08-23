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
  isTotal = false
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
            Current Casino User ID
          </Typography>
          <Typography variant="h6" color="white" fontWeight="600">
            {currentUser?.casino_user_id || 'Not Set'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Enter Casino User ID"
            value={inputValue}
            onChange={onInputChange}
            sx={{
              ...styles.input, 
              flex: 1, 
              minWidth: 0
            }}
            disabled={disabled}
          />
           
          <Button 
            variant="contained" 
            onClick={onUpdate}
            sx={styles.button}
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
