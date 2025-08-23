import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Stack,
  Card,
  TextField,
  InputAdornment,
  Chip,
  Alert
} from '@mui/material';
import { AccountBalance as BalanceIcon } from '@mui/icons-material';

const WithdrawWidget = ({ 
  currentUser, 
  onWithdraw, 
  amount, 
  setAmount, 
  styles,
  disabled = false,
  casinoId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Try to find the balance from different possible field names
  const balance = currentUser?.total_reward || currentUser?.reward || currentUser?.balance || 0;

  const handleWithdrawRequest = async () => {
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance) return;
    
    setIsSubmitting(true);
    try {
      await onWithdraw(parseFloat(amount));
      // Show success message
      setShowSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
      setAmount(0);
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setIsSubmitting(false);
    }
  };



  // Show no balance message
  if (!balance || balance <= 0) {
    return (
      <Card sx={{
        ...styles.card, 
        background: "rgba(128, 128, 128, 0.05)", 
        border: "1px solid rgba(128, 128, 128, 0.3)", 
        flex: { lg: 1 }, 
        minWidth: { lg: 0 }
      }}>
        <Stack direction="column" spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                Available to Claim
              </Typography>
            </Stack>
            <Typography variant="h5" color="rgba(255, 255, 255, 0.5)" fontWeight="700">
              $0.00
            </Typography>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.5)" sx={{ mt: 1 }}>
              {currentUser ? 'No balance available to claim' : 'You don\'t appear in this casino\'s leaderboard yet'}
            </Typography>
            {!currentUser && (
              <Typography variant="body2" color="rgba(255, 255, 255, 0.4)" sx={{ mt: 1, fontStyle: 'italic' }}>
                Set your casino user ID first to start earning rewards.
              </Typography>
            )}
          </Box>
        </Stack>
      </Card>
    );
  }

  // Show withdrawal form
  return (
    <Card sx={{
      ...styles.card, 
      background: "rgba(76, 175, 80, 0.05)", 
      border: "1px solid rgba(76, 175, 80, 0.3)", 
      flex: { lg: 1 }, 
      minWidth: { lg: 0 }
    }}>
      <Stack direction="column" spacing={2}>
        <Box>
                      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <BalanceIcon sx={{ color: "#4caf50" }} />
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                Available to Claim
              </Typography>
            </Stack>
          
          {/* Balance, Input, and Button in one row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="center" sx={{ flexWrap: 'wrap' }}>
            <Box sx={{ flex: { xs: 'none', sm: 1 } }}>
              <Typography variant="h5" color="#4caf50" fontWeight="700">
                ${balance?.toLocaleString() || '0'}
              </Typography>
            </Box>
            
            <TextField
              type="number"
              placeholder="Amount to withdraw"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{
                ...styles.input, 
                flex: { xs: 'none', sm: 1 }, 
                minWidth: { xs: '100%', sm: 250 }, 
                maxWidth: { xs: '100%', sm: 'none' },
                "& .MuiOutlinedInput-root fieldset": {borderColor: "rgba(76, 175, 80, 0.5)"}, 
                "& .MuiOutlinedInput-root:hover fieldset": {borderColor: "rgba(76, 175, 80, 0.7)"}, 
                "& .MuiOutlinedInput-root.Mui-focused fieldset": {borderColor: "#4caf50"}
              }}
              disabled={disabled || isSubmitting}
            />
            
            <Button 
              variant="contained" 
              onClick={handleWithdrawRequest}
              disabled={disabled || isSubmitting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              sx={{
                ...styles.button, 
                background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)", 
                minWidth: { xs: '100%', sm: 'auto' },
                maxWidth: { xs: '100%', sm: 'none' },
                flexShrink: 0,
                "&:hover": {
                  background: "linear-gradient(135deg, #45a049 0%, #4caf50 100%)", 
                  transform: "translateY(-1px)", 
                  boxShadow: "0 8px 16px rgba(76, 175, 80, 0.4)"
                }
              }}
            >
              {isSubmitting ? 'Claiming...' : 'Claim'}
            </Button>
          </Stack>
          
          {/* Success message */}
          {showSuccess && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Alert severity="success" sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.9)">
                  Claim requested!
                </Typography>
              </Alert>
            </Box>
          )}
        </Box>
      </Stack>
    </Card>
  );
};

export default WithdrawWidget;
