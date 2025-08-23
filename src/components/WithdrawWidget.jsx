import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Stack,
  Card,
  TextField,
  InputAdornment
} from '@mui/material';
import { AccountBalance as BalanceIcon } from '@mui/icons-material';

const WithdrawWidget = ({ 
  currentUser, 
  onWithdraw, 
  amount, 
  setAmount, 
  styles,
  disabled = false 
}) => {
  // Try to find the balance from different possible field names
  const balance = currentUser?.total_reward || currentUser?.reward || currentUser?.balance || 0;
  
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
                Available Balance
              </Typography>
            </Stack>
            <Typography variant="h5" color="rgba(255, 255, 255, 0.5)" fontWeight="700">
              $0.00
            </Typography>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.5)" sx={{ mt: 1 }}>
              No balance available for withdrawal
            </Typography>
          </Box>
        </Stack>
      </Card>
    );
  }

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
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <BalanceIcon sx={{ color: "#4caf50" }} />
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              Available Balance
            </Typography>
          </Stack>
          <Typography variant="h5" color="#4caf50" fontWeight="700">
            ${balance?.toLocaleString() || '0'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
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
              flex: 1, 
              minWidth: 0, 
              "& .MuiOutlinedInput-root fieldset": {borderColor: "rgba(76, 175, 80, 0.5)"}, 
              "& .MuiOutlinedInput-root:hover fieldset": {borderColor: "rgba(76, 175, 80, 0.7)"}, 
              "& .MuiOutlinedInput-root.Mui-focused fieldset": {borderColor: "#4caf50"}
            }}
            disabled={disabled}
          />
           
          <Button 
            variant="contained" 
            onClick={() => onWithdraw(balance)}
            disabled={disabled || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
            sx={{
              ...styles.button, 
              background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)", 
              "&:hover": {
                background: "linear-gradient(135deg, #45a049 0%, #4caf50 100%)", 
                transform: "translateY(-1px)", 
                boxShadow: "0 8px 16px rgba(76, 175, 80, 0.4)"
              }
            }}
          >
            Withdraw
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

export default WithdrawWidget;
