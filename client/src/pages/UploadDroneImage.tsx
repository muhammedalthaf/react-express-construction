import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  FormHelperText,
  Container
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Close as CloseIcon,
  ArrowBack as BackIcon 
} from '@mui/icons-material';
import { format } from 'date-fns';
import droneImageService from '../services/droneImageService';
import constructionSiteService, { ConstructionSiteResponse } from '../services/constructionSiteService';

const UploadDroneImage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const history = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Site data
  const [site, setSite] = useState<ConstructionSiteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [captureDate, setCaptureDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Form submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form validation
  const [errors, setErrors] = useState({
    title: '',
    file: ''
  });

  // Fetch site data
  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        setLoading(true);
        const data = await constructionSiteService.getSiteById(siteId);
        setSite(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching site details:', err);
        setError(err.response?.data?.message || 'Failed to load site details');
      } finally {
        setLoading(false);
      }
    };

    if (siteId) {
      fetchSiteData();
    }
  }, [siteId]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreview(fileReader.result as string);
      };
      fileReader.readAsDataURL(selectedFile);
      
      // Clear file error if it exists
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: '' }));
      }
    }
  };

  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors = {
      title: '',
      file: ''
    };
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    if (!file) {
      newErrors.file = 'Please select an image file';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      // Create FormData
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      
      if (captureDate) {
        formData.append('captureDate', captureDate);
      }
      
      // Format tags as comma-separated string as expected by the server
      if (tags.length > 0) {
        formData.append('tags', tags.join(','));
      }
      
      if (file) {
        formData.append('image', file);
      }
      
      // Upload the image
      await droneImageService.uploadImage(siteId, formData);
      
      setSubmitSuccess(true);
      // Reset form after successful upload
      setTitle('');
      setDescription('');
      setCaptureDate(format(new Date(), 'yyyy-MM-dd'));
      setTags([]);
      setFile(null);
      setPreview(null);
      
      // Redirect after a short delay
      setTimeout(() => {
        history.push(`/sites/${siteId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error uploading drone image:', err);
      setSubmitError(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger file input click
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
    <Box 
      className="upload-drone-image-page"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        pt: 4,
        pb: 6
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ 
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => history.push(`/sites/${siteId}`)}
            sx={{ 
              alignSelf: 'flex-start',
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                bgcolor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }
            }}
          >
            Back to Site
          </Button>
          
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Upload Drone Image1
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: 'primary.main' 
              }}
            />
            {site?.name}
          </Typography>
        </Box>

        {submitSuccess && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              animation: 'slideDown 0.3s ease-out',
              '@keyframes slideDown': {
                from: { transform: 'translateY(-20px)', opacity: 0 },
                to: { transform: 'translateY(0)', opacity: 1 }
              }
            }}
          >
            Image uploaded successfully! Redirecting to site details...
          </Alert>
        )}

        {submitError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              animation: 'shake 0.5s ease-in-out',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
              }
            }}
          >
            {submitError}
          </Alert>
        )}

        <Paper 
          sx={{ 
            p: 4,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            bgcolor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)'
            }
          }} 
          component="form" 
          onSubmit={handleSubmit}
        >
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Image Title"
                  fullWidth
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  disabled={submitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)'
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                      }
                    }
                  }}
                />
                
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)'
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                      }
                    }
                  }}
                />
                
                <TextField
                  label="Capture Date"
                  type="date"
                  fullWidth
                  value={captureDate}
                  onChange={(e) => setCaptureDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  disabled={submitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)'
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                      }
                    }
                  }}
                />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    label="Add Tags"
                    fullWidth
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    disabled={submitting}
                    InputProps={{
                      endAdornment: (
                        <Button 
                          onClick={handleAddTag} 
                          disabled={!currentTag.trim() || submitting}
                          sx={{
                            minWidth: 'auto',
                            px: 2,
                            borderRadius: 1.5,
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark'
                            }
                          }}
                        >
                          Add
                        </Button>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)'
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                        }
                      }
                    }}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1,
                    minHeight: '40px',
                    p: tags.length ? 1 : 0,
                    borderRadius: 2,
                    bgcolor: tags.length ? 'rgba(0,0,0,0.02)' : 'transparent'
                  }}>
                    {tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleDeleteTag(tag)}
                        disabled={submitting}
                        sx={{
                          borderRadius: 1.5,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.1)'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  border: '2px dashed',
                  borderColor: errors.file ? 'error.main' : 'primary.main',
                  borderRadius: 4,
                  p: 3,
                  textAlign: 'center',
                  height: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: 'rgba(25, 118, 210, 0.02)',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'rgba(25, 118, 210, 0.05)',
                    transform: 'scale(1.01)'
                  }
                }}
                onClick={handleBrowseClick}
              >
                {preview ? (
                  <Box sx={{ 
                    height: '100%', 
                    width: '100%', 
                    position: 'relative',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={preview} 
                      alt="Preview" 
                      style={{ 
                        height: '100%', 
                        width: '100%', 
                        objectFit: 'cover'
                      }} 
                    />
                    <IconButton 
                      size="small" 
                      sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8,
                        bgcolor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        '&:hover': {
                          bgcolor: 'white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreview(null);
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.4)' },
                          '70%': { boxShadow: '0 0 0 20px rgba(25, 118, 210, 0)' },
                          '100%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)' }
                        }
                      }}
                    >
                      <UploadIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Drop your image here
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      or click to browse your files
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.disabled',
                        mt: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      Supports: JPG, PNG, GIF
                    </Typography>
                  </Box>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={submitting}
                />
              </Box>
              {errors.file && (
                <FormHelperText 
                  error 
                  sx={{ 
                    mt: 1,
                    textAlign: 'center',
                    animation: 'shake 0.5s ease-in-out'
                  }}
                >
                  {errors.file}
                </FormHelperText>
              )}
              {file && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    mt: 1,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}
                >
                  <Box 
                    component="span" 
                    sx={{ 
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'success.main'
                    }}
                  />
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Grid>
          </Grid>
          
          <Box sx={{ 
            mt: 4, 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: 2
          }}>
            <Button 
              variant="outlined" 
              onClick={() => history.push(`/sites/${siteId}`)}
              disabled={submitting}
              sx={{
                borderRadius: 2,
                px: 4,
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.02)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
              disabled={submitting}
              sx={{
                borderRadius: 2,
                px: 4,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&:disabled': {
                  bgcolor: 'rgba(0,0,0,0.12)'
                }
              }}
            >
              {submitting ? 'Uploading...' : 'Upload Image'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default UploadDroneImage; 