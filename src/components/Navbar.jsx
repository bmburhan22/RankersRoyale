import React, { useContext } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import AdbIcon from '@mui/icons-material/Adb';
import Typography from '@mui/material/Typography';
import { useAuth } from '../utils/auth';
import {ROUTES}  from '../../utils/routes';
const drawerWidth = 240;
import { APP_BAR_HEIGHT } from '../config/constants';

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  backgroundColor: '#333',
  zIndex: theme.zIndex.drawer + 1,
  height: `${APP_BAR_HEIGHT}px`,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const Navbar= () => {
  const  { isAuth,username, logout, nickname, globalName, discriminator, displayAvatarURL } = useAuth();
  return (

      <AppBar position="fixed">
        <Toolbar>

          <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography variant="h6" noWrap component="a" href="/" sx={{ mr: 2, display: { xs: 'none', md: 'flex' }, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '.3rem', color: 'inherit', textDecoration: 'none', }}>
            RankersRoyale
          </Typography>

          <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 'auto' }}>
            { isAuth ? (


              <div style={{ display: 'flex' }} className='row'>
                <Typography>{nickname} | {globalName} - {username}{discriminator == '0' ? '' : '#' + discriminator}</Typography>
                <FaDiscord style={styles.icon} />
                <img src={displayAvatarURL} alt="Profile" style={styles.profilePhoto} />
                <button onClick={logout} style={styles.loginButton}>Logout</button>
              </div>

            ) : (
              <a href={ROUTES.LOGIN} style={styles.loginButton} >
                <FaDiscord style={styles.icon} />
                Login
              </a>
            )}
          </Box>

        </Toolbar>
      </AppBar>
  );
};

const styles = {
  loginButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#7289da',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  icon: {
    marginRight: '10px',
  },
  profilePhoto: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
  }
};


export default Navbar;
