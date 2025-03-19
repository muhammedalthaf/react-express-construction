import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Box, 
  Typography, 
  Button, 
  Divider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  IconButton, 
  Grid, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  Tooltip,
  CircularProgress,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import { Stage, Layer, Rect, Circle, Line, Image as KonvaImage, Group, Text } from 'react-konva';
import Konva from 'konva';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Undo as UndoIcon,
  Refresh as ResetIcon,
  AddBox as AddBoxIcon,
  PentagonOutlined as PolygonIcon,
  RadioButtonUnchecked as CircleIcon,
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
import progressDataService from '../services/progressDataService';
import AnnotationDevelopmentForm, { DevelopmentData } from '../components/AnnotationDevelopmentForm';

// Main component
const ImageAnnotation: React.FC = () => {
  const { id: droneImageId } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const history = useHistory();
  
  // State for the image and annotations
  const [droneImage, setDroneImage] = useState<DroneImage | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  
  // State for the drawing tools
  const [tool, setTool] = useState<'rectangle' | 'polygon' | 'point' | 'select' | null>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  
  // State for form inputs
  const [categoryInput, setCategoryInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [color, setColor] = useState('#FF5722');
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
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
  
  // Add this state for stage dimensions
  const [stageDimensions, setStageDimensions] = useState({ width: 0, height: 0 });
  
  // Add this state for the image
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  // Categories (these could be loaded from an API)
  const categories = [
    'Structural',
    'Electrical',
    'Plumbing',
    'HVAC',
    'Foundation',
    'Exterior',
    'Interior',
    'Landscape',
    'Other'
  ];
  
  // Colors for annotations
  const colorOptions = [
    '#FF5722', // Orange
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#FFEB3B', // Yellow
    '#795548', // Brown
  ];
  
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
  
  // Clear success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);
  
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
  
  // Handle tool selection
  const handleToolChange = (newTool: 'rectangle' | 'polygon' | 'point' | 'select') => {
    setTool(newTool);
    setCurrentPoints([]);
    setIsDrawing(false);
    setSelectedAnnotation(null);
  };
  
  // Handle stage mouse down
  const handleMouseDown = (e: any) => {
    if (!tool || tool === 'select' || !droneImage) return;
    
    // Get mouse position relative to the stage
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const scale = stage.scaleX();
    
    // Adjust for stage position and scale
    const x = (point.x - stage.x()) / scale;
    const y = (point.y - stage.y()) / scale;
    
    if (tool === 'point') {
      // Create a marker at this position
      const newAnnotation: Annotation = {
        type: 'marker',
        coordinates: [[x, y]],
        points: [], // Add empty points array for consistency
        label: labelInput || 'Marker',
        color,
        droneImageId: droneImage._id,
        constructionSiteId: droneImage.constructionSite
      };
      
      setAnnotations([...annotations, newAnnotation]);
      // Automatically select the newly created annotation
      setSelectedAnnotation(newAnnotation);
      setCategoryInput(newAnnotation.category || '');
      setLabelInput(newAnnotation.label || '');
      setColor(newAnnotation.color || '#FF5722');
      setCurrentPoints([]);
      setTool('select'); // Switch back to select tool after placing marker
    } else if (tool === 'rectangle') {
      setIsDrawing(true);
      setCurrentPoints([x, y, x, y]); // Init with start and current point identical
    } else if (tool === 'polygon') {
      if (!isDrawing) {
        // Start drawing a polygon
        setIsDrawing(true);
        setCurrentPoints([x, y]);
      } else {
        // Continue drawing polygon - add the new point
        setCurrentPoints([...currentPoints, x, y]);
      }
    }
  };
  
  // Handle stage mouse move
  const handleMouseMove = (e: any) => {
    if (!isDrawing || !tool || tool === 'select' || tool === 'point') return;
    
    // Get mouse position relative to the stage
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const scale = stage.scaleX();
    
    // Adjust for stage position and scale
    const x = (point.x - stage.x()) / scale;
    const y = (point.y - stage.y()) / scale;
    
    if (tool === 'rectangle') {
      // Update the end point of the rectangle
      setCurrentPoints([currentPoints[0], currentPoints[1], x, y]);
    }
  };
  
  // Handle stage mouse up
  const handleMouseUp = (e: any) => {
    if (!isDrawing || !tool || tool === 'select' || tool === 'point' || !droneImage) return;
    
    if (tool === 'rectangle') {
      // Complete the rectangle
      const [x1, y1, x2, y2] = currentPoints;
      
      // Only create if it's a valid rectangle (has area)
      if (Math.abs(x2 - x1) > 5 && Math.abs(y2 - y1) > 5) {
        const newAnnotation: Annotation = {
          type: 'rectangle',
          points: [x1, y1, x2, y2], // Store as flat array
          coordinates: [[x1, y1], [x2, y2]], // Store as coordinate pairs
          label: labelInput || 'Rectangle',
          color,
          droneImageId: droneImage._id,
          constructionSiteId: droneImage.constructionSite
        };
        
        setAnnotations([...annotations, newAnnotation]);
        // Automatically select the newly created annotation
        setSelectedAnnotation(newAnnotation);
        setCategoryInput(newAnnotation.category || '');
        setLabelInput(newAnnotation.label || '');
        setColor(newAnnotation.color || '#FF5722');
      }
      
      setIsDrawing(false);
      setCurrentPoints([]);
      setTool('select'); // Switch back to select tool after drawing
    }
  };
  
  // Handle double click to complete polygon
  const handleDblClick = (e: any) => {
    if (!isDrawing || tool !== 'polygon' || !droneImage) return;
    
    // Ensure polygon has at least 3 points (6 coordinates)
    if (currentPoints.length >= 6) {
      const newAnnotation: Annotation = {
        type: 'polygon',
        points: currentPoints,
        coordinates: currentPoints.reduce((acc: number[][], curr: number, i: number) => {
          if (i % 2 === 0) {
            acc.push([curr, currentPoints[i + 1]]);
          }
          return acc;
        }, []),
        label: labelInput || 'Polygon',
        color,
        droneImageId: droneImage._id,
        constructionSiteId: droneImage.constructionSite
      };
      
      setAnnotations([...annotations, newAnnotation]);
      // Automatically select the newly created annotation
      setSelectedAnnotation(newAnnotation);
      setCategoryInput(newAnnotation.category || '');
      setLabelInput(newAnnotation.label || '');
      setColor(newAnnotation.color || '#FF5722');
    }
    
    setIsDrawing(false);
    setCurrentPoints([]);
    setTool('select'); // Switch back to select tool after completing the polygon
  };
  
  // Handle click on an annotation
  const handleAnnotationClick = (annotation: Annotation) => {
    if (tool === 'select') {
      setSelectedAnnotation(annotation);
      setCategoryInput(annotation.category || '');
      setLabelInput(annotation.label || '');
      setColor(annotation.color || '#FF5722');
    }
  };
  
  // Save the selected annotation after editing
  const handleUpdateAnnotation = () => {
    if (!selectedAnnotation) return;
    
    // Update the annotation in the local state
    const updatedAnnotations = annotations.map(ann => {
      if (ann === selectedAnnotation) {
        return {
          ...ann,
          category: categoryInput,
          label: labelInput,
          color,
        };
      }
      return ann;
    });
    
    setAnnotations(updatedAnnotations);
    setSelectedAnnotation(null);
    setCategoryInput('');
    setLabelInput('');
    setSaveSuccess(true);
  };
  
  // Delete the selected annotation
  const handleDeleteAnnotation = async () => {
    if (!selectedAnnotation) return;
    
    // If the annotation has an ID (exists in the database), delete it
    if (selectedAnnotation.id) {
      try {
        setIsLoading(true);
        await annotationService.deleteAnnotation(selectedAnnotation.id);
        
        const updatedAnnotations = annotations.filter(ann => ann !== selectedAnnotation);
        setAnnotations(updatedAnnotations);
        setSelectedAnnotation(null);
        setCategoryInput('');
        setLabelInput('');
        setSaveSuccess(true);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete annotation');
      } finally {
        setIsLoading(false);
      }
    } else {
      // If it's a new annotation that hasn't been saved yet, just remove it from the state
      const updatedAnnotations = annotations.filter(ann => ann !== selectedAnnotation);
      setAnnotations(updatedAnnotations);
      setSelectedAnnotation(null);
      setCategoryInput('');
      setLabelInput('');
    }
  };
  
  // Save all annotations to the backend
  const saveAnnotations = async () => {
    if (!droneImage) return;
    
    setIsLoading(true);
    try {
      // Create a deep copy to make sure we don't affect state directly during saves
      const annotationsToSave = [...annotations];
      
      // Process each annotation
      for (const annotation of annotationsToSave) {
        if (!annotation.id) {
          // It's a new annotation
          await annotationService.createAnnotation(annotation);
        } else {
          // It's an existing annotation
          await annotationService.updateAnnotation(annotation.id, annotation);
        }
      }
      
      // Fetch the updated annotations with their IDs
      loadAnnotations()
      setSaveSuccess(true);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save annotations');
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  // Category and label selection handlers
  const handleCategoryChange = (e: SelectChangeEvent) => {
    setCategoryInput(e.target.value);
  };
  
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabelInput(e.target.value);
  };
  
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };
  
  // Handle opening the development form
  const handleOpenDevelopmentForm = () => {
    if (!selectedAnnotation) return;
    
    // Check if the annotation has an ID (is saved in the database)
    if (!selectedAnnotation.id) {
      setError('Please save the annotation first before adding development data');
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }
    
    setDevelopmentFormOpen(true);
  };
  
  // Handle closing the development form
  const handleCloseDevelopmentForm = () => {
    setDevelopmentFormOpen(false);
    setDevelopmentFormError(null);
  };
  
  // Handle saving development data
  const handleSaveDevelopmentData = async (annotationId: string, developmentData: DevelopmentData) => {
    if (!droneImage) return;
    
    setDevelopmentFormLoading(true);
    setDevelopmentFormError(null);
    
    try {
      await progressDataService.saveProgressData(
        annotationId,
        droneImage._id,
        droneImage.constructionSite,
        developmentData
      );
      
      // Refresh annotations to show updated progress
      await loadAnnotations();
      
      // Show success message
      setSaveSuccess(true);
      
      setDevelopmentFormOpen(false);
    } catch (error) {
      console.error('Error saving progress data:', error);
      setDevelopmentFormError('Failed to save progress data');
    } finally {
      setDevelopmentFormLoading(false);
    }
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
  
  // Update the renderCurrentShape function
  const renderCurrentShape = () => {
    if (!isDrawing || !currentPoints.length) return null;
    
    if (tool === 'rectangle') {
      const [x1, y1, x2, y2] = currentPoints;
      return (
        <Rect
          x={Math.min(x1, x2)}
          y={Math.min(y1, y2)}
          width={Math.abs(x2 - x1)}
          height={Math.abs(y2 - y1)}
          stroke={color}
          strokeWidth={6}
          dash={[10, 5]}
          fill={`${color}33`}
        />
      );
    } else if (tool === 'polygon' && currentPoints.length >= 4) {
      return (
        <Line
          points={currentPoints}
          stroke={color}
          strokeWidth={6}
          dash={[10, 5]}
          fill={`${color}33`}
          closed={false}
        />
      );
    }
    
    return null;
  };
  
  // Navigate back to site details
  const handleBack = () => {
    console.log("droneImage", droneImage)
    if (droneImage?.constructionSite?._id) {
      history.push(`/sites/${droneImage.constructionSite._id }`);
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
                Image Annotation Tool
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

          {saveSuccess && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                animation: 'slideDown 0.3s ease-out',
                '@keyframes slideDown': {
                  from: { transform: 'translateY(-20px)', opacity: 0 },
                  to: { transform: 'translateY(0)', opacity: 1 }
                }
              }}
            >
              Annotations saved successfully
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Left Panel - Tools and Properties */}
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
                  Drawing Tools
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mb: 2,
                  p: 0.5,
                  bgcolor: 'rgba(0,0,0,0.02)',
                  borderRadius: 1
                }}>
                  <Tooltip title="Select">
                    <IconButton 
                      size="small"
                      color={tool === 'select' ? 'primary' : 'default'} 
                      onClick={() => handleToolChange('select')}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rectangle">
                    <IconButton 
                      size="small"
                      color={tool === 'rectangle' ? 'primary' : 'default'} 
                      onClick={() => handleToolChange('rectangle')}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      <AddBoxIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Polygon">
                    <IconButton 
                      size="small"
                      color={tool === 'polygon' ? 'primary' : 'default'} 
                      onClick={() => handleToolChange('polygon')}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      <PolygonIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Point Marker">
                    <IconButton 
                      size="small"
                      color={tool === 'point' ? 'primary' : 'default'} 
                      onClick={() => handleToolChange('point')}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      <MarkerIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Divider sx={{ my: 2 }} />

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

                <Divider sx={{ my: 2 }} />

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
                  Properties
                </Typography>

                <FormControl 
                  fullWidth 
                  size="small"
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)'
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                      }
                    }
                  }}
                >
                  <InputLabel id="category-label">Category</InputLabel>
                  <Select
                    labelId="category-label"
                    value={categoryInput}
                    label="Category"
                    onChange={handleCategoryChange}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Label"
                  value={labelInput}
                  onChange={handleLabelChange}
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
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

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1, color: 'text.secondary' }}>
                  Color
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 0.5,
                  mb: 2,
                  p: 0.5,
                  bgcolor: 'rgba(0,0,0,0.02)',
                  borderRadius: 1
                }}>
                  {colorOptions.map((c) => (
                    <Box
                      key={c}
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: c,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: c === color ? '2px solid #fff' : '1px solid rgba(0,0,0,0.1)',
                        boxShadow: c === color ? '0 0 0 2px #1a237e' : 'none',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                        }
                      }}
                      onClick={() => handleColorChange(c)}
                    />
                  ))}
                </Box>

                {selectedAnnotation && (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SaveIcon fontSize="small" />}
                      onClick={handleUpdateAnnotation}
                      sx={{
                        borderRadius: 1,
                        bgcolor: 'primary.main',
                        boxShadow: '0 4px 12px rgba(26, 35, 126, 0.2)',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(26, 35, 126, 0.3)'
                        }
                      }}
                    >
                      Update Annotation
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      startIcon={<ConstructionIcon fontSize="small" />}
                      onClick={handleOpenDevelopmentForm}
                      sx={{
                        borderRadius: 1,
                        boxShadow: '0 4px 12px rgba(156, 39, 176, 0.2)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(156, 39, 176, 0.3)'
                        }
                      }}
                    >
                      Add Development Data
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon fontSize="small" />}
                      onClick={handleDeleteAnnotation}
                      sx={{
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'error.main',
                          color: 'white',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Delete Annotation
                    </Button>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon fontSize="small" />}
                  onClick={saveAnnotations}
                  fullWidth
                  disabled={isLoading}
                  sx={{
                    borderRadius: 1,
                    p: 1,
                    bgcolor: 'success.main',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                    '&:hover': {
                      bgcolor: 'success.dark',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(76, 175, 80, 0.3)'
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  {isLoading ? 'Saving...' : 'Save All Annotations'}
                </Button>
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
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onDblClick={handleDblClick}
                      onWheel={handleWheel}
                      draggable={tool === 'select'}
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
                        height:"100%"
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
                        {renderCurrentShape()}
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

                    {tool === 'polygon' && isDrawing && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          bottom: 16, 
                          left: 16, 
                          bgcolor: 'rgba(255,255,255,0.9)',
                          p: 1,
                          borderRadius: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Double click to complete polygon
                        </Typography>
                      </Box>
                    )}
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
                          <EditIcon fontSize="small" />
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
                        No annotations yet
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Use the drawing tools to create annotations
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
        onClose={handleCloseDevelopmentForm}
        annotation={selectedAnnotation}
        onSave={handleSaveDevelopmentData}
        isLoading={developmentFormLoading}
        error={developmentFormError}
      />
    </Box>
  );
};

export default ImageAnnotation; 