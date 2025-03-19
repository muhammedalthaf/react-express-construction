import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Divider,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Image as ImageIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Construction as ConstructionIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import constructionSiteService, { ConstructionSiteResponse } from '../services/constructionSiteService';
import droneImageService, { DroneImage } from '../services/droneImageService';
import userService, { User } from '../services/userService';
import { RootState } from '../store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`site-tabpanel-${index}`}
      aria-labelledby={`site-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SiteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [site, setSite] = useState<ConstructionSiteResponse | null>(null);
  const [droneImages, setDroneImages] = useState<DroneImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [markReadyDialog, setMarkReadyDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [markReadyLoading, setMarkReadyLoading] = useState(false);
  const [markReadyError, setMarkReadyError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newProgress, setNewProgress] = useState<number>(0);
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  const [updateProgressLoading, setUpdateProgressLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Fetch site data
  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        setLoading(true);
        const data = await constructionSiteService.getSiteById(id);
        setSite(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching site details:', err);
        setError(err.response?.data?.message || 'Failed to load site details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSiteData();
    }
  }, [id]);

  // Fetch drone images
  useEffect(() => {
    const fetchDroneImages = async () => {
      try {
        setImagesLoading(true);
        const images = await droneImageService.getAllImages(id);
        setDroneImages(images);
        setImagesError(null);
      } catch (err: any) {
        console.error('Error fetching drone images:', err);
        setImagesError(err.response?.data?.message || 'Failed to load drone images');
      } finally {
        setImagesLoading(false);
      }
    };

    if (id) {
      fetchDroneImages();
    }
  }, [id]);

  // Fetch available users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError(null);
        const users = await userService.getAllUsers();
        // Filter only users with role "user"
        const filteredUsers = users.filter(user => user.role === 'user');
        setAvailableUsers(filteredUsers);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setUsersError(err.response?.data?.message || 'Failed to load users');
      } finally {
        setUsersLoading(false);
      }
    };

    if (markReadyDialog) {
      fetchUsers();
    }
  }, [markReadyDialog]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'default';
      case 'in-progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'delayed':
        return 'warning';
      case 'planning':
        return 'info';
      case 'on-hold':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleEditSite = () => {
    if (site && user?.role !== 'user') {
      history.push(`/sites/${site._id}/edit`);
    }
  };

  const handleUploadImage = () => {
    if (site && user?.role !== 'user') {
      history.push(`/sites/${site._id}/upload-image`);
    }
  };

  const getDefaultImage = () => {
    return 'https://via.placeholder.com/300x200?text=Construction+Site';
  };

  const handleMarkReady = async () => {
    if (!site || !selectedUser) return;

    try {
      setMarkReadyLoading(true);
      setMarkReadyError(null);
      
      // Use the new markSiteAsReady endpoint
      const updatedSite = await constructionSiteService.markSiteAsReady(site._id, selectedUser);
      setSite(updatedSite);

      // Close the dialog
      setMarkReadyDialog(false);
      setSelectedUser('');
    } catch (err: any) {
      console.error('Error marking site as ready:', err);
      setMarkReadyError(err.response?.data?.message || 'Failed to mark site as ready');
    } finally {
      setMarkReadyLoading(false);
    }
  };

  // Update the function to check if user has access to annotate
  const canAnnotate = () => {
    if (!site || !user) return false;
    // Only admin can annotate
    return user.role === 'admin';
  };

  // Add a function to check if user can view
  const canView = () => {
    if (!site || !user) return false;
    // Admin can always view
   return true;

  };

  const handleStatusUpdate = async () => {
    if (!site || !newStatus) return;
    
    try {
      setUpdateStatusLoading(true);
      setUpdateError(null);
      
      // If progress is also being updated, use the combined endpoint
      if (progressDialogOpen) {
        const updatedSite = await constructionSiteService.updateSiteStatusAndProgress(site._id, newStatus, newProgress);
        setSite(updatedSite);
        setProgressDialogOpen(false);
      } else {
        const updatedSite = await constructionSiteService.updateSiteStatus(site._id, newStatus);
        setSite(updatedSite);
      }
      setStatusDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setUpdateError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdateStatusLoading(false);
    }
  };

  const handleProgressUpdate = async () => {
    if (!site || newProgress < 0 || newProgress > 100) return;
    
    try {
      setUpdateProgressLoading(true);
      setUpdateError(null);
      
      // If status is also being updated, use the combined endpoint
      if (statusDialogOpen) {
        const updatedSite = await constructionSiteService.updateSiteStatusAndProgress(site._id, newStatus, newProgress);
        setSite(updatedSite);
        setStatusDialogOpen(false);
      } else {
        const updatedSite = await constructionSiteService.updateSiteProgress(site._id, newProgress);
        setSite(updatedSite);
      }
      setProgressDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating progress:', err);
      setUpdateError(err.response?.data?.message || 'Failed to update progress');
    } finally {
      setUpdateProgressLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !site) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error || 'Failed to load site data'}
      </Alert>
    );
  }

  return (
    <div className="site-detail-page">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        mb: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        p: 2,
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: '#1a237e',
              mb: 2,
            }}
          >
            {site.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={site.status.replace('-', ' ')} 
                color={getStatusColor(site.status) as any}
                size="small"
                sx={{ 
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  backdropFilter: 'blur(4px)',
                  '& .MuiChip-label': {
                    px: 1.5,
                    fontSize: '0.75rem',
                    letterSpacing: '0.3px',
                  }
                }}
              />
              {user?.role === 'admin' && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setNewStatus(site.status);
                    setStatusDialogOpen(true);
                  }}
                  sx={{ 
                    color: '#1a237e',
                    '&:hover': { backgroundColor: 'rgba(26, 35, 126, 0.04)' }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'text.secondary',
                '& .MuiSvgIcon-root': {
                  fontSize: 18,
                  mr: 0.5,
                  color: '#1a237e',
                  opacity: 0.8,
                }
              }}
            >
              <LocationIcon />
              {site.location.city}, {site.location.country}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {user?.role !== 'user' && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditSite}
                sx={{
                  borderColor: '#1a237e',
                  color: '#1a237e',
                  '&:hover': {
                    borderColor: '#0d47a1',
                    backgroundColor: 'rgba(26, 35, 126, 0.04)',
                  },
                  px: 3,
                  py: 1,
                }}
              >
                Edit Site
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setMarkReadyDialog(true)}
                sx={{
                  px: 3,
                  py: 1,
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Mark as Ready
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 2, 
              mb: 2,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                color: '#1a237e',
                mb: 2,
              }}
            >
              Description
            </Typography>
            <Typography 
              variant="body1"
              sx={{ 
                lineHeight: 1.8,
                color: 'text.secondary',
              }}
            >
              {site.description}
            </Typography>
          </Paper>

          <Paper 
            sx={{ 
              p: 2, 
              mb: 2,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography 
                variant="h6"
                sx={{ 
                  fontWeight: 600,
                  color: '#1a237e',
                }}
              >
                Overall Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 700,
                    color: '#1a237e',
                  }}
                >
                  {site.progress || 0}%
                </Typography>
                {user?.role === 'admin' && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setNewProgress(site.progress || 0);
                      setProgressDialogOpen(true);
                    }}
                    sx={{ 
                      color: '#1a237e',
                      '&:hover': { backgroundColor: 'rgba(26, 35, 126, 0.04)' }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={site.progress || 0} 
              color={getStatusColor(site.status) as any}
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: 'rgba(26, 35, 126, 0.08)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  transition: 'width 0.5s ease-in-out',
                }
              }}
            />
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6} sm={3}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Start Date
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ 
                    fontWeight: 500,
                    color: '#1a237e',
                  }}
                >
                  {new Date(site.startDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Expected Completion
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ 
                    fontWeight: 500,
                    color: '#1a237e',
                  }}
                >
                  {new Date(site.expectedEndDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Estimated Budget
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ 
                    fontWeight: 500,
                    color: '#1a237e',
                  }}
                >
                  {formatCurrency(site.budget.estimated, site.budget.currency)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Actual Spent
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ 
                    fontWeight: 500,
                    color: '#1a237e',
                  }}
                >
                  {formatCurrency(site.budget.actual || 0, site.budget.currency)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Box sx={{ width: '100%', mt: 2 }}>
        <Box 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="site tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 120,
                '&.Mui-selected': {
                  color: '#1a237e',
                  fontWeight: 600,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1a237e',
                height: 3,
              },
            }}
          >
            <Tab 
              icon={<ImageIcon />} 
              label="Drone Images"
              sx={{ 
                '& .MuiSvgIcon-root': {
                  color: tabValue === 0 ? '#1a237e' : 'text.secondary',
                }
              }}
            />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography 
              variant="h6"
              sx={{ 
                fontWeight: 600,
                color: '#1a237e',
              }}
            >
              Drone Images
            </Typography>
            {user?.role !== 'user' && (
              <Button 
                variant="contained" 
                startIcon={<ImageIcon />}
                onClick={handleUploadImage}
                sx={{
                  bgcolor: '#1a237e',
                  '&:hover': {
                    bgcolor: '#0d47a1',
                    transform: 'translateY(-1px)',
                  },
                  boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Upload New Image
              </Button>
            )}
          </Box>

          {imagesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress sx={{ color: '#1a237e' }} />
            </Box>
          ) : imagesError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{imagesError}</Alert>
          ) : (
            <Grid container spacing={2}>
              {droneImages.length > 0 ? (
                droneImages.map((image) => (
                  <Grid item xs={12} sm={6} md={4} key={image._id}>
                    <Card
                      sx={{
                        height: '100%',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        },
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="160"
                        image={image.imageUrl || getDefaultImage()}
                        alt={image.title}
                        sx={{
                          transition: 'transform 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      />
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography 
                          variant="h6"
                          sx={{ 
                            fontWeight: 600,
                            color: '#1a237e',
                            mb: 1,
                            fontSize: '1.1rem',
                          }}
                        >
                          {image.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {new Date(image.captureDate).toLocaleDateString()}
                        </Typography>
                        {image.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.6,
                            }}
                          >
                            {image.description}
                          </Typography>
                        )}
                        {canView() && (
                          <Button 
                            size="small"
                            onClick={() => history.push(`/annotate/${image._id}`)}
                            sx={{
                              color: '#1a237e',
                              '&:hover': {
                                backgroundColor: 'rgba(26, 35, 126, 0.04)',
                              },
                            }}
                          >
                            {canAnnotate() ? 'View & Annotate' : 'View'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Box 
                  sx={{ 
                    width: '100%', 
                    p: 4, 
                    textAlign: 'center',
                    background: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  >
                    No drone images uploaded yet.
                  </Typography>
                </Box>
              )}
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography 
            variant="h6"
            sx={{ 
              fontWeight: 600,
              color: '#1a237e',
              mb: 2,
            }}
          >
            Construction Progress Timeline
          </Typography>
          <Box>
            <Typography 
              variant="body1"
              sx={{ 
                color: 'text.secondary',
                fontStyle: 'italic',
              }}
            >
              Timeline view will be shown here with progress statistics.
            </Typography>
          </Box>
        </TabPanel>
      </Box>
      
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 2, 
              mb: 2,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontWeight: 600,
                color: '#1a237e',
                mb: 2,
              }}
            >
              <PeopleIcon sx={{ mr: 1, color: '#1a237e', opacity: 0.8 }} /> 
              Project Team
            </Typography>
            <List dense>
              {site.team && site.team.length > 0 ? (
                site.team.map((member, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(26, 35, 126, 0.04)',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 500, color: '#1a237e' }}>
                          {member.user}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {member.role}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No team members assigned yet"
                    sx={{ 
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          <Paper 
            sx={{ 
              p: 2, 
              mb: 2,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontWeight: 600,
                color: '#1a237e',
                mb: 2,
              }}
            >
              <ConstructionIcon sx={{ mr: 1, color: '#1a237e', opacity: 0.8 }} /> 
              Construction Sectors
            </Typography>
            <List dense>
              {site.sectors && site.sectors.length > 0 ? (
                site.sectors.map((sector, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(26, 35, 126, 0.04)',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 500, color: '#1a237e' }}>
                          {sector.name}
                        </Typography>
                      }
                    />
                    <Chip 
                      label={sector.status.replace('-', ' ')} 
                      color={getStatusColor(sector.status) as any}
                      size="small"
                      sx={{ 
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        backdropFilter: 'blur(4px)',
                        '& .MuiChip-label': {
                          px: 1.5,
                          fontSize: '0.75rem',
                          letterSpacing: '0.3px',
                        }
                      }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No sectors defined yet"
                    sx={{ 
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>

      </Grid>
      </Grid>


      {/* Mark as Ready Dialog */}
      <Dialog 
        open={markReadyDialog} 
        onClose={() => setMarkReadyDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          color: '#1a237e',
          p: 2,
        }}>
          Mark Site as Ready
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Assign to User</InputLabel>
              {usersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} sx={{ color: '#1a237e' }} />
                </Box>
              ) : usersError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {usersError}
                </Alert>
              ) : (
                <Select
                  value={selectedUser}
                  label="Assign to User"
                  onChange={(e) => setSelectedUser(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1a237e',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0d47a1',
                    },
                  }}
                >
                  {availableUsers.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </FormControl>
            {markReadyError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {markReadyError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setMarkReadyDialog(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMarkReady}
            variant="contained"
            color="success"
            disabled={!selectedUser || markReadyLoading}
            sx={{
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {markReadyLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Mark as Ready'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          color: '#1a237e',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Update Status
          <IconButton
            size="small"
            onClick={() => setStatusDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1a237e',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0d47a1',
                },
              }}
            >
              <MenuItem value="not-started">Not Started</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="delayed">Delayed</MenuItem>
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="on-hold">On Hold</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          {updateError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {updateError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setStatusDialogOpen(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!newStatus || updateStatusLoading}
            sx={{
              bgcolor: '#1a237e',
              '&:hover': {
                bgcolor: '#0d47a1',
              },
            }}
          >
            {updateStatusLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Progress Update Dialog */}
      <Dialog
        open={progressDialogOpen}
        onClose={() => setProgressDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          color: '#1a237e',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Update Progress
          <IconButton
            size="small"
            onClick={() => setProgressDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ width: '100%', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress:
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600,
                  color: '#1a237e',
                  minWidth: '60px'
                }}
              >
                {newProgress}%
              </Typography>
            </Box>
            <Slider
              value={newProgress}
              onChange={(_, value) => setNewProgress(value as number)}
              aria-labelledby="progress-slider"
              valueLabelDisplay="auto"
              step={1}
              min={0}
              max={100}
              sx={{
                color: '#1a237e',
                '& .MuiSlider-thumb': {
                  width: 20,
                  height: 20,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(26, 35, 126, 0.16)',
                  },
                },
                '& .MuiSlider-rail': {
                  opacity: 0.32,
                },
              }}
            />
          </Box>
          <TextField
            fullWidth
            label="Progress (%)"
            type="number"
            value={newProgress}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 0 && value <= 100) {
                setNewProgress(value);
              }
            }}
            InputProps={{
              inputProps: { 
                min: 0, 
                max: 100,
                step: 1
              },
              endAdornment: (
                <InputAdornment position="end">
                  %
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#1a237e',
                },
                '&:hover fieldset': {
                  borderColor: '#0d47a1',
                },
              },
            }}
          />
          {updateError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {updateError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setProgressDialogOpen(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleProgressUpdate}
            variant="contained"
            disabled={newProgress < 0 || newProgress > 100 || updateProgressLoading}
            sx={{
              bgcolor: '#1a237e',
              '&:hover': {
                bgcolor: '#0d47a1',
              },
            }}
          >
            {updateProgressLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Update Progress'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SiteDetail; 