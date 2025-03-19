import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';

const Unauthorized: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <LockIcon color="error" sx={{ fontSize: 80 }} />
        <Typography variant="h3" component="h1" gutterBottom sx={{ mt: 2 }}>
          Access Denied
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          403 - Unauthorized
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You don't have permission to access this page.
          Please contact your administrator if you believe this is an error.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 3 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default Unauthorized; 