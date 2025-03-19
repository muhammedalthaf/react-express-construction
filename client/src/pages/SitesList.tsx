import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Engineering as EngineeringIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import constructionSiteService, { ConstructionSiteResponse } from '../services/constructionSiteService';

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Helper to get status color
const getStatusColor = (status: string) => {
  switch(status) {
    case 'planning': return 'info';
    case 'in-progress': return 'warning';
    case 'on-hold': return 'error';
    case 'completed': return 'success';
    case 'cancelled': return 'default';
    default: return 'default';
  }
};

const SitesList: React.FC = () => {
  const history = useHistory();
  const [sites, setSites] = useState<ConstructionSiteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Fetch sites on component mount
  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const data = await constructionSiteService.getAllSites();
        setSites(data);
      } catch (err: any) {
        console.error('Error fetching sites:', err);
        setError(err.response?.data?.message || 'Failed to load construction sites.');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  // Filter sites based on search term and status
  const filteredSites = sites.filter(site => {
    const matchesSearch = searchTerm === '' || 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Navigate to create site form
  const handleCreateSite = () => {
    history.push('/sites/create');
  };

  // Navigate to site details
  const handleViewSite = (siteId: string) => {
    history.push(`/sites/${siteId}`);
  };

  // Navigate to edit site
  const handleEditSite = (siteId: string) => {
    history.push(`/sites/${siteId}/edit`);
  };

  // Handle site deletion with confirmation
  const handleDeleteSite = async (siteId: string) => {
    if (window.confirm('Are you sure you want to delete this construction site? This action cannot be undone.')) {
      try {
        await constructionSiteService.deleteSite(siteId);
        setSites(sites.filter(site => site._id !== siteId));
      } catch (err: any) {
        console.error('Error deleting site:', err);
        alert(err.response?.data?.message || 'Failed to delete the construction site.');
      }
    }
  };

  // Grid view rendering
  const renderGridView = () => (
    <Grid container spacing={3}>
      {filteredSites.map(site => (
        <Grid item xs={12} sm={6} md={4} key={site._id}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                {site.name}
              </Typography>
              
              <Box sx={{ mb: 1 }}>
                <Chip 
                  label={site.status.charAt(0).toUpperCase() + site.status.slice(1)} 
                  color={getStatusColor(site.status) as any}
                  size="small"
                  sx={{ mr: 1 }}
                />
                {site.isReadyForViewing && (
                  <Chip label="Ready for Viewing" color="success" size="small" />
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {site.description.substring(0, 100)}
                {site.description.length > 100 ? '...' : ''}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {site.location.city}, {site.location.country}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(site.startDate)} - {formatDate(site.expectedEndDate)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EngineeringIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {site.team.length} team members
                </Typography>
              </Box>
            </CardContent>
            
            <CardActions>
              <Button size="small" onClick={() => handleViewSite(site._id)}>View</Button>
              <Button size="small" onClick={() => handleEditSite(site._id)}>Edit</Button>
              <Button size="small" color="error" onClick={() => handleDeleteSite(site._id)}>Delete</Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // List view rendering
  const renderListView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Timeline</TableCell>
            <TableCell>Client</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredSites.map(site => (
            <TableRow key={site._id}>
              <TableCell>{site.name}</TableCell>
              <TableCell>{site.location.city}, {site.location.country}</TableCell>
              <TableCell>
                <Chip 
                  label={site.status.charAt(0).toUpperCase() + site.status.slice(1)} 
                  color={getStatusColor(site.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {formatDate(site.startDate)} - {formatDate(site.expectedEndDate)}
              </TableCell>
              <TableCell>{site.client.name}</TableCell>
              <TableCell align="center">
                <IconButton onClick={() => handleViewSite(site._id)} color="primary" size="small">
                  <ViewIcon />
                </IconButton>
                <IconButton onClick={() => handleEditSite(site._id)} color="primary" size="small">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteSite(site._id)} color="error" size="small">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <div className="sites-list-page">
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h4" component="h1">
          Construction Sites
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateSite}
        >
          Create Site
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search sites..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <FilterIcon />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="on-hold">On Hold</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          
          <Box>
            <Button 
              variant={viewMode === 'grid' ? 'contained' : 'outlined'} 
              size="small"
              onClick={() => setViewMode('grid')}
              sx={{ mr: 1 }}
            >
              Grid
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'contained' : 'outlined'} 
              size="small"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
          {error}
        </Paper>
      ) : filteredSites.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No construction sites found.</Typography>
          {searchTerm || statusFilter !== 'all' ? (
            <Button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} 
              sx={{ mt: 1 }}
            >
              Clear Filters
            </Button>
          ) : (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleCreateSite}
              sx={{ mt: 1 }}
            >
              Create Your First Site
            </Button>
          )}
        </Paper>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}
    </div>
  );
};

export default SitesList; 