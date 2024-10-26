import React from 'react';
import Navbar from '../components/Navbar.jsx';
import { Box, CssBaseline } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import {ROUTES} from '../../utils/routes';
const Home=() => {
  const {pathname} = useLocation();
  return (
    <Box sx={{ display: 'flex', height: '100vh',m:10 }}>
      <CssBaseline />
      <Navbar />
      <Link style={{height:80}} to={ROUTES.CASINOS_PAGE}>
      GO TO CASINOS
      </Link>
    </Box>
  );
};

export default Home;