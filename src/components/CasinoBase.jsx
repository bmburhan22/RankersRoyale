import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../utils/auth.jsx';
import { ROUTES } from '../../utils/routes.js';

import { 
  Box, 
  Typography, 
  Button, 
  Avatar, 
  Chip, 
  Stack,
  Divider,
  Container
} from '@mui/material';
import { 
  Casino as CasinoIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import WithdrawWidget from './WithdrawWidget';
import CasinoUserIdInput from './CasinoUserIdInput';

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
    display: "block",
    position: "relative", 
    overflow: "auto", 
    height: 1,
    width: { xs: '85vw', md: '800px' },
    borderRadius: 0,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 123, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    background: "rgba(15, 20, 25, 0.85)",
    p: 4, 
    color: "white", 
    mx: "auto",
    scrollbarWidth: 'none'
  },
  headerBox: {
    background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
    borderRadius: "8px", p: 0.5,
    boxShadow: `0 8px 16px ${color}40`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    background: `linear-gradient(135deg, #ffffff 0%, ${color} 100%)`, 
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
    lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 }
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

const CasinoBase = ({ 
  focused, 
  casinoId, 
  showTop3 = true, 
  showLeaderboard = true, 
  showUserInput = true,
  showWithdraw = true
}) => {
  const { post, get, casinoUserIds={}, userId } = useAuth();
  
  const [casinoUser, setCasinoUser] = useState();
  const [casinoData, setCasinoData] = useState();
  const [amount, setAmount] = useState(0);
  const [casinoUserIdInputValue, setCasinoUserIdInputValue] = useState();
  
  // Get total_reward from casinoUser (user input state) and other data from leaderboard
  const { leaderboard, allowWithdraw, logo:casinoLogo, color:casinoColor, referralLink } = casinoData ?? {};
  const isTotal = !casinoId || casinoId === 'total' || !casinoIds.some(casino => casino.id === casinoId);
  
  // Fallback casinoName to "Total" if not available, or use name from casinoIds list
  const casinoName = isTotal ? 'Total' : (casinoIds.find(casino => casino.id === casinoId)?.name || 'Total');
  
  // Default color to white if casinoColor is null/undefined
  const color = casinoColor || '#ffffff';
  
  useEffect(() => {
    setCasinoUser(casinoUserIds?.[casinoId]);
  }, [casinoUserIds]);

  // Find current user in leaderboard data for display purposes (rank, wager, revenue)
  const currentUserInLeaderboard = useMemo(() => {
    if (!userId || !casinoData?.leaderboard) return null;
    return casinoData.leaderboard.find(user => user.user_id === userId);
  }, [userId, casinoData?.leaderboard]);


  const getLeadboard = async () => setCasinoData(
    await get(ROUTES.CASINOS + (!isTotal ? `?casino_id=${casinoId}` : '')).then(({ data }) =>
    !isTotal ? data.casinos[casinoId] : data.total
    )
  );
  const updateCasinoUserId = async () => {
    // Prevent updating casino user ID for total leaderboard
    if (isTotal) {
      alert('Cannot update casino user ID for total leaderboard');
      return;
    }
    
    await post(ROUTES.CASINOS, { casino_id: casinoId, casino_user_id: casinoUserIdInputValue }).catch(alert)
      .then(r => {
        if (!r.data.err) {
          setCasinoUser(r?.data?.user_casino); 
          setCasinoData(r.data?.leaderboard);
        }
      });
  };

  const sendBalance = async (amount) => {
    // Prevent claiming rewards for total leaderboard
    if (isTotal) {
      alert('Cannot claim rewards for total leaderboard');
      return;
    }
    
    try {
      // Claim reward immediately
      const response = await post(ROUTES.CLAIM_REWARD, { 
        amount, 
        casino_id: casinoId,
        user_id: userId
      });
      
      if (response.data.err) {
        alert(response.data.err);
        return;
      }
      
      // Show success message
      alert('Reward claimed successfully!');
      
      // Refresh data to show updated balance
      getLeadboard();
    } catch (error) {
      alert('Error claiming reward: ' + error.message);
    }
  };

  useEffect(() => {
    getLeadboard();
  }, []);

  useEffect(() => {
    if (focused) getLeadboard();
  }, [focused]);

  // Update styles with current color
  const currentStyles = getStyles(color);

  // Check if user is valid (has casino_user_id for individual casinos, or just exists for total)
  const isValidUser = (casinoUser || currentUserInLeaderboard) && (isTotal || casinoUser?.casino_user_id);
  
  // Check if this is a valid casino (not total) - show user input and withdrawal for all valid casinos
  const isValidCasino = !isTotal;


  
  return (
    <Container maxWidth={false} disableGutters sx={currentStyles.mainBox}>


      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          {/* Name on the left */}
          <Typography variant="h4" fontWeight="700" sx={currentStyles.title}>
            {casinoName} Leaderboard
          </Typography>
          
          {/* Logo on the right */}
          <Box sx={currentStyles.headerBox}>
            {casinoLogo?.trim()?.startsWith('<svg') ? (
              <Box dangerouslySetInnerHTML={{ __html: casinoLogo }} className="casino-svg-logo" sx={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '100%', 
                height: '100%', 
                '& svg': {
                  width: '100%', 
                  height: '100%', 
                  fill: 'currentColor', 
                  color: 'white'
                }
              }} />
            ) : casinoLogo?.startsWith('http') ? (
              <img src={casinoLogo} alt={`${casinoName} logo`} style={{
                width: '100%', 
                height: '100%', 
                objectFit: 'contain', 
                filter: 'brightness(0) invert(1)'
              }} />
            ) : casinoLogo ? (
              React.createElement(casinoLogo, { sx: { 
                fontSize: { xs: 40, md: 50 }, 
                color: "white" 
              }})
            ) : (
              <CasinoIcon sx={{ 
                fontSize: { xs: 40, md: 50 }, 
                color: "white" 
              }} />
            )}
          </Box>
        </Stack>
        
        <Divider sx={{ borderColor: `${color}30`, opacity: 0.5 }} />
      </Box>

             {/* User Rank Display - Above input fields */}
       {(casinoUser || currentUserInLeaderboard) && focused && (
         <Box sx={{ mb: 4, textAlign: 'center' }}>
           <Typography variant="h3" fontWeight="700" sx={{ 
             color: color, 
             mb: 1,
             fontSize: { xs: '2rem', sm: '3rem', md: '3.75rem' },
             lineHeight: { xs: 1.1, sm: 1.2, md: 1.3 }
           }}>
             {currentUserInLeaderboard?.rank ? `#${currentUserInLeaderboard.rank}` : 'Unranked'}
           </Typography>
           <Typography variant="h5" color="rgba(255, 255, 255, 0.8)" mb={2} sx={{
             fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
             lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 }
           }}>
             Your {isTotal ? 'Total' : casinoName} Rank
           </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap' }}>
               {!isTotal && (
                 <Box sx={{ textAlign: 'center' }}>
                   <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{
                     fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }
                   }}>{casinoName} ID</Typography>
                   <Typography variant="h6" color="white" fontWeight="600" sx={{
                     fontSize: { xs: '1rem', sm: '1.25rem', md: '1.375rem' }
                   }}>
                     {casinoUser?.casino_user_id || 'Not Set'}
                   </Typography>
                 </Box>
               )}
               <Box sx={{ textAlign: 'center' }}>
                 <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{
                   fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }
                 }}>Wager</Typography>
                 <Typography variant="h6" color="white" fontWeight="600" sx={{
                   fontSize: { xs: '1rem', sm: '1.25rem', md: '1.375rem' }
                 }}>
                   ${currentUserInLeaderboard?.wager?.toLocaleString() || '0'}
                 </Typography>
               </Box>
               <Box sx={{ textAlign: 'center' }}>
                 <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{
                   fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }
                 }}>Revenue</Typography>
                 <Typography variant="h6" color="white" fontWeight="600" sx={{
                   fontSize: { xs: '1rem', sm: '1.25rem', md: '1.375rem' }
                 }}>
                   ${currentUserInLeaderboard?.revenue?.toLocaleString() || '0'}
                 </Typography>
               </Box>
             </Box>
         </Box>
       )}

             {/* Casino User ID Input and Withdraw Balance - Only show for valid casinos, when focused, and when user is logged in */}
       {showUserInput && !isTotal && focused && userId && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', lg: 'row' }, 
          gap: 3, 
          mb: 4 
        }}>
          {/* Casino User ID Input */}
          <CasinoUserIdInput
            currentUser={{
              ...currentUserInLeaderboard,
              total_reward: casinoUser?.total_reward,
              casino_user_id: casinoUser?.casino_user_id
            }}
            onUpdate={updateCasinoUserId}
            inputValue={casinoUserIdInputValue}
            onInputChange={(e) => setCasinoUserIdInputValue(e.target.value)}
            styles={currentStyles}
            isTotal={isTotal}
            casinoName={casinoName}
          />

                     {/* Withdraw Balance Section */}
           {showWithdraw && allowWithdraw && (
             <WithdrawWidget
               currentUser={{
                 ...currentUserInLeaderboard,
                 total_reward: casinoUser?.total_reward,
                 casino_user_id: casinoUser?.casino_user_id
               }}
               onWithdraw={sendBalance}
               amount={amount}
               setAmount={setAmount}
               styles={currentStyles}
               casinoId={casinoId}
             />
           )}
        </Box>
      )}

      {/* Top 3 Section */}
      {showTop3 && (
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
                  {/* Pedestal */}
                  <Box sx={{
                    width: 80,
                    height: pedestalHeights[idx],
                    background: `linear-gradient(135deg, ${colors[idx]} 0%, ${colors[idx]}80 100%)`,
                    borderRadius: "8px 8px 0 0",
                    boxShadow: `0 8px 16px ${colors[idx]}40`,
                    position: "relative",
                    mb: 1
                  }}>
                    {/* Rank number on pedestal */}
                    <Typography variant="h4" fontWeight="700" sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      color: "white",
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)"
                    }}>
                      {actualRank}
                    </Typography>
                  </Box>
                  
                  {/* User info */}
                  <Box sx={{ textAlign: "center", minWidth: 100 }}>
                    <Avatar src={user.displayAvatarURL} sx={{...currentStyles.avatar, mx: "auto", mb: 1}} />
                    <Typography variant="body2" color="white" fontWeight="500" noWrap>
                      {user.discriminator && user.discriminator !== '0' ? `${user.username}#${user.discriminator}` : user.username}
                    </Typography>
                    {isMe && (
                      <Chip label="YOU" size="small" sx={{...currentStyles.button, fontSize: "0.75rem", height: 20, mt: 1}} />
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Leaderboard Table */}
      {showLeaderboard && (
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
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
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
              {/* Users starting from rank 4 (after Top 3) */}
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
                          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">{casinoName} ID</Typography>
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
      )}


    </Container>
  );
};

export default CasinoBase;
export { getStyles, casinoIds };
