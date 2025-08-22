import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/auth.jsx';
import { ROUTES } from '../../utils/routes.js';
import Top3 from '../components/Top3.jsx';

import { 
  Box, 
  Typography, 
  Button, 
  Avatar, 
  Chip, 
  Card, 
  Stack,
  Divider,
  TextField,
  InputAdornment,
  Container
} from '@mui/material';
import { 
  Casino as CasinoIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BalanceIcon
} from '@mui/icons-material';

const casinoIds = [
  { id: '500casino', name: '500 Casino' },
  { id: 'razed', name: 'Razed' }
];

// Reusable styles function
const getStyles = (color) => ({
  mainBox: {
    py: 0, 
    px: 0,
    background: "linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0f1419 100%)",
    display: "block", // Changed from "flex" to "block" for vertical stacking
    position: "relative", 
    overflow: "auto", 
    height: 1,
    width: { xs: '85vw', md: '800px' }, // Mobile: 85vw (leaves space to peek), Desktop: 1200px
    borderRadius: 0,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 123, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    background: "rgba(15, 20, 25, 0.85)", // Restored transparency glass effect
    p: 4, 
    color: "white", 
    mx: "auto",
    scrollbarWidth: 'none'
  },
  headerBox: {
    background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
    borderRadius: "16px", p: 2,
    boxShadow: `0 8px 16px ${color}40`,
  },
  title: {
    background: `linear-gradient(135deg, #ffffff 0%, ${color} 100%)`, 
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
  },
  card: {
    background: "rgba(0, 123, 255, 0.05)",
    border: `1px solid ${color}30`, borderRadius: "16px", p: 3, mb: 4,
    backdropFilter: "blur(10px)",
  },
  button: {
    background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
    color: "white", px: 4, py: 1.5, borderRadius: "12px", fontWeight: "600",
    "&:hover": {
      background: `linear-gradient(135deg, ${color}80 0%, ${color} 100%)`,
      transform: "translateY(-1px)", boxShadow: `0 8px 16px ${color}40`,
    },
    transition: "all 0.2s ease",
  },
  input: {
    minWidth: 250,
    "& .MuiOutlinedInput-root": {
      color: "white",
      "& fieldset": { borderColor: `${color}50` },
      "&:hover fieldset": { borderColor: `${color}70` },
      "&.Mui-focused fieldset": { borderColor: color },
    },
    "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
  },
  leaderboardBox: {
    background: "rgba(0, 123, 255, 0.03)",
    borderRadius: "16px", 
    border: "1px solid rgba(0, 123, 255, 0.1)",
    overflow: "hidden", 
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
    maxWidth: "1000px",
    mx: "auto"
  },
  leaderboardHeader: {
    p: 3, background: "rgba(0, 123, 255, 0.08)"
  },
  leaderboardRow: {
    display: "flex", alignItems: "center", p: 2,
    borderBottom: "1px solid rgba(0, 123, 255, 0.1)",
    "&:hover": { background: "rgba(0, 123, 255, 0.05)" },
    transition: "all 0.2s ease",
  },
  avatar: { width: 40, height: 40, border: "2px solid rgba(255, 255, 255, 0.2)", mr: 2 },
  rank: { width: 60, textAlign: 'center' },
  rankText: { color: color, textShadow: `0 0 8px ${color}40` },
  userInfo: { flex: 1, minWidth: 0 },
  stats: { minWidth: 80, textAlign: 'center' }
});

