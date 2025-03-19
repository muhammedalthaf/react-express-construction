const express = require('express');
const router = express.Router();
const {
  getAllSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  getSiteStats,
  toggleSiteReadyStatus,
  markSiteAsReady
} = require('../controllers/constructionSiteController');
const { protect } = require('../middleware/authMiddleware');

// ... existing routes ...

// Mark site as ready and assign to user


module.exports = router; 