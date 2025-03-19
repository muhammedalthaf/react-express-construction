import React, { useState, useEffect } from 'react';
import { useHistory, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Link,
  Alert,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import { login, clearError } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import {
  Construction as ConstructionIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const theme = useTheme();
  
  const history = useHistory();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.auth);
  
  useEffect(() => {
    if (isAuthenticated) {
      history.push('/');
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, history, dispatch]);
  
  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    let isValid = true;
    
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      dispatch(login({ email, password }));
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        py: 4,
        overflow: 'hidden',
        background: `linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #1565c0 100%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%)`,
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.05) 75%, transparent 75%, transparent)`,
          backgroundSize: '100px 100px',
          animation: 'moveBackground 20s linear infinite',
          zIndex: 0,
          '@keyframes moveBackground': {
            '0%': { backgroundPosition: '0 0' },
            '100%': { backgroundPosition: '100px 100px' }
          }
        }
      }}
    >
      {/* Animated background shapes */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
            top: '10%',
            left: '10%',
            animation: 'floatShape 20s infinite ease-in-out',
            '@keyframes floatShape': {
              '0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
              '25%': { transform: 'translate(100px, 50px) rotate(90deg) scale(1.1)' },
              '50%': { transform: 'translate(0, 100px) rotate(180deg) scale(1)' },
              '75%': { transform: 'translate(-100px, 50px) rotate(270deg) scale(0.9)' }
            }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%)`,
            bottom: '10%',
            right: '10%',
            animation: 'floatShape 15s infinite ease-in-out reverse',
            '@keyframes floatShape': {
              '0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
              '25%': { transform: 'translate(-100px, -50px) rotate(90deg) scale(1.1)' },
              '50%': { transform: 'translate(0, -100px) rotate(180deg) scale(1)' },
              '75%': { transform: 'translate(100px, -50px) rotate(270deg) scale(0.9)' }
            }
          }}
        />
      </Box>
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 4,
            background: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)'
            }
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <ConstructionIcon 
              sx={{ 
                fontSize: 48, 
                color: theme.palette.primary.main,
                mb: 2,
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' }
                }
              }} 
            />
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Construction Monitoring
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Welcome back! Please sign in to your account.
            </Typography>
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                animation: 'shake 0.5s ease-in-out',
                '@keyframes shake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                  '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
                }
              }}
            >
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!formErrors.email}
              helperText={formErrors.email}
              InputProps={{
                startAdornment: (
                  <EmailIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`
                  }
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
              InputProps={{
                startAdornment: (
                  <LockIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`
                  }
                }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 5px 8px 2px ${alpha(theme.palette.primary.main, 0.4)}`
                },
                '&:disabled': {
                  background: alpha(theme.palette.primary.main, 0.5)
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  Sign In
                  <ArrowForwardIcon sx={{ ml: 1 }} />
                </>
              )}
            </Button>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                mt: 2,
                px: 1
              }}
            >
              <Link 
                href="#" 
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    color: theme.palette.primary.dark,
                    textDecoration: 'underline'
                  }
                }}
              >
                Forgot password?
              </Link>
              <Link 
                component={RouterLink} 
                to="/register" 
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    color: theme.palette.primary.dark,
                    textDecoration: 'underline'
                  }
                }}
              >
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 