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
  markSiteAsReady,
  updateSiteStatusAndProgress,
  updateSiteStatus,
  updateSiteProgress
} = require('../controllers/constructionSiteController');
const { protect, admin, manager, siteAccess } = require('../middlewares/authMiddleware');
const { getSiteImages } = require('../controllers/droneImageController');

// Get all sites (filtered by user access)
router.get('/', protect, getAllSites);

// Create new site (manager or admin only)
router.post('/', protect, manager, createSite);

// Site specific routes
router.route('/:id')
  .get(protect, siteAccess, getSiteById)
  .put(protect, manager, siteAccess, updateSite)
  .delete(protect, admin, deleteSite);

// Get site statistics
router.get('/:siteId/stats', protect, siteAccess, getSiteStats);

// Toggle site ready status
router.put('/:id/toggle-ready', protect, manager, siteAccess, toggleSiteReadyStatus);

// Get site images
router.get('/:siteId/images', protect, siteAccess, getSiteImages);

router.put('/:id/mark-ready', protect, markSiteAsReady);

// Update site status and progress
router.put('/:id/status-progress', protect, manager, siteAccess, updateSiteStatusAndProgress);

// Update site status
router.put('/:id/status', protect, manager, siteAccess, updateSiteStatus);

// Update site progress
router.put('/:id/progress', protect, manager, siteAccess, updateSiteProgress);

module.exports = router; 