import React, { useContext } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import AdbIcon from '@mui/icons-material/Adb';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import { AuthContext } from '../utilities/auth'; 

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

const loginUrl ='http://192.168.3.105:2000/auth/discord/login';

const Topbar = () => {  
  const { isAuthenticated, login } = useContext(AuthContext); 

  const handleLoginClick = () => {
    discorlogin();
  };

  const discorlogin = () => {
    axios.get('http://192.168.3.105:2000/redirect')
      .then((res) => {
        if (res.data.token) {
          // login(res.data.token, res.data.profilePhoto); 
          window.location.href = loginUrl; 
        }
      })
      .catch((error) => console.error(error));
  };

  return (  
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          
          <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography variant="h6" noWrap component="a" href="/" sx={{ mr: 2, display: { xs: 'none', md: 'flex' }, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '.3rem', color: 'inherit', textDecoration: 'none',}}>
            RankersRoyale
          </Typography>
          
          <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 'auto' }}>
            {isAuthenticated ? (
              <img src={localStorage.getItem('avatar')}  alt="Profile" style={styles.profilePhoto}/>
              ) : (
              <a href="#" style={styles.loginButton} onClick={(e) => { e.preventDefault(); handleLoginClick();}}>
                <FaDiscord style={styles.icon} />
                Login
              </a>
             )}
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
  profilePhoto: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
  }
};

export default Topbar;
