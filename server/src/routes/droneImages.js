const express = require('express');
const router = express.Router();
const { 
  getAllDroneImages,
  getDroneImageById,
  uploadDroneImage,
  updateDroneImage,
  deleteDroneImage
} = require('../controllers/droneImageController');
const { 
  getImageAnnotatedAreas 
} = require('../controllers/annotatedAreaController');
const { protect, siteAccess } = require('../middlewares/authMiddleware');
const { upload, handleUploadError } = require('../middlewares/uploadMiddleware');

// Get all drone images (filtered by user access)
router.get('/', protect, getAllDroneImages);

// Upload a new drone image
router.post('/:siteId', 
  protect, 
  upload.single('image'), 
  handleUploadError,
  uploadDroneImage
);

// Image specific routes
router.route('/:id')
  .get(protect, getDroneImageById)
  .put(protect, updateDroneImage)
  .delete(protect, deleteDroneImage);

// Get all annotated areas for a specific image
router.get('/:imageId/annotated-areas', protect, getImageAnnotatedAreas);

module.exports = router; 