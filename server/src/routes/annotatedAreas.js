const express = require('express');
const router = express.Router();
const { 
  getAllAnnotatedAreas,
  getAnnotatedAreaById,
  createAnnotatedArea,
  updateAnnotatedArea,
  deleteAnnotatedArea,
  getAnnotationsWithProgress,
  getImageAnnotatedAreas
} = require('../controllers/annotatedAreaController');
const {
  getProgressTrend
} = require('../controllers/progressDataController');
const { protect } = require('../middlewares/authMiddleware');

// Get all annotated areas
router.get('/', protect, getAllAnnotatedAreas);

// Get all annotated areas with progress data
router.get('/with-progress', protect, getAnnotationsWithProgress);

// Get annotations for a specific drone image
router.get('/drone-image/:imageId', protect, getImageAnnotatedAreas);

// Create new annotated area
router.post('/', protect, createAnnotatedArea);

// Area specific routes
router.route('/:id')
  .get(protect, getAnnotatedAreaById)
  .put(protect, updateAnnotatedArea)
  .delete(protect, deleteAnnotatedArea);

// Get progress trend for an annotated area
router.get('/:areaId/progress-trend', protect, getProgressTrend);

module.exports = router; 