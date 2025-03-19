import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Grid, 
  Avatar, 
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { updateProfile } from '../store/slices/authSlice';

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [editing, setEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Initialize form data with user data when available
  useEffect(() => {
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);
  
  // Reset form when canceling edit
  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    setFormErrors({});
    setEditing(false);
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Only validate password fields if any of them has a value
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required to change password';
      }
      
      if (formData.newPassword && formData.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare data for API
    const updateData: any = {
      name: formData.name,
      email: formData.email
    };
    
    // Only include password fields if changing password
    if (formData.newPassword) {
      updateData.currentPassword = formData.currentPassword;
      updateData.password = formData.newPassword;
    }
    
    try {
      await dispatch(updateProfile(updateData)).unwrap();
      setSuccessMessage('Profile updated successfully');
      setEditing(false);
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      // Error is handled by Redux
    }
  };
  
  // Generate avatar from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5">Profile not available</Typography>
        </Paper>
      </Container>
    );
  }
  
  const userData = user;
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        {(error || successMessage) && (
          <Box mb={3}>
            {error && <Alert severity="error">{error}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}
          </Box>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            User Profile
          </Typography>
          {!editing ? (
            <Button 
              startIcon={<EditIcon />} 
              variant="contained" 
              color="primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Box>
              <Button 
                startIcon={<CancelIcon />} 
                variant="outlined" 
                color="secondary"
                onClick={handleCancelEdit}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button 
                startIcon={<SaveIcon />} 
                variant="contained" 
                color="primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                  mb: 2
                }}
              >
                {getInitials(userData.name)}
              </Avatar>
              
              <Typography variant="h6">{userData.name}</Typography>
              <Typography color="textSecondary" gutterBottom>
                {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
              </Typography>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  {userData.createdAt && `Member since ${new Date(userData.createdAt).toLocaleDateString()}`}
                </Typography>
                {userData.assignedSites && (
                  <Typography variant="body2" color="textSecondary">
                    {userData.assignedSites.length} Assigned Sites
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!editing}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!editing}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />
                </Grid>
                
                {editing && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                        Change Password
                      </Typography>
                      <Divider />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        error={!!formErrors.currentPassword}
                        helperText={formErrors.currentPassword}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        error={!!formErrors.newPassword}
                        helperText={formErrors.newPassword}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        error={!!formErrors.confirmPassword}
                        helperText={formErrors.confirmPassword}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile; 