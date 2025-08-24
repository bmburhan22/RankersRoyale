import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Avatar, 
  Container,
  Stack
} from '@mui/material';
import { 
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../utils/auth';
import { ROUTES } from '../../utils/routes';
import CasinoBase from '../components/CasinoBase';
import { CASINO_DETAILS } from '../config/constants';

const Extension = () => {
  const [leaderBoard, setLeaderboard] = useState([]);
  const { 
    get, 
    logout, 
    isAuth, 
    nickname, 
    globalName, 
    username, 
    discriminator, 
    displayAvatarURL
  } = useAuth();

  const getLeadboard = async () => {
    try {
      const response = await get(ROUTES.CASINOS);
      if (response?.data) {
        setLeaderboard(response.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };



  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  useEffect(() => {
    if (isAuth) {
      getLeadboard();
    }
  }, [isAuth]);

  // Don't render until auth is initialized
  if (isAuth === null) {
    return null;
  }

  if (!isAuth) {
    return (
      <Container sx={{ bgcolor: '#0f1419', height: 600, width: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }} disableGutters maxWidth={false}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
            Rankers Royale Extension
          </Typography>
          <Box
            component="a"
            href={DISCORD_OAUTH2_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'inline-block',
              background: 'linear-gradient(45deg, #7289da, #5865f2)',
              color: 'white',
              borderRadius: '25px',
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(114, 137, 218, 0.4)',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': {
                background: 'linear-gradient(45deg, #5865f2, #7289da)',
                boxShadow: '0 6px 20px rgba(114, 137, 218, 0.6)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Login with Discord
          </Box>
        </Box>
      </Container>
    );
  }



  return (
    <Container maxWidth={false} disableGutters sx={{ bgcolor: '#0f1419', height: 600, width: 800 }}>
      <Box sx={{ 
        py: 2, 
        px: 2, 
        background: "rgba(15, 20, 25, 0.95)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        color: "white",
        overflow: "auto",
        scrollbarWidth: 'none'
      }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            <Typography variant="h4" fontWeight="700" sx={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #007bff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Rankers Royale Extension
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                background: 'linear-gradient(45deg, #ff6b6b, #ff5252)',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: '12px',
                fontWeight: '600',
                '&:hover': {
                  background: 'linear-gradient(45deg, #ff5252, #ff6b6b)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 16px #ff6b6b40',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Logout
            </Button>
          </Stack>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={displayAvatarURL} alt="Profile" sx={{ width: 48, height: 48 }} />
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {nickname || globalName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {username}{discriminator === '0' ? '' : '#' + discriminator}
              </Typography>
            </Box>
          </Box>
                 </Box>



                  {/* Total Leaderboard */}
         {leaderBoard?.total && (
           <Box sx={{ mb: 6 }}>
             <CasinoBase
               focused={true}
               casinoId="total"
               showTop3={false}
               showLeaderboard={false}
               showUserInput={false}
               showWithdraw={false}
             />
           </Box>
         )}

                                   {/* Individual Casinos */}
          {CASINO_DETAILS.map((casino) => {
            const casinoData = leaderBoard?.casinos?.[casino.id];
            
            if (!casinoData) return null;
            
            return (
              <Box key={casino.id} sx={{ mb: 6 }}>
                <CasinoBase
                  focused={true}
                  casinoId={casino.id}
                  showTop3={false}
                  showLeaderboard={false}
                  showUserInput={true}
                  showWithdraw={true}
                />
              </Box>
            );
          })}
      </Box>
    </Container>
  );
};

export default Extension;