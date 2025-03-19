const ConstructionSite = require('../models/ConstructionSite');
const User = require('../models/User');

/**
 * @desc    Get all construction sites
 * @route   GET /api/sites
 * @access  Private
 */
const getAllSites = async (req, res) => {
  try {
    // For admin and manager, get all sites
    // For other users, only get assigned sites and ready sites
    let query = {};
    
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // Regular users can only see sites they're assigned to
      // OR sites marked as ready for viewing
      query = { 
        $and: [
          { _id: { $in: req.user.assignedSites } },
          { isReadyForViewing: true }
        ] 
      };
    }
    
    // Filter by ready status if specified
    if (req.query.ready === 'true') {
      query.isReadyForViewing = true;
    } else if (req.query.ready === 'false') {
      query.isReadyForViewing = false;
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const sites = await ConstructionSite.find(query)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('team.user', 'name email role');
    
    res.json(sites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get a construction site by ID
 * @route   GET /api/sites/:id
 * @access  Private
 */
const getSiteById = async (req, res) => {
  try {
    const site = await ConstructionSite.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('team.user', 'name email role')
      .populate('droneImages');
    
    if (!site) {
      return res.status(404).json({ message: 'Construction site not found' });
    }
    
    // Check if user has access
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'manager' && 
      !req.user.assignedSites.includes(site._id)
    ) {
      return res.status(403).json({ message: 'Not authorized to access this site' });
    }
    
    res.json(site);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a new construction site
 * @route   POST /api/sites
 * @access  Private/Manager
 */
const createSite = async (req, res) => {
  try {
    const site = new ConstructionSite({
      ...req.body,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id
    });
    
    const createdSite = await site.save();
    
    // // Add site to team members' assignedSites
    // if (req.body.team && req.body.team.length > 0) {
    //   const teamMemberIds = req.body.team.map(member => member.user);
    //   await User.updateMany(
    //     { _id: { $in: teamMemberIds } },
    //     { $addToSet: { assignedSites: createdSite._id } }
    //   );
    // }
    
    res.status(201).json(createdSite);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Update a construction site
 * @route   PUT /api/sites/:id
 * @access  Private/Manager
 */
const updateSite = async (req, res) => {
  try {
    const site = await ConstructionSite.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Construction site not found' });
    }
    
    // Update site fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'createdBy') { // Prevent changing the creator
        site[key] = req.body[key];
      }
    });
    
    // Update lastUpdatedBy
    site.lastUpdatedBy = req.user._id;
    
    const updatedSite = await site.save();
    
    
    res.json(updatedSite);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Delete a construction site
 * @route   DELETE /api/sites/:id
 * @access  Private/Admin
 */
const deleteSite = async (req, res) => {
  try {
    const site = await ConstructionSite.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Construction site not found' });
    }
    
    // Remove site from all users' assignedSites
    await User.updateMany(
      { assignedSites: site._id },
      { $pull: { assignedSites: site._id } }
    );
    
    await site.deleteOne();
    res.json({ message: 'Construction site removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get site statistics
 * @route   GET /api/sites/:id/stats
 * @access  Private
 */
const getSiteStats = async (req, res) => {
  try {
    const site = await ConstructionSite.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Construction site not found' });
    }
    
    // Aggregate data for statistics
    // This is a placeholder for actual aggregation logic
    const stats = {
      siteId: site._id,
      siteName: site.name,
      progress: site.progress,
      timeElapsed: {
        days: Math.floor((new Date() - new Date(site.startDate)) / (1000 * 60 * 60 * 24)),
        percentage: site.expectedEndDate ? 
          Math.floor(((new Date() - new Date(site.startDate)) / (new Date(site.expectedEndDate) - new Date(site.startDate))) * 100) : 0
      },
      timeRemaining: {
        days: site.expectedEndDate ? 
          Math.floor((new Date(site.expectedEndDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0
      },
      budget: {
        estimated: site.budget.estimated,
        actual: site.budget.actual,
        variance: site.budget.actual ? site.budget.estimated - site.budget.actual : 0,
        variancePercentage: site.budget.actual && site.budget.estimated ? 
          Math.floor(((site.budget.estimated - site.budget.actual) / site.budget.estimated) * 100) : 0
      },
      sectorStats: site.sectors.map(sector => ({
        name: sector.name,
        status: sector.status
      }))
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Mark a construction site as ready/not ready for viewing
 * @route   PUT /api/sites/:id/toggle-ready
 * @access  Private/Manager
 */
const toggleSiteReadyStatus = async (req, res) => {
  try {
    const site = await ConstructionSite.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Construction site not found' });
    }
    
    // Toggle the ready status
    site.isReadyForViewing = !site.isReadyForViewing;
    site.lastUpdatedBy = req.user._id;
    
    const updatedSite = await site.save();
    
    res.json({
      message: `Site is now ${updatedSite.isReadyForViewing ? 'ready' : 'not ready'} for viewing`,
      isReadyForViewing: updatedSite.isReadyForViewing
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Mark site as ready and assign to user
 * @route   PUT /api/sites/:id/mark-ready
 * @access  Private
 */
const markSiteAsReady = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const siteId = req.params.id;

    // Find the site
    const site = await ConstructionSite.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Construction site not found' });
    }

    // Find the user
    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify user has the correct role
    if (user.role !== 'user') {
      return res.status(400).json({ message: 'Can only assign to users with role "user"' });
    }

    // Update the site
    site.isReadyForViewing = true;
    site.lastUpdatedBy = req.user._id;
    await site.save();

    // Update the user's assignedSites array
    if (!user.assignedSites.includes(siteId)) {
      user.assignedSites.push(siteId);
      await user.save();
    }

    // Populate the updated site with user details
    const updatedSite = await ConstructionSite.findById(siteId)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    res.json(updatedSite);
  } catch (error) {
    console.error('Error marking site as ready:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update site status and progress simultaneously
 * @route   PATCH /api/sites/:id/status-progress
 * @access  Private/Manager
 */
const updateSiteStatusAndProgress = async (req, res) => {
  try {
    const { status, progress } = req.body;

    // Validate progress value
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be between 0 and 100' });
    }

    // Validate status value
    const validStatuses = ['not-started', 'in-progress', 'completed', 'delayed', 'planning', 'on-hold', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const site = await ConstructionSite.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Construction site not found' });
    }

    // Update both status and progress
    site.status = status;
    site.progress = progress;
    site.lastUpdatedBy = req.user._id;

    const updatedSite = await site.save();

    // Return the updated site with populated fields
    const populatedSite = await ConstructionSite.findById(updatedSite._id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('team.user', 'name email role');

    res.json(populatedSite);
  } catch (error) {
    console.error('Error updating site status and progress:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update site status
 * @route   PATCH /api/sites/:id/status
 * @access  Private/Manager
 */
const updateSiteStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status value
    const validStatuses = ['not-started', 'in-progress', 'completed', 'delayed', 'planning', 'on-hold', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const site = await ConstructionSite.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Construction site not found' });
    }

    // Update status
    site.status = status;
    site.lastUpdatedBy = req.user._id;

    const updatedSite = await site.save();

    // Return the updated site with populated fields
    const populatedSite = await ConstructionSite.findById(updatedSite._id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('team.user', 'name email role');

    res.json(populatedSite);
  } catch (error) {
    console.error('Error updating site status:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update site progress
 * @route   PATCH /api/sites/:id/progress
 * @access  Private/Manager
 */
const updateSiteProgress = async (req, res) => {
  try {
    const { progress } = req.body;

    // Validate progress value
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be between 0 and 100' });
    }

    const site = await ConstructionSite.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({ message: 'Construction site not found' });
    }

    // Update progress
    site.progress = progress;
    site.lastUpdatedBy = req.user._id;

    const updatedSite = await site.save();

    // Return the updated site with populated fields
    const populatedSite = await ConstructionSite.findById(updatedSite._id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('team.user', 'name email role');

    res.json(populatedSite);
  } catch (error) {
    console.error('Error updating site progress:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
}; 