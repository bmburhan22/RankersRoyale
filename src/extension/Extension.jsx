import React, { useEffect, useState } from 'react';
import { AppBar, Link, Box, Button, Container, IconButton, Paper, Slide, Toolbar, Typography } from '@mui/material';

import { Menu } from '@mui/icons-material';
import { useAuth } from '../utils/auth';
import Ranking from './Ranking';
import Reward from './Reward';
import { ROUTES } from '../../utils/routes';

const casinoIds = ['500casino', 'razed'];

const Extension = () => {
  const [leaderBoard, setLeaderboard] = useState([]);
  const { post, get, logout, isAuth, nickname, globalName, username, discriminator, displayAvatarURL,
    casinoUserIds
    , userId
  } = useAuth();
  console.log({ userId });

  const getLeadboard = async () => setLeaderboard(
    (await get(ROUTES.CASINOS))?.data,
  )

  const casinoUsers = Object.values(casinoUserIds??{}).map(({ casino_id }) =>
    leaderBoard?.casinos?.[casino_id]?.leaderboard?.find(cu => cu?.user_id == userId));
  const totalCasinosUser = leaderBoard?.total?.leaderboard?.find(cu => cu?.user_id == userId);


  useEffect(() => {
    getLeadboard();
  }, []);

  return (
    <Container sx={{ bgcolor: 'green', height: 600, width: 800 }} disableGutters maxWidth={false}>
      {!isAuth ? <Button variant='contained' href={API_URL + ROUTES.LOGIN}>Login</Button>
        : <Box sx={{ display: 'flex', flexDirection: 'column', height: 1, width: 1, alignItems: 'center', overflow: 'auto', bgcolor: 'tomato' }} >
          <Typography>{nickname} | {globalName} - {username}{discriminator == '0' ? '' : '#' + discriminator}</Typography>
          <img src={displayAvatarURL} width={100} />
          <Button variant='contained' onClick={logout}>Logout</Button>

          <Ranking casinoUser={totalCasinosUser} />

          <Box sx={{ width: 1, height: 1, py: 1, }}>
            {casinoUsers.map((cu, i) =>
              <Ranking key={i} casinoUser={cu} />
            )}
          </Box>
          <Box sx={{ width: 1, height: 1, py: 1, }}>
            {casinoUsers.map((cu, i) =>
              <Reward key={i} casinoUser={cu} />
            )}
          </Box>
        </Box>
      } </Container>
  );
};

export default Extension;