import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActionArea,
  Box,
  Chip,
  LinearProgress,
  MenuItem,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import constructionSiteService, { ConstructionSiteResponse } from '../services/constructionSiteService';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const ConstructionSites: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sites, setSites] = useState<ConstructionSiteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const history = useHistory();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';

  // Fetch construction sites data
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
        const data = await constructionSiteService.getAllSites(filters);
        setSites(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching construction sites:', err);
        setError(err.response?.data?.message || 'Failed to load construction sites');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [statusFilter]);

  // Filter sites based on search term
  const filteredSites = sites.filter((site) => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.location.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'info';
      case 'in-progress':
        return 'primary';
      case 'on-hold':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleCardClick = (id: string) => {
    history.push(`/sites/${id}`);
  };

  // Get the default image for sites without images
  const getDefaultImage = () => {
    return 'https://via.placeholder.com/300x200?text=Construction+Site';
  };

  return (
    <Box sx={{ 
      p: 2,
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
      minHeight: '100%'
    }}>
      {/* Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3, 
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          borderRadius: 2,
          position: 'sticky',
          top: '80px',
          zIndex: 1200,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Construction Sites
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9, letterSpacing: '0.3px' }}>
              Manage and monitor your construction projects
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => history.push('/sites/create')}
            sx={{
              bgcolor: 'white',
              color: '#1a237e',
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                transform: 'translateY(-1px)',
              },
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Add New Site
          </Button>
        </Box>
      </Paper>

      {/* Search and Filter Section */}
      {sites.length > 0 && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 3, 
            background: 'white',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Search Sites"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#1a237e' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#1a237e',
                  },
                },
              }}
            />
            <Tooltip title="Toggle Filters">
              <IconButton 
                onClick={() => setShowFilters(!showFilters)}
                sx={{ 
                  bgcolor: '#f5f5f5',
                  '&:hover': { 
                    bgcolor: '#e0e0e0',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <FilterIcon sx={{ color: '#1a237e' }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Fade in={showFilters}>
            <Box sx={{ mt: 2 }}>
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#1a237e',
                    },
                  },
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="planning">Planning</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="on-hold">On Hold</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Box>
          </Fade>
        </Paper>
      )}

      {/* Sites Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: '#1a237e' }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : sites.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            width: '100%', 
            p: 4, 
            textAlign: 'center',
            background: 'white',
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <ConstructionIcon 
            sx={{ 
              fontSize: 48, 
              color: '#1a237e',
              mb: 2,
              opacity: 0.5
            }} 
          />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
            No construction sites found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {isAdmin 
              ? "Get started by creating your first construction site"
              : "No construction sites are available at the moment"}
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => history.push('/sites/create')}
              sx={{
                bgcolor: '#1a237e',
                '&:hover': {
                  bgcolor: '#0d47a1',
                  transform: 'translateY(-1px)',
                },
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Create New Site
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredSites.map((site) => (
            <Grid item xs={12} sm={6} md={4} key={site._id}>
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
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
                }}
              >
                <CardActionArea onClick={() => handleCardClick(site._id)}>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      height: '120px',
                      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <ConstructionIcon 
                      sx={{ 
                        fontSize: 80,
                        color: 'rgba(255, 255, 255, 0.1)',
                        position: 'absolute',
                        right: -20,
                        bottom: -20,
                        transform: 'rotate(-15deg)',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 1,
                      }}
                    >
                      <Chip 
                        label={site.status.replace('-', ' ')} 
                        color={getStatusColor(site.status) as any}
                        size="small"
                        sx={{ 
                          textTransform: 'capitalize',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          backdropFilter: 'blur(4px)',
                          bgcolor: 'rgba(255, 255, 255, 0.95)',
                          '& .MuiChip-label': {
                            px: 1.5,
                            fontSize: '0.75rem',
                            letterSpacing: '0.3px',
                          },
                          '&.MuiChip-colorSuccess': {
                            bgcolor: 'rgba(76, 175, 80, 0.95)',
                            color: 'white',
                          },
                          '&.MuiChip-colorError': {
                            bgcolor: 'rgba(244, 67, 54, 0.95)',
                            color: 'white',
                          },
                          '&.MuiChip-colorWarning': {
                            bgcolor: 'rgba(255, 152, 0, 0.95)',
                            color: 'white',
                          },
                          '&.MuiChip-colorInfo': {
                            bgcolor: 'rgba(33, 150, 243, 0.95)',
                            color: 'white',
                          },
                          '&.MuiChip-colorPrimary': {
                            bgcolor: 'rgba(25, 118, 210, 0.95)',
                            color: 'white',
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#1a237e',
                        mb: 1.5,
                        fontSize: '1.1rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {site.name}
                    </Typography>

                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2, 
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
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {site.location.city}, {site.location.country}
                      </Typography>
                    </Box>

                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2.5, 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        lineHeight: 1.6,
                        fontSize: '0.875rem',
                      }}
                    >
                      {site.description}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          mb: 1.5,
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUpIcon sx={{ fontSize: 18, mr: 0.5, color: '#1a237e', opacity: 0.8 }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                              fontSize: '0.875rem'
                            }}
                          >
                            Progress
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 700, 
                            color: '#1a237e',
                            fontSize: '0.875rem'
                          }}
                        >
                          {site.progress || 0}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={site.progress || 0} 
                        color={getStatusColor(site.status) as any}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(26, 35, 126, 0.08)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            transition: 'width 0.5s ease-in-out',
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ConstructionSites; 