import React, { useContext, useLayoutEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import ROUTES from '../../config/routes';
import { CssBaseline, Box} from '@mui/material';

const Casinos = () => {
  const {pathname} = useLocation();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
    <Navbar />
    <h1>CASINOS
    {pathname}
    </h1>

  </Box>
  );
};

export default Casinos;