import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import constructionSiteService, { ConstructionSiteData } from '../services/constructionSiteService';

interface TeamMember {
  name: string;
  role: string;
}

interface Sector {
  name: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
}

const CreateSite: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Template data for quick form filling
  const templateData = {
    name: 'New Skyline Tower',
    description: 'A modern 35-story residential tower with commercial spaces on the first two floors. Features include underground parking, rooftop garden, and state-of-the-art fitness center.',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    zipCode: '10001',
    status: 'not-started',
    startDate: new Date(new Date().setDate(new Date().getDate() + 30)) as Date | null,
    expectedEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)) as Date | null,
    clientName: 'Skyline Developers LLC',
    clientContact: 'John Smith',
    clientEmail: 'john.smith@skylinedev.com',
    estimatedBudget: '75000000',
    currency: 'USD'
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    status: 'not-started',
    startDate: null as Date | null,
    expectedEndDate: null as Date | null,
    clientName: '',
    clientContact: '',
    clientEmail: '',
    estimatedBudget: '',
    currency: 'USD'
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: '', role: '' }
  ]);

  const [sectors, setSectors] = useState<Sector[]>([
    { name: '', status: 'not-started' }
  ]);

  // Function to load template data
  const loadTemplateData = () => {
    setFormData(templateData);
    setTeamMembers([
      { name: 'Sarah Johnson', role: 'Project Manager' },
      { name: 'Michael Chen', role: 'Lead Architect' },
      { name: 'Robert Williams', role: 'Civil Engineer' }
    ]);
    setSectors([
      { name: 'Foundation Work', status: 'not-started' },
      { name: 'Structural Framework', status: 'not-started' },
      { name: 'Electrical Systems', status: 'not-started' },
      { name: 'Plumbing', status: 'not-started' },
      { name: 'Interior Finishing', status: 'not-started' }
    ]);
  };

  // Function to clear form data
  const clearForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      status: 'not-started',
      startDate: null,
      expectedEndDate: null,
      clientName: '',
      clientContact: '',
      clientEmail: '',
      estimatedBudget: '',
      currency: 'USD'
    });
    setTeamMembers([{ name: '', role: '' }]);
    setSectors([{ name: '', status: 'not-started' }]);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updatedMembers = [...teamMembers];
    updatedMembers[index][field] = value;
    setTeamMembers(updatedMembers);
  };

  const handleSectorChange = (index: number, field: keyof Sector, value: string) => {
    const updatedSectors = [...sectors];
    updatedSectors[index][field] = value as any;
    setSectors(updatedSectors);
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', role: '' }]);
  };

  const removeTeamMember = (index: number) => {
    if (teamMembers.length === 1) return;
    const updatedMembers = [...teamMembers];
    updatedMembers.splice(index, 1);
    setTeamMembers(updatedMembers);
  };

  const addSector = () => {
    setSectors([...sectors, { name: '', status: 'not-started' }]);
  };

  const removeSector = (index: number) => {
    if (sectors.length === 1) return;
    const updatedSectors = [...sectors];
    updatedSectors.splice(index, 1);
    setSectors(updatedSectors);
  };

  const validateForm = () => {
    // Required fields
    if (!formData.name) return 'Site name is required';
    if (!formData.description) return 'Description is required';
    if (!formData.address || !formData.city || !formData.state || !formData.country) 
      return 'Complete location information is required';
    if (!formData.startDate) return 'Start date is required';
    if (!formData.expectedEndDate) return 'Expected end date is required';
    if (!formData.estimatedBudget) return 'Estimated budget is required';
    
    // Date validation
    if (formData.startDate && formData.expectedEndDate && 
        formData.startDate > formData.expectedEndDate) {
      return 'End date must be after start date';
    }

    // Budget validation
    if (isNaN(parseFloat(formData.estimatedBudget))) {
      return 'Budget must be a valid number';
    }

    // Team members validation
    for (const member of teamMembers) {
      if (!member.name || !member.role) {
        return 'All team members must have a name and role';
      }
    }

    // Sectors validation
    for (const sector of sectors) {
      if (!sector.name) {
        return 'All construction sectors must have a name';
      }
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Format the data for API submission
      const siteData: ConstructionSiteData = {
        name: formData.name,
        description: formData.description,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.zipCode,
          coordinates: {
            latitude: 0, // Would be set by geocoding in a real app
            longitude: 0
          }
        },
        status: 'planning', // Initial status when creating site
        isReadyForViewing: false,
        startDate: formData.startDate ? formData.startDate.toISOString().split('T')[0] : '',
        expectedEndDate: formData.expectedEndDate ? formData.expectedEndDate.toISOString().split('T')[0] : '',
        client: {
          name: formData.clientName || 'Unknown Client',
          contactPerson: formData.clientContact,
          email: formData.clientEmail
        },
        budget: {
          estimated: parseFloat(formData.estimatedBudget),
          actual: 0, // Initialize to zero
          currency: formData.currency
        },
        progress: 0, // Initialize progress to 0
        team: teamMembers
          .filter(member => member.name && member.role)
          .map(member => ({
            user: member.name,
            role: member.role,
            permissions: ['view'] // Default permission for team members
          })),
        sectors: sectors.filter(sector => sector.name).map(sector => ({
          name: sector.name,
          status: sector.status,
          description: '' // Optional description field
        }))
      };

      // Call the service to create the site
      const createdSite = await constructionSiteService.createSite(siteData);
      console.log('Site created successfully:', createdSite);
      
      // Redirect to sites page or the new site's detail page
      history.push('/sites');
    } catch (err: any) {
      console.error('Error creating site:', err);
      setError(err.response?.data?.message || 'Failed to create construction site. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-site-page">
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h4" component="h1">
          Create New Construction Site
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="info"
            startIcon={<BusinessIcon />}
            onClick={loadTemplateData}
            sx={{ mr: 2 }}
          >
            Load Template
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<RefreshIcon />}
            onClick={clearForm}
            sx={{ mr: 2 }}
          >
            Clear Form
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CancelIcon />}
            onClick={() => history.push('/sites')}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Site'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Paper className="p-4 mb-4">
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Site Name"
                name="name"
                fullWidth
                required
                value={formData.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                fullWidth
                required
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="not-started">Not Started</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="delayed">Delayed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Estimated Budget"
                name="estimatedBudget"
                fullWidth
                required
                type="number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <FormControl variant="standard" sx={{ minWidth: 80 }}>
                      <Select
                        name="currency"
                        value={formData.currency}
                        onChange={handleSelectChange}
                      >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                      </Select>
                    </FormControl>
                  )
                }}
                value={formData.estimatedBudget}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper className="p-4 mb-4">
          <Typography variant="h6" gutterBottom>
            <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Location
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Address"
                name="address"
                fullWidth
                required
                value={formData.address}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="City"
                name="city"
                fullWidth
                required
                value={formData.city}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="State/Province"
                name="state"
                fullWidth
                required
                value={formData.state}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Country"
                name="country"
                fullWidth
                required
                value={formData.country}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Zip/Postal Code"
                name="zipCode"
                fullWidth
                value={formData.zipCode}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper className="p-4 mb-4">
          <Typography variant="h6" gutterBottom>
            <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Timeline
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                margin="normal"
                required
                value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    startDate: e.target.value ? new Date(e.target.value) : null
                  });
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Expected Completion Date"
                type="date"
                fullWidth
                margin="normal"
                required
                value={formData.expectedEndDate ? formData.expectedEndDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    expectedEndDate: e.target.value ? new Date(e.target.value) : null
                  });
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper className="p-4 mb-4">
          <Typography variant="h6" gutterBottom>
            <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Client Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Client Name"
                name="clientName"
                fullWidth
                value={formData.clientName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Contact Person"
                name="clientContact"
                fullWidth
                value={formData.clientContact}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Contact Email"
                name="clientEmail"
                type="email"
                fullWidth
                value={formData.clientEmail}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper className="p-4 mb-4">
          <Box className="flex justify-between items-center mb-2">
            <Typography variant="h6">Project Team</Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={addTeamMember}
            >
              Add Team Member
            </Button>
          </Box>
          
          {teamMembers.map((member, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Team Member Name"
                  fullWidth
                  value={member.name}
                  onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Role"
                  fullWidth
                  value={member.role}
                  onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2} className="flex items-center">
                <Button 
                  color="error" 
                  onClick={() => removeTeamMember(index)}
                  disabled={teamMembers.length === 1}
                >
                  Remove
                </Button>
              </Grid>
              {index < teamMembers.length - 1 && (
                <Grid item xs={12}>
                  <Divider />
                </Grid>
              )}
            </Grid>
          ))}
        </Paper>

        <Paper className="p-4 mb-4">
          <Box className="flex justify-between items-center mb-2">
            <Typography variant="h6">Construction Sectors</Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={addSector}
            >
              Add Sector
            </Button>
          </Box>
          
          {sectors.map((sector, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Sector Name"
                  fullWidth
                  value={sector.name}
                  onChange={(e) => handleSectorChange(index, 'name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={sector.status}
                    label="Status"
                    onChange={(e) => handleSectorChange(index, 'status', e.target.value)}
                  >
                    <MenuItem value="not-started">Not Started</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="delayed">Delayed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2} className="flex items-center">
                <Button 
                  color="error" 
                  onClick={() => removeSector(index)}
                  disabled={sectors.length === 1}
                >
                  Remove
                </Button>
              </Grid>
              {index < sectors.length - 1 && (
                <Grid item xs={12}>
                  <Divider />
                </Grid>
              )}
            </Grid>
          ))}
        </Paper>
      </form>
    </div>
  );
};

export default CreateSite; 