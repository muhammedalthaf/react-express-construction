import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Avatar,
  Box,
  Typography,
  Badge,
  Chip
} from '@mui/material';
import {
  LocationCity as LocationCityIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { logout } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';

interface SidebarProps {
  open: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    history.push(path);
  };

  const handleLogout = () => {
    dispatch(logout());
    history.push('/login');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* User profile section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: open ? '1.5rem' : '1rem',
          mb: 2,
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
          }
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#4caf50',
              color: '#4caf50',
              boxShadow: '0 0 0 2px #fff',
              '&::after': {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                animation: 'ripple 1.2s infinite ease-in-out',
                border: '1px solid currentColor',
                content: '""',
              },
            },
          }}
        >
          <Avatar 
            sx={{ 
              width: open ? 80 : 40, 
              height: open ? 80 : 40, 
              mb: open ? 2 : 0,
              border: '3px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              bgcolor: 'primary.main',
              transition: 'all 0.3s ease',
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
        </Badge>
        {open && (
          <>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                mb: 0.5,
                textAlign: 'center',
                fontSize: '1.1rem',
              }}
            >
              {user?.name || 'User'}
            </Typography>
            <Chip
              label={user?.role || 'Role'}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                textTransform: 'capitalize',
                '& .MuiChip-label': {
                  px: 1,
                }
              }}
            />
          </>
        )}
      </Box>

      {/* Main Navigation */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <List component="nav" sx={{ px: 1 }}>
          {/* Construction Sites */}
          <ListItem 
            button 
            selected={isActive('/sites') || location.pathname.includes('/sites/')}
            onClick={() => handleNavigation('/sites')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(26, 35, 126, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(26, 35, 126, 0.12)',
                },
                '& .MuiListItemIcon-root': {
                  color: '#1a237e',
                },
                '& .MuiListItemText-primary': {
                  color: '#1a237e',
                  fontWeight: 600,
                },
              },
              '& .MuiListItemText-root': {
                minWidth: 0,
              },
              '& .MuiListItemText-primary': {
                whiteSpace: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
          >
            <ListItemIcon>
              <Tooltip title="Construction Sites" placement="right">
                <LocationCityIcon 
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': {
                      color: '#1a237e',
                    },
                  }}
                />
              </Tooltip>
            </ListItemIcon>
            {open && <ListItemText primary="Construction Sites" />}
          </ListItem>

          {/* Profile */}
          <ListItem 
            button 
            selected={isActive('/profile')}
            onClick={() => handleNavigation('/profile')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(26, 35, 126, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(26, 35, 126, 0.12)',
                },
                '& .MuiListItemIcon-root': {
                  color: '#1a237e',
                },
                '& .MuiListItemText-primary': {
                  color: '#1a237e',
                  fontWeight: 600,
                },
              },
              '& .MuiListItemText-root': {
                minWidth: 0,
              },
              '& .MuiListItemText-primary': {
                whiteSpace: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
          >
            <ListItemIcon>
              <Tooltip title="Profile" placement="right">
                <AccountCircleIcon 
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': {
                      color: '#1a237e',
                    },
                  }}
                />
              </Tooltip>
            </ListItemIcon>
            {open && <ListItemText primary="Profile" />}
          </ListItem>
        </List>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Logout - Fixed at bottom */}
      <Box sx={{ mt: 'auto', pb: 2 }}>
        <List sx={{ px: 1 }}>
          <ListItem 
            button 
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              color: '#d32f2f',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
              },
              '& .MuiListItemIcon-root': {
                color: '#d32f2f',
              },
              '& .MuiListItemText-root': {
                minWidth: 0,
              },
              '& .MuiListItemText-primary': {
                whiteSpace: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
          >
            <ListItemIcon>
              <Tooltip title="Logout" placement="right">
                <LogoutIcon />
              </Tooltip>
            </ListItemIcon>
            {open && <ListItemText primary="Logout" />}
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar; 