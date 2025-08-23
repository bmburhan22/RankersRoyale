import React, { useState, useEffect, useRef } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import Link from '@mui/material/Link';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../utils/auth';
import {ROUTES}  from '../../utils/routes';
import { APP_BAR_HEIGHT } from '../config/constants';

const drawerWidth = 280;

const AppBar = styled(MuiAppBar)(({ theme, open }) => ({
  background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0f1419 100%)',
  zIndex: theme.zIndex.drawer + 1,
  height: `${APP_BAR_HEIGHT}px`,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const Navbar = () => {
  const { isAuth, isAdmin, username, logout, nickname, globalName, discriminator, displayAvatarURL } = useAuth();
  
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    // Force redirect with refresh to root path
    window.location.href = '/';
  };

  const handleAdminClick = () => {
    // Navigate to admin page
    window.location.href = '/admin';
    setOpen(false);
  };

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h5" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontFamily: 'monospace', 
              fontWeight: 700, 
              letterSpacing: '.2rem', 
              color: 'inherit',
              background: 'linear-gradient(45deg, #ffffff 0%, rgba(0, 123, 255, 1) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(0, 123, 255, 0.5)'
            }}
          >
            RANKERS ROYALE
          </Typography>

          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {isAuth == null ? (
              null
            ) : isAuth ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {globalName}
                </Typography>
                <FaDiscord style={styles.icon} />
                <Avatar 
                  src={displayAvatarURL} 
                  alt="Profile" 
                  sx={{ width: 32, height: 32, cursor: 'pointer' }}
                  onClick={handleDrawerOpen}
                />
              </div>
            ) : (
              <Button
                variant="contained"
                startIcon={<FaDiscord />}
                href={ROUTES.LOGIN}
                sx={{
                  background: 'linear-gradient(45deg, #7289da, #5865f2)',
                  color: 'white',
                  borderRadius: '25px',
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(114, 137, 218, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5865f2, #7289da)',
                    boxShadow: '0 6px 20px rgba(114, 137, 218, 0.6)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 10px rgba(114, 137, 218, 0.4)',
                  },
                }}
              >
                Login with Discord
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        ref={drawerRef}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #0f1419 0%, #1a2332 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Menu
          </Typography>
          <IconButton onClick={handleDrawerClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DrawerHeader>
        
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        
        <List sx={{ flexGrow: 1 }}>
          {/* Profile Section */}
          {isAuth && (
            <ListItem disablePadding>
              <ListItemButton sx={{ py: 2 }}>
                <ListItemIcon>
                  <Avatar src={displayAvatarURL} alt="Profile" sx={{ width: 40, height: 40 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={`${username}${discriminator === '0' ? '' : '#' + discriminator}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
                        {globalName}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(0, 123, 255, 0.9)',
                          fontWeight: 500,
                          fontStyle: 'italic',
                          background: 'rgba(0, 123, 255, 0.1)',
                          borderRadius: '4px',
                          px: 1,
                          py: 0.5,
                          display: 'inline-block'
                        }}
                      >
                        {nickname || 'No nickname'}
                      </Typography>
                    </Box>
                  }
                  primaryTypographyProps={{ color: 'white', fontWeight: 600 }}
                />
              </ListItemButton>
            </ListItem>
          )}
          
          {/* Admin Page Link */}
          {isAdmin && (
            <ListItem disablePadding>
              <ListItemButton onClick={handleAdminClick}>
                <ListItemIcon>
                  <AdminPanelSettingsIcon sx={{ color: '#4ecdc4' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Admin Panel" 
                  primaryTypographyProps={{ color: 'white' }}
                />
              </ListItemButton>
            </ListItem>
          )}
          
          {/* Logout Button */}
          {isAuth && (
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon sx={{ color: '#ff6b6b' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout" 
                  primaryTypographyProps={{ color: 'white' }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </List>
        
        {/* Footer Section */}
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {/* Made by section */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            Made by{' '}
            <Link
              href="https://github.com/bmburhan22"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#4ecdc4',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': {
                  color: '#ff6b6b',
                },
                transition: 'color 0.2s ease-in-out',
              }}
            >
              <GitHubIcon sx={{ fontSize: 18 }} />
              bmburhan22
            </Link>
          </Typography>

          {/* Contact email */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <EmailIcon sx={{ fontSize: 18 }} />
            <Link
              href="mailto:bm.burhan22@gmail.com"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                '&:hover': {
                  color: '#ff6b6b',
                },
                transition: 'color 0.2s ease-in-out',
              }}
            >
              bm.burhan22@gmail.com
            </Link>
          </Typography>
        </Box>
      </Drawer>
    </>
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
