import React from 'react';
import { FaDiscord } from 'react-icons/fa';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import AdbIcon from '@mui/icons-material/Adb';
import Typography from '@mui/material/Typography';
import axios from 'axios';


const drawerWidth = 240;
const appBarHeight = 64;


const AppBar = styled(MuiAppBar)(({ theme }) => ({
  backgroundColor: '#333',
  zIndex: theme.zIndex.drawer + 1,
  height: `${appBarHeight}px`,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));


const loginUrl ='http://192.168.3.105:2000/auth/discord/login'
const handleLoginClick = () => {
  discorlogin();
  window.location.href = loginUrl;
};

const discorlogin = () => {
  axios.get('http://192.168.3.105:2000/redirect')
    .then((res) => console.log(res.data))
    .catch((error) => console.error(error));
};

const Topbar = () => {
  
  return (  
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
        <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            RankersRoyale
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 'auto' }}>
            <a
              href="#"
              style={styles.loginButton}
              onClick={(e) => {
                e.preventDefault(); 
                handleLoginClick(); 
              }}
            >
              <FaDiscord style={styles.icon} />
              Login
            </a>
          </Box>

        </Toolbar>      
      </AppBar>

    </Box>
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
};

export default Topbar;
