import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, Drawer, AppBar, Toolbar, Typography, Divider, IconButton, Container, useTheme } from '@mui/material';
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';
import Sidebar from './Sidebar';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Define the drawer width
const drawerWidth: number = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    return savedState ? JSON.parse(savedState) : true;
  });
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();

  const handleDrawerOpen = () => {
    setOpen(true);
    localStorage.setItem('sidebarOpen', 'true');
  };

  const handleDrawerClose = () => {
    setOpen(false);
    localStorage.setItem('sidebarOpen', 'false');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: (theme) =>
              theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            Construction Monitoring
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mr: 2,
              fontWeight: 500,
              opacity: 0.9,
            }}
          >
            Welcome, {user?.name || 'User'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: '#f8f9fa',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            ...(open ? {
              overflowX: 'hidden'
            } : {
              overflowX: 'hidden',
              width: theme => theme.spacing(7),
              '@media (min-width: 600px)': {
                width: theme => theme.spacing(9),
              }
            })
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
            background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
            color: 'white',
          }}
        >
          <IconButton 
            onClick={handleDrawerClose}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <Sidebar open={open} />
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          backgroundImage: 'linear-gradient(45deg, #f8f9fa 25%, #ffffff 25%, #ffffff 50%, #f8f9fa 50%, #f8f9fa 75%, #ffffff 75%, #ffffff 100%)',
          backgroundSize: '56.57px 56.57px',
          backgroundPosition: '0 0, 0 0, 28.28px 28.28px, 28.28px 28.28px',
          backgroundColor: '#f8f9fa',
        }}
      >
        <Toolbar />
        <Container 
          maxWidth={false}
          sx={{ 
            mt: 2, 
            mb: 2,
            backgroundColor: 'white',
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            p: 2,
            maxWidth: '1600px !important',
            mx: 'auto'
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 