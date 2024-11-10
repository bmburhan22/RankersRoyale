import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import {Button,   Paper, Typography, Box,  } from '@mui/material';

import { green, grey, teal } from '@mui/material/colors';

const bg = {
  '500casino': teal[400],
  'razed': grey[400],
  null: green[400],

}

const casinoIds = ['500casino', 'razed'];
const Ranking = ({ casinoUser }) => {
  const {wager, casino_id, rank} = casinoUser??{};
  return (
    <Paper elevation={24} sx={{
      scrollbarWidth: 'none', overflow: 'auto', bgcolor: bg[casino_id],
      alignContent: 'center', justifyItems: 'center',
    }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: { xs: 'column', xl: 'column' } }}>
  
        <Typography >{casino_id || 'Global'} {rank}</Typography>
        <Typography > {wager}</Typography>
      </Box>
    </Paper>

  );
};

export default Ranking;