const Casinos = ({ focused, casinoId }) => {
  const { post, get, casinoUserIds, userId } = useAuth();
  
  const [casinoUser, setCasinoUser] = useState();
  const [casinoData, setCasinoData] = useState();
  const [amount, setAmount] = useState(0);
  const [casinoUserId, setCasinoUserId] = useState();
  
  const { total_reward } = casinoUser ?? {};
  const { leaderboard, allowWithdraw, logo:casinoLogo, color:casinoColor, referralLink } = casinoData ?? {};
  const isTotal = !casinoIds.some(casino => casino.id === casinoId);
  
  // Fallback casinoName to "Total" if not available, or use name from casinoIds list
  const displayName = (casinoId ? casinoIds.find(casino => casino.id === casinoId)?.name : null) || 'Total';
  
  // Default color to white if casinoColor is null/undefined
  const color = casinoColor || '#ffffff';
  
  useEffect(() => {
    setCasinoUser(casinoUserIds?.[casinoId]);
  }, [casinoUserIds]);

  const getLeadboard = async () => setCasinoData(
    await get(ROUTES.CASINOS + (!casinoId ? '' : `?casino_id=${casinoId}`)).then(({ data }) =>
    !casinoId ? data.total : data.casinos[casinoId]
    )
  );

  const updateCasinoUserId = async () => await post(ROUTES.CASINOS, { casino_id: casinoId, casino_user_id: casinoUserId }).catch(alert)
    .then(r => {
      if (!r.data.err) {
        setCasinoUser(r?.data?.user_casino); 
        setCasinoData(r.data?.leaderboard);
      }
    });

  const sendBalance = async () => await post(ROUTES.CLAIM_REWARD, { amount, casinoId }).catch(alert)
    .then(r => { if (r.data.err) { alert(r.data.err); return; } setCasinoUser(cu => ({ ...cu, total_reward: r?.data?.balance })); });

  useEffect(() => {
    getLeadboard();
  }, []);

  useEffect(() => {
    if (focused) getLeadboard();
  }, [focused]);

  // Update styles with current color
  const currentStyles = getStyles(color);

  // Check if user is valid (has casino_user_id)
  const isValidUser = casinoUser && casinoUser.casino_user_id;

  // Check if casino is focused

  return (
    <Container maxWidth={false} disableGutters sx={currentStyles.mainBox}>
      {/* Focus Indicator */}
      {!focused && (
        <>
          {/* Blur effect behind the text */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            zIndex: 1,
          }} />
        </>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
            {/* Name on the left */}
            <Typography variant="h4" fontWeight="700" sx={currentStyles.title}>
              {displayName} Leaderboard
            </Typography>
            
            {/* Logo on the right */}
            <Box sx={currentStyles.headerBox}>
              {casinoLogo?.trim()?.startsWith('<svg') ? (
                <Box dangerouslySetInnerHTML={{ __html: casinoLogo }} className="casino-svg-logo" sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', '& svg': {width: '100%', height: '100%', maxWidth: '100px', maxHeight: '100px', fill: 'currentColor', color: 'white'}}} />
              ) : casinoLogo?.startsWith('http') ? (
                <img src={casinoLogo} alt={`${displayName} logo`} style={{width: 32, height: 32, objectFit: 'contain', filter: 'brightness(0) invert(1)'}} />
              ) : casinoLogo ? (
                React.createElement(casinoLogo, { sx: { fontSize: 32, color: "white" } })
              ) : (
                <CasinoIcon sx={{ fontSize: 32, color: "white" }} />
              )}
            </Box>
          </Stack>
          
          <Divider sx={{ borderColor: `${color}30`, opacity: 0.5 }} />
        </Box>

        {/* Casino User ID Input and Withdraw Balance - Only show for valid users and when focused */}
        {isValidUser && focused && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', lg: 'row' }, 
            gap: 3, 
            mb: 4 
          }}>
            {/* Casino User ID Input */}
            {isTotal ? null : (
              <Card sx={{...currentStyles.card, flex: { lg: 1 }, minWidth: { lg: 0 }}}>
                <Stack direction="column" spacing={2}>
                  <Box>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" mb={1}>
                      Current Casino User ID
                    </Typography>
                    <Typography variant="h6" color="white" fontWeight="600">
                      {casinoUser?.casino_user_id || 'Not Set'}
                    </Typography>
      </Box>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      placeholder="Enter Casino User ID"
                      value={casinoUserId}
                      onChange={(e) => setCasinoUserId(e.target.value)}
                      sx={{...currentStyles.input, flex: 1, minWidth: 0}}
                    />
                     
                    <Button variant="contained" onClick={updateCasinoUserId} sx={currentStyles.button}>
                      Update ID
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            )}

            {/* Withdraw Balance Section */}
            {allowWithdraw && (
              <Card sx={{...currentStyles.card, background: "rgba(76, 175, 80, 0.05)", border: "1px solid rgba(76, 175, 80, 0.3)", flex: { lg: 1 }, minWidth: { lg: 0 }}}>
                <Stack direction="column" spacing={2}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <BalanceIcon sx={{ color: "#4caf50" }} />
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Available Balance
                      </Typography>
                    </Stack>
                    <Typography variant="h5" color="#4caf50" fontWeight="700">
                      ${total_reward?.toLocaleString() || '0'}
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
                      sx={{...currentStyles.input, flex: 1, minWidth: 0, "& .MuiOutlinedInput-root fieldset": {borderColor: "rgba(76, 175, 80, 0.5)"}, "& .MuiOutlinedInput-root:hover fieldset": {borderColor: "rgba(76, 175, 80, 0.7)"}, "& .MuiOutlinedInput-root.Mui-focused fieldset": {borderColor: "#4caf50"}}}
                    />
                     
                    <Button variant="contained" onClick={sendBalance} disabled={!amount || amount <= 0 || amount > total_reward} sx={{...currentStyles.button, background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)", "&:hover": {background: "linear-gradient(135deg, #45a049 0%, #4caf50 100%)", transform: "translateY(-1px)", boxShadow: "0 8px 16px rgba(76, 175, 80, 0.4)"}}}>
                      Withdraw
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            )}
          </Box>
        )}

        {/* Top 3 Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" fontWeight="600" textAlign="center" mb={4} sx={{ color: "rgba(255, 255, 255, 0.9)" }}>
            <TrophyIcon sx={{ mr: 1, color, verticalAlign: 'middle' }} />
            Top Performers
          </Typography>
          
          <Stack direction="row" justifyContent="center" alignItems="flex-end" spacing={3} sx={{ px: { xs: 1, sm: 4, md: 6 } }}>
            {(leaderboard || []).slice(0, 3).map((user, idx) => {
              const isMe = user.user_id === userId;
              const actualRank = user.rank || idx + 1;
              const pedestalHeights = [120, 80, 60];
              const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];
              const order = [1, 0, 2];
              
              return (
                <Box key={user.rank || idx} sx={{display: "flex", flexDirection: "column", alignItems: "center", position: "relative", order: order[idx]}}>
                  <Box sx={{position: "relative", mb: 2}}>
                    <Avatar src={user.displayAvatarURL} sx={{width: 80, height: 80, border: isMe ? `4px solid ${color}` : `4px solid ${colors[actualRank - 1]}`, boxShadow: isMe ? `0 0 30px ${color}60` : `0 0 25px ${colors[actualRank - 1]}80`, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))"}} />
                    {isMe && <StarIcon sx={{position: "absolute", top: -8, right: -8, color, fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"}} />}
      </Box>

                  <Typography variant="h6" color="white" fontWeight="600" textAlign="center" sx={{ mb: 1, maxWidth: 120 }}>
                    {user.discriminator && user.discriminator !== '0' ? `${user.username}#${user.discriminator}` : user.username}
                  </Typography>
                  
                  <Typography variant="h4" fontWeight="700" sx={{color: colors[actualRank - 1], textShadow: `0 0 10px ${colors[actualRank - 1]}40`, mb: 2}}>
                    #{actualRank}
                  </Typography>
                  
                  <Box sx={{width: 80, height: pedestalHeights[actualRank - 1], borderRadius: "12px", background: `linear-gradient(180deg, ${colors[actualRank - 1]} 0%, ${colors[actualRank - 1]}80 100%)`, opacity: 0.8, boxShadow: `0 8px 16px ${colors[actualRank - 1]}40`, position: "relative", "&::before": {content: '""', position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: `linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)`, borderRadius: "12px 12px 0 0"}}}>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* Leaderboard Table */}
        <Box sx={currentStyles.leaderboardBox}>
          <Box sx={currentStyles.leaderboardHeader}>
            <Typography variant="h6" fontWeight="600" color="rgba(255, 255, 255, 0.9)">
              <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Full Leaderboard
            </Typography>
          </Box>
          
          <Box sx={{ 
            maxHeight: 400, 
            overflow: 'auto',
            position: 'relative',
            '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar
            scrollbarWidth: 'none', // Hide scrollbar for Firefox
            msOverflowStyle: 'none', // Hide scrollbar for IE/Edge
          }}>
            {/* Left fade effect */}
            <Box sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '40px',
              background: 'linear-gradient(90deg, rgba(0, 123, 255, 0.03) 0%, transparent 100%)',
          pointerEvents: 'none',
              zIndex: 1,
            }} />
            
            {/* Right fade effect */}
            <Box sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '40px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(0, 123, 255, 0.03) 100%)',
              pointerEvents: 'none',
              zIndex: 1,
            }} />
            
            <Box sx={{ minWidth: { xs: 600, sm: 'auto' } }}>
              {(leaderboard || []).slice(3, 23).map((user, index) => {
                const isCurrentUser = user.user_id === userId;
                const displayName = user.discriminator && user.discriminator !== '0' ? `${user.username}#${user.discriminator}` : user.username;
                
                return (
                  <Box key={user.rank || index + 3} sx={{...currentStyles.leaderboardRow, background: isCurrentUser ? "rgba(0, 123, 255, 0.1)" : "transparent", "&:hover": {background: isCurrentUser ? "rgba(0, 123, 255, 0.15)" : "rgba(0, 123, 255, 0.05)"}}}>
                    <Box sx={{...currentStyles.rank, minWidth: 60, flexShrink: 0}}>
                      <Typography variant="h6" fontWeight="700" sx={currentStyles.rankText}>
                        #{user.rank || index + 4}
                      </Typography>
                    </Box>
                    
                    <Avatar src={user.displayAvatarURL} sx={{...currentStyles.avatar, flexShrink: 0}} />
                    
                    <Box sx={{...currentStyles.userInfo, minWidth: 120, flexShrink: 0}}>
                      <Typography variant="subtitle1" color="white" fontWeight="500" noWrap>
                        {displayName}
                        {isCurrentUser && (
                          <Chip label="You" size="small" sx={{...currentStyles.button, fontSize: "0.75rem", height: 20, ml: 1, flexShrink: 0}} />
                        )}
                      </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={2} sx={{ minWidth: 0, flexShrink: 0 }}>
                      {isTotal ? null : (
                        <Box sx={{...currentStyles.stats, minWidth: 80, flexShrink: 0}}>
                          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">Casino ID</Typography>
                          <Typography variant="body2" color="white" fontWeight="500">{user.casino_user_id || '-'}</Typography>
                        </Box>
                      )}
                      
                      <Box sx={{...currentStyles.stats, minWidth: 80, flexShrink: 0}}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">Revenue</Typography>
                        <Typography variant="body2" color="white" fontWeight="500">${user.revenue?.toLocaleString() || '0'}</Typography>
                      </Box>
                      
                      <Box sx={{...currentStyles.stats, minWidth: 80, flexShrink: 0}}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">Wager</Typography>
                        <Typography variant="body2" color="white" fontWeight="500">${user.wager?.toLocaleString() || '0'}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Container>
  );
};

export default Casinos;