import React from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return (
      <Redirect
        to={{
          pathname: "/login",
          state: { from: location }
        }}
      />
    );
  }

  // If role is required but user doesn't have it, redirect to unauthorized
  if (requiredRole && user && user.role !== requiredRole) {
    return (
      <Redirect
        to={{
          pathname: "/unauthorized",
          state: { from: location }
        }}
      />
    );
  }

  // User is authenticated and has required role if specified
  return <>{children}</>;
};

export default ProtectedRoute; 