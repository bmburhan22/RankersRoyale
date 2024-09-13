import React from 'react';
import Navbar from '../components/Navbar';
import { Box, CssBaseline } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import ROUTES from '../../utils/routes';
import { useAuth } from '../utils/auth';
const AdminHome=() => {
  const {pathname} = useLocation();
  const {isAdmin} = useAuth();
  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor:isAdmin==null?'':isAdmin?'#00ff00':'#ff0000' }}>
      <CssBaseline />
      <Link style={{height:80}} to={ROUTES.CASINOS_PAGE}>
      {pathname}
      </Link>
    </Box>
  );
};

export default AdminHome;