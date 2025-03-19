import React from 'react';
import { Typography, Grid, Paper, Box } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-page">
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper className="p-4 h-full" elevation={2}>
            <Typography variant="h6" component="h2" gutterBottom>
              Construction Sites
            </Typography>
            <Typography variant="h3" className="font-bold text-primary-main">
              12
            </Typography>
            <Typography variant="body2" color="text.secondary">
              5 active, 3 on hold, 4 completed
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper className="p-4 h-full" elevation={2}>
            <Typography variant="h6" component="h2" gutterBottom>
              Drone Images
            </Typography>
            <Typography variant="h3" className="font-bold text-info-main">
              156
            </Typography>
            <Typography variant="body2" color="text.secondary">
              23 uploaded this week
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper className="p-4 h-full" elevation={2}>
            <Typography variant="h6" component="h2" gutterBottom>
              Annotated Areas
            </Typography>
            <Typography variant="h3" className="font-bold text-secondary-main">
              78
            </Typography>
            <Typography variant="body2" color="text.secondary">
              42 in progress, 36 completed
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper className="p-4 h-full" elevation={2}>
            <Typography variant="h6" component="h2" gutterBottom>
              Overall Progress
            </Typography>
            <Typography variant="h3" className="font-bold text-success-main">
              67%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              +5% from last month
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper className="p-4 mt-4" elevation={2}>
            <Typography variant="h6" component="h2" gutterBottom>
              Recent Activity
            </Typography>
            <Box>
              <Typography variant="body1">
                This is a placeholder for activity charts and data visualization.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard; 