import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Box, CssBaseline, TextField } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import ROUTES from '../../utils/routes';
import { useAuth } from '../utils/auth';
import { Button } from 'react-bootstrap';
const AdminHome = () => {
  const { isAdmin ,get,post} = useAuth();
  const [wagerPerPoint, setWagerPerPoint] = useState('1');
  const setSettings=async(settingsObj)=>{
    return await post(ROUTES.SETTINGS, settingsObj); }
  return (
    <> <CssBaseline />
      <TextField type='number' value={wagerPerPoint} onChange={({ target: { value } }) => setWagerPerPoint(value)} label='Wager Per Point' />
<Button onClick={()=>setSettings({wagerPerPoint})}/>
    </>
  );
};

export default AdminHome;