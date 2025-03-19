import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
  Grid,
  Typography,
  Slider,
  Chip,
  Box,
  CircularProgress,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import { Annotation } from '../services/annotationService';
import progressDataService, { convertToFormData } from '../services/progressDataService';

// Interface for the development data
export interface DevelopmentData {
  workType: 'earthwork' | 'pilingWork' | 'buildingWork' | '';
  progressPercentage: number;
  startDate: Date | null;
  completionDate: Date | null;
  notes: string;
  status: 'notStarted' | 'inProgress' | 'completed';
}

interface Props {
  open: boolean;
  onClose: () => void;
  annotation: Annotation | null;
  onSave: (annotationId: string, developmentData: DevelopmentData) => Promise<void>;
  initialData?: Partial<DevelopmentData>;
  isLoading?: boolean;
  error?: string | null;
  readOnly?: boolean;
}

const AnnotationDevelopmentForm = (props: Props) => {
  const { open, onClose, annotation, onSave, initialData, isLoading = false, error = null, readOnly = false } = props;
  
  // Default empty form data
  const defaultData: DevelopmentData = {
    workType: '',
    progressPercentage: 0,
    startDate: null,
    completionDate: null,
    notes: '',
    status: 'notStarted'
  };

  // Form state
  const [formData, setFormData] = useState<DevelopmentData>(defaultData);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Fetch existing progress data when the form opens
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!annotation?.id) return;
      
      setIsLoadingExisting(true);
      try {
        const existingData = await progressDataService.getProgressDataForAnnotation(annotation.id);
        if (existingData) {
          const transformedData = convertToFormData(existingData);
          setFormData(transformedData);
        } else if (initialData) {
          // If no existing data but we have initialData, use that
          setFormData({
            ...defaultData,
            ...initialData
          });
        } else {
          setFormData(defaultData);
        }
      } catch (err) {
        console.error('Error fetching existing progress data:', err);
        // Fallback to initialData or default if fetch fails
        setFormData(initialData ? { ...defaultData, ...initialData } : defaultData);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    if (open) {
      fetchExistingData();
    }
  }, [open, annotation?.id, initialData]);

  // Handle input changes
  const handleChange = (field: keyof DevelopmentData, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Clear error for this field if it exists
    if (formErrors[field]) {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      setFormErrors(newErrors);
    }
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    handleChange(name as keyof DevelopmentData, value);
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.workType) {
      errors.workType = 'Work type is required';
    }
    
    if (formData.progressPercentage > 0 && !formData.startDate) {
      errors.startDate = 'Start date is required for work in progress';
    }
    
    if (formData.progressPercentage === 100 && !formData.completionDate) {
      errors.completionDate = 'Completion date is required for completed work';
    }
    
    if (formData.startDate && formData.completionDate && 
        formData.completionDate < formData.startDate) {
      errors.completionDate = 'Completion date cannot be before start date';
    }
    
    // Status validation
    if (formData.progressPercentage === 0 && formData.status !== 'notStarted') {
      errors.status = 'Status should be "Not Started" when progress is 0%';
    } else if (formData.progressPercentage === 100 && formData.status !== 'completed') {
      errors.status = 'Status should be "Completed" when progress is 100%';
    } else if (formData.progressPercentage > 0 && formData.progressPercentage < 100 && 
               formData.status !== 'inProgress') {
      errors.status = 'Status should be "In Progress" when progress is between 1% and 99%';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm() && annotation) {
      try {
        await onSave(annotation.id as string, formData);
        onClose();
      } catch (err) {
        // Error is handled by parent component
      }
    }
  };

  // Function to get color based on status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'notStarted':
        return '#9e9e9e'; // Gray
      case 'inProgress':
        return '#2196f3'; // Blue
      case 'completed':
        return '#4caf50'; // Green
      default:
        return '#9e9e9e';
    }
  };
  
  // Function to get label based on status
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'notStarted':
        return 'Not Started';
      case 'inProgress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };
  
  // Update status based on progress percentage
  useEffect(() => {
    // Only auto-update if the user hasn't manually changed the status
    if (
      (formData.progressPercentage === 0 && formData.status !== 'notStarted') ||
      (formData.progressPercentage === 100 && formData.status !== 'completed') ||
      (formData.progressPercentage > 0 && formData.progressPercentage < 100 && formData.status !== 'inProgress')
    ) {
      let newStatus: 'notStarted' | 'inProgress' | 'completed';
      
      if (formData.progressPercentage === 0) {
        newStatus = 'notStarted';
      } else if (formData.progressPercentage === 100) {
        newStatus = 'completed';
      } else {
        newStatus = 'inProgress';
      }
      
      setFormData({
        ...formData,
        status: newStatus
      });
    }
  }, [formData.progressPercentage]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="development-data-dialog-title"
    >
      <DialogTitle id="development-data-dialog-title">
        {annotation ? `Development Data for ${annotation.label || 'Annotation'}` : 'Development Data'}
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {isLoadingExisting ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Work Type Selection */}
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                error={!!formErrors.workType}
                required
                margin="normal"
              >
                <InputLabel id="work-type-label">Work Type</InputLabel>
                <Select
                  labelId="work-type-label"
                  id="workType"
                  name="workType"
                  value={formData.workType}
                  label="Work Type"
                  onChange={handleSelectChange}
                  disabled={readOnly}
                >
                  <MenuItem value="earthwork">Earthwork</MenuItem>
                  <MenuItem value="pilingWork">Piling Work</MenuItem>
                  <MenuItem value="buildingWork">Building Work</MenuItem>
                </Select>
                {formErrors.workType && (
                  <FormHelperText>{formErrors.workType}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Status Display */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Status:
              </Typography>
              <Chip
                label={getStatusLabel(formData.status)}
                sx={{
                  backgroundColor: getStatusColor(formData.status),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Grid>
            
            {/* Progress Percentage */}
            <Grid item xs={12}>
              <Typography id="progress-slider-label" gutterBottom>
                Progress: {formData.progressPercentage}%
              </Typography>
              <Slider
                aria-labelledby="progress-slider-label"
                value={formData.progressPercentage}
                onChange={(_, value) => {
                  const newValue = typeof value === 'number' ? value : value[0];
                  handleChange('progressPercentage', newValue);
                }}
                valueLabelDisplay="auto"
                step={5}
                disabled={readOnly}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' }
                ]}
              />
            </Grid>
            
            {/* Date Pickers - Simple version with TextField */}
            <Grid item xs={12} md={6}>
              <TextField
                id="startDate"
                label="Start Date"
                type="date"
                fullWidth
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  handleChange('startDate', date);
                }}
                error={!!formErrors.startDate}
                helperText={formErrors.startDate}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="completionDate"
                label="Completion Date"
                type="date"
                fullWidth
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                value={formData.completionDate ? formData.completionDate.toISOString().split('T')[0] : ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  handleChange('completionDate', date);
                }}
                error={!!formErrors.completionDate}
                helperText={formErrors.completionDate}
                disabled={readOnly}
              />
            </Grid>
            
            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                id="notes"
                name="notes"
                label="Notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('notes', e.target.value)}
                fullWidth
                margin="normal"
                placeholder="Enter any additional notes or metadata..."
                disabled={readOnly}
              />
            </Grid>
            
            {/* Annotation Info Summary */}
            {annotation && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: 'rgba(0, 0, 0, 0.03)',
                  borderLeft: `4px solid ${annotation.color}`,
                  mt: 2 
                }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Annotation Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body2">
                        {annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Category
                      </Typography>
                      <Typography variant="body2">
                        {annotation.category}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Label
                      </Typography>
                      <Typography variant="body2">
                        {annotation.label}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        ID
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {annotation.id?.substring(0, 8)}...
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={isLoading || isLoadingExisting}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AnnotationDevelopmentForm; 