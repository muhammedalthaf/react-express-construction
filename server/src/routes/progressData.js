const express = require('express');
const router = express.Router();
const { 
  getAllProgressData,
  getProgressDataById,
  createProgressData,
  updateProgressData,
  deleteProgressData
} = require('../controllers/progressDataController');
const { protect } = require('../middlewares/authMiddleware');

// Get all progress data
router.get('/annotation', protect, getAllProgressData);

// Create new progress data
router.post('/', protect, createProgressData);

// Progress data specific routes
router.route('/:id')
  .get(protect, getProgressDataById)
  .put(protect, updateProgressData)
  .delete(protect, deleteProgressData);

module.exports = router; 