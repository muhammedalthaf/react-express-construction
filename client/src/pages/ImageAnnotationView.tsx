import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Box, 
  Typography, 
  Button, 
  Grid, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  CircularProgress,
  Alert,
  Tooltip,
  ListItemSecondaryAction
} from '@mui/material';
import { Stage, Layer, Rect, Circle, Line, Image as KonvaImage, Group, Text, RegularPolygon } from 'react-konva';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as ResetIcon,
  LocationOn as MarkerIcon,
  Construction as ConstructionIcon,
  ArrowBack
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useParams, useHistory } from 'react-router-dom';

// Import services
import droneImageService, { DroneImage } from '../services/droneImageService';
import annotationService, { Annotation } from '../services/annotationService';
import AnnotationDevelopmentForm, { DevelopmentData } from '../components/AnnotationDevelopmentForm';

// Main component
const ImageAnnotationView: React.FC = () => {
  const { id: droneImageId } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const history = useHistory();
  
  // State for the image and annotations
  const [droneImage, setDroneImage] = useState<DroneImage | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for canvas properties
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  
  // State for development form
  const [developmentFormOpen, setDevelopmentFormOpen] = useState(false);
  const [developmentFormError, setDevelopmentFormError] = useState<string | null>(null);
  const [developmentFormLoading, setDevelopmentFormLoading] = useState(false);
  
  // Add this state for image dimensions
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Add this state for the image
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  // Update the loadAnnotations function
  const loadAnnotations = async () => {
    if (!droneImageId) return;
    
    try {
      const data = await annotationService.getAnnotations(droneImageId);
      // Transform the data to match our component's format
      const transformedAnnotations = data.map(annotation => ({
        id: annotation._id,
        type: annotation.type,
        coordinates: annotation.coordinates,
        points: annotation.points,
        label: annotation.label,
        color: annotation.color,
        category: annotation.category,
        droneImageId: annotation.droneImage,
        constructionSiteId: annotation.constructionSite,
        status: annotation.status,
        createdBy: annotation.createdBy,
        lastUpdatedBy: annotation.lastUpdatedBy,
        assignedTo: annotation.assignedTo,
        progressData: annotation.progressData
      })) as Annotation[];
      setAnnotations(transformedAnnotations);
    } catch (err: any) {
      console.error('Failed to load annotations:', err);
    }
  };
  
  // Update the useEffect to use the standalone loadAnnotations function
  useEffect(() => {
    const fetchDroneImage = async () => {
      if (!droneImageId) return;
      
      setIsLoading(true);
      try {
        const imageData = await droneImageService.getImageById(droneImageId);
        setDroneImage(imageData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load drone image');
      } finally {
        setIsLoading(false);
      }
    };

    if (droneImageId) {
      fetchDroneImage();
      loadAnnotations();
    }
  }, [droneImageId]);
  
  // Update the useEffect for image loading
  useEffect(() => {
    if (droneImage?.imageUrl) {
      const img = new window.Image();
      img.src = droneImage.imageUrl;
      img.onload = () => {
        setImage(img);
        setImageDimensions({
          width: img.width,
          height: img.height
        });

        // Calculate container dimensions
        const containerWidth = window.innerWidth * 0.5;
        const containerHeight = window.innerHeight * 0.7;

        // Calculate scale to fit image in container while maintaining aspect ratio
        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        const initialScale = Math.min(scaleX, scaleY);

        // Center the image
        const x = (containerWidth - img.width * initialScale) / 2;
        const y = (containerHeight - img.height * initialScale) / 2;

        // Update state
        setScale(initialScale);
        setStagePos({ x, y });
      };
    }
  }, [droneImage?.imageUrl]);
  
  // Add a resize handler
  useEffect(() => {
    const handleResize = () => {
      if (droneImage && imageDimensions.width > 0) {
        const containerWidth = window.innerWidth * 0.5;
        const containerHeight = window.innerHeight * 0.7;

        const scaleX = containerWidth / imageDimensions.width;
        const scaleY = containerHeight / imageDimensions.height;
        const newScale = Math.min(scaleX, scaleY);

        const x = (containerWidth - imageDimensions.width * newScale) / 2;
        const y = (containerHeight - imageDimensions.height * newScale) / 2;

        setScale(newScale);
        setStagePos({ x, y });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [droneImage, imageDimensions]);
  
  // Handle zoom in/out
  const handleZoom = (direction: 'in' | 'out') => {
    const newScale = direction === 'in' ? scale * 1.1 : scale / 1.1;
    setScale(Math.max(0.1, Math.min(newScale, 3))); // Constrain scale between 0.1 and 3
  };
  
  // Reset zoom and position
  const handleReset = () => {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  };
  
  // Handle click on an annotation
  const handleAnnotationClick = (annotation: Annotation) => {
    setSelectedAnnotation(annotation);
    setDevelopmentFormOpen(true);
  };
  
  // Navigate back to site details
  const handleBack = () => {
    if (droneImage?.constructionSite?._id) {
      history.push(`/sites/${droneImage.constructionSite._id}`);
    } else {
      history.push('/sites');
    }
  };
  
  // Add this new function to handle wheel zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    // Calculate new scale
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    // Determine zoom direction
    const direction = e.evt.deltaY > 0 ? 'out' : 'in';
    const newScale = direction === 'in' ? oldScale * 1.1 : oldScale / 1.1;
    
    // Constrain scale between 0.1 and 3
    const constrainedScale = Math.max(0.1, Math.min(newScale, 3));
    
    // Update scale and position
    setScale(constrainedScale);
    
    // Adjust position to zoom towards mouse pointer
    const newPos = {
      x: pointer.x - mousePointTo.x * constrainedScale,
      y: pointer.y - mousePointTo.y * constrainedScale,
    };
    
    setStagePos(newPos);
  };
  
  // Update the renderAnnotations function
  const renderAnnotations = () => {
    return annotations.map((annotation) => {
      const { id, type, coordinates, points, label, color } = annotation;
      
      // Common text style for all annotations
      const textStyle = {
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#ffffff',
        padding: 4,
        background: color,
        backgroundOpacity: 0.9,
        cornerRadius: 4,
        align: 'center' as const,
        verticalAlign: 'middle' as const,
        offsetX: 0,
        offsetY: 0,
        shadowColor: 'black',
        shadowBlur: 2,
        shadowOpacity: 0.5,
        shadowOffset: { x: 1, y: 1 }
      };
      
      switch (type) {
        case 'rectangle':
          // For rectangles, points is a flat array [x1, y1, x2, y2]
          const [x1, y1, x2, y2] = points || [];
          const rectWidth = Math.abs(x2 - x1);
          const rectHeight = Math.abs(y2 - y1);
          const rectCenterX = Math.min(x1, x2) + rectWidth / 2;
          const rectCenterY = Math.min(y1, y2) + rectHeight / 2;
          
          return (
            <Group key={id}>
              <Rect
                x={Math.min(x1, x2)}
                y={Math.min(y1, y2)}
                width={rectWidth}
                height={rectHeight}
                stroke={color}
                strokeWidth={6}
                fill={`${color}33`}
                onClick={() => handleAnnotationClick(annotation)}
                onTap={() => handleAnnotationClick(annotation)}
              />
              <Text
                x={rectCenterX}
                y={rectCenterY}
                text={label}
                {...textStyle}
              />
            </Group>
          );
        case 'polygon':
          // Calculate center point of polygon
          const polygonPoints = points || [];
          let centerX = 0;
          let centerY = 0;
          let pointCount = 0;
          
          for (let i = 0; i < polygonPoints.length; i += 2) {
            centerX += polygonPoints[i];
            centerY += polygonPoints[i + 1];
            pointCount++;
          }
          
          centerX = centerX / pointCount;
          centerY = centerY / pointCount;
          
          return (
            <Group key={id}>
              <Line
                points={polygonPoints}
                stroke={color}
                strokeWidth={6}
                fill={`${color}33`}
                closed={true}
                onClick={() => handleAnnotationClick(annotation)}
                onTap={() => handleAnnotationClick(annotation)}
                globalCompositeOperation="source-over"
              />
              <Text
                x={centerX}
                y={centerY}
                text={label}
                {...textStyle}
              />
            </Group>
          );
        case 'marker':
          // For markers, coordinates is an array of [x, y] pairs
          const [x, y] = coordinates[0];
          return (
            <Group key={id}>
              <Circle
                x={x}
                y={y}
                radius={5}
                fill={color}
                stroke={color}
                strokeWidth={6}
                onClick={() => handleAnnotationClick(annotation)}
                onTap={() => handleAnnotationClick(annotation)}
              />
              <Text
                x={x + 10}
                y={y - 10}
                text={label}
                {...textStyle}
              />
            </Group>
          );
        default:
          return null;
      }
    });
  };
  
  // Loading state
  if (isLoading && !droneImage) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error && !droneImage) {
    return (
      <Box sx={{ m: 4 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button variant="outlined" onClick={handleBack} sx={{ mt: 2 }}>
          Back to Sites
        </Button>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
        pt: 3,
        pb: 6
      }}
    >
      <Container maxWidth="xl">
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3,
            mb: 3,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Image View
              </Typography>
              {droneImage && (
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
                  {droneImage.title} - {new Date(droneImage.captureDate).toLocaleDateString()}
                  {droneImage.description && ` - ${droneImage.description}`}
                </Typography>
              )}
            </Box>
            <Button 
              variant="outlined" 
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{
                borderRadius: 2,
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
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                animation: 'shake 0.5s ease-in-out',
                '@keyframes shake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                  '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
                }
              }}
            >
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Left Panel - Zoom Controls */}
            <Grid item xs={12} md={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  height: '100%'
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    pb: 1,
                    fontSize: '1rem',
                    borderBottom: '2px solid',
                    borderImage: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%) 1'
                  }}
                >
                  Zoom Controls
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mb: 2,
                  p: 0.5,
                  bgcolor: 'rgba(0,0,0,0.02)',
                  borderRadius: 1
                }}>
                  <Tooltip title="Zoom In">
                    <IconButton 
                      size="small"
                      onClick={() => handleZoom('in')}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      <ZoomInIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Zoom Out">
                    <IconButton 
                      size="small"
                      onClick={() => handleZoom('out')}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      <ZoomOutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reset View">
                    <IconButton 
                      size="small"
                      onClick={handleReset}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      <ResetIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>
            
            {/* Center Panel - Image Canvas */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  height: 'calc(100vh - 200px)', 
                  overflow: 'hidden',
                  borderRadius: 3,
                  bgcolor: '#f8fafc',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 6px 24px rgba(0,0,0,0.12)'
                  }
                }}
              >
                {droneImage && image && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative'
                    }}
                  >
                    <Stage
                      ref={stageRef}
                      width={window.innerWidth * 0.5}
                      height={window.innerHeight * 0.7}
                      onWheel={handleWheel}
                      draggable={true}
                      x={stagePos.x}
                      y={stagePos.y}
                      scaleX={scale}
                      scaleY={scale}
                      onDragEnd={(e) => {
                        setStagePos({ x: e.target.x(), y: e.target.y() });
                      }}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        margin: 0,
                        padding: 0,
                        height: "100%"
                      }}
                    >
                      <Layer>
                        <KonvaImage
                          ref={imageRef}
                          image={image}
                          width={imageDimensions.width}
                          height={imageDimensions.height}
                        />
                        {renderAnnotations()}
                      </Layer>
                    </Stage>

                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        bottom: 16, 
                        right: 16, 
                        bgcolor: 'rgba(255,255,255,0.9)',
                        p: 1,
                        borderRadius: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Zoom: {Math.round(scale * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            {/* Right Panel - Annotations List */}
            <Grid item xs={12} md={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3,
                  borderRadius: 3,
                  bgcolor: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  height: 'calc(100vh - 200px)',
                  overflow: 'auto'
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    pb: 2,
                    borderBottom: '2px solid',
                    borderImage: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%) 1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  Annotations
                  <Typography 
                    component="span" 
                    sx={{ 
                      ml: 1,
                      px: 1.5,
                      py: 0.5,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: 1.5,
                      fontSize: '0.875rem'
                    }}
                  >
                    {annotations.length}
                  </Typography>
                </Typography>

                <List sx={{ mt: 2 }}>
                  {annotations.map((annotation, index) => (
                    <ListItem
                      key={index}
                      button
                      selected={selectedAnnotation === annotation}
                      onClick={() => handleAnnotationClick(annotation)}
                      sx={{
                        mb: 1,
                        border: '1px solid #eee',
                        borderLeft: `4px solid ${annotation.color}`,
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 4,
                          height: '100%',
                          bgcolor: annotation.color,
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          borderRadius: '4px 0 0 4px'
                        }} 
                      />
                      <ListItemText
                        primary={annotation.label}
                        secondary={`Type: ${annotation.type}, Category: ${annotation.category || 'N/A'}`}
                        sx={{ pl: 1 }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          onClick={() => handleAnnotationClick(annotation)}
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              bgcolor: 'rgba(25, 118, 210, 0.1)'
                            }
                          }}
                        >
                          <ConstructionIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  
                  {annotations.length === 0 && (
                    <Box 
                      sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        bgcolor: 'rgba(0,0,0,0.02)',
                        borderRadius: 2,
                        border: '2px dashed',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        No annotations available
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        This image has no annotations yet
                      </Typography>
                    </Box>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Container>
      
      {/* Development Form Dialog */}
      <AnnotationDevelopmentForm
        open={developmentFormOpen}
        onClose={() => setDevelopmentFormOpen(false)}
        annotation={selectedAnnotation}
        onSave={async () => Promise.resolve()}
        isLoading={developmentFormLoading}
        error={developmentFormError}
        readOnly={true}
      />
    </Box>
  );
};

export default ImageAnnotationView; 