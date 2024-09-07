import React from 'react';
import Navbar from '../components/Navbar';
import { Box, CssBaseline } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import ROUTES from '../../config/routes';
const Home=() => {
  const {pathname} = useLocation();
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <Navbar />
      <Link style={{height:80}} to={ROUTES.CASINOS}>
      {pathname}
      </Link>
    </Box>
  );
};

export default Home;