import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  CardActions,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { DroneImage } from '../services/droneImageService';

interface DroneImageCardProps {
  droneImage: DroneImage;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  showSiteInfo?: boolean;
}

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    return 'Unknown date';
  }
};

const DroneImageCard: React.FC<DroneImageCardProps> = ({ droneImage, onDelete, onView, showSiteInfo = false }) => {
  const history = useHistory();
  
  const handleAnnotate = () => {
    history.push(`/annotate/${droneImage._id}`);
  };
  
  const handleView = () => {
    if (onView) {
      onView(droneImage._id);
    } else {
      history.push(`/drone-images/${droneImage._id}`);
    }
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(droneImage._id);
    }
  };
  
  const isProcessed = droneImage.isProcessed;
  
  return (
    <Card 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }}
    >
      <CardActionArea onClick={handleView} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <CardMedia
          component="img"
          height="160"
          image={droneImage.imageUrl}
          alt={droneImage.title || 'Drone Image'}
          sx={{ 
            objectFit: 'cover',
            backgroundColor: '#f5f5f5' 
          }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div" noWrap>
            {droneImage.title || 'Untitled Image'}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {formatDate(droneImage.captureDate)}
            </Typography>
            
            <Chip 
              label={isProcessed ? 'Processed' : 'Processing'} 
              color={isProcessed ? 'primary' : 'default'} 
              size="small"
              variant="outlined"
            />
          </Box>
          
          {droneImage.description && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {droneImage.description}
            </Typography>
          )}
          
          {showSiteInfo && droneImage.constructionSite && (
            <Typography variant="body2" color="text.secondary">
              Site ID: {droneImage.constructionSite}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
      
      <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
        <Box>
          <IconButton size="small" onClick={handleView} aria-label="view">
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleAnnotate} aria-label="annotate">
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {onDelete && (
          <IconButton size="small" onClick={handleDelete} aria-label="delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};

export default DroneImageCard; 