const AnnotatedArea = require('../models/AnnotatedArea');
const DroneImage = require('../models/DroneImage');

/**
 * @desc    Get all annotated areas
 * @route   GET /api/annotated-areas
 * @access  Private
 */
const getAllAnnotatedAreas = async (req, res) => {
  try {
    // Filter by drone image or construction site if provided
    const filter = {};
    if (req.query.droneImage) {
      filter.droneImage = req.query.droneImage;
    }
    if (req.query.constructionSite) {
      filter.constructionSite = req.query.constructionSite;
    }
    
    // For non-admin/manager, only show areas from assigned sites
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      filter.constructionSite = { $in: req.user.assignedSites };
    }
    
    // Filter by category if provided
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      // Default sort by creation date
      sort.createdAt = -1;
    }
    
    const annotatedAreas = await AnnotatedArea.find(filter)
      .populate('droneImage', 'title imageUrl captureDate')
      .populate('constructionSite', 'name location')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
      
    // Get total count for pagination
    const totalCount = await AnnotatedArea.countDocuments(filter);
    
    res.json({
      areas: annotatedAreas,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get an annotated area by ID
 * @route   GET /api/annotated-areas/:id
 * @access  Private
 */
const getAnnotatedAreaById = async (req, res) => {
  try {
    const annotatedArea = await AnnotatedArea.findById(req.params.id)
      .populate('droneImage', 'title imageUrl captureDate')
      .populate('constructionSite', 'name location status')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('progressData');
    
    if (!annotatedArea) {
      return res.status(404).json({ message: 'Annotated area not found' });
    }
    
    // Check if user has access to the site
    const siteId = annotatedArea.constructionSite._id;
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'manager' && 
      !req.user.assignedSites.some(id => id.toString() === siteId.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to access this annotated area' });
    }
    
    res.json(annotatedArea);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a new annotated area
 * @route   POST /api/annotated-areas
 * @access  Private
 */
const createAnnotatedArea = async (req, res) => {
  try {
    const { type, coordinates, points, label, color, category, droneImageId, constructionSiteId } = req.body;

    // Extract construction site ID if it's an object
    const siteId = constructionSiteId._id || constructionSiteId;

    // Create the annotation with the UI's format
    const annotation = new AnnotatedArea({
      type,
      coordinates,
      points,
      label,
      color,
      category,
      droneImage: droneImageId,
      constructionSite: siteId,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id,
    });

    await annotation.save();

    // Fetch the populated annotation
    const populatedAnnotation = await AnnotatedArea.findById(annotation._id)
      .populate('droneImage')
      .populate('constructionSite')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('progressData');

    res.status(201).json(populatedAnnotation);
  } catch (error) {
    console.error('Error creating annotated area:', error);
    res.status(500).json({ message: 'Error creating annotated area', error: error.message });
  }
};

/**
 * @desc    Update an annotated area
 * @route   PUT /api/annotated-areas/:id
 * @access  Private
 */
const updateAnnotatedArea = async (req, res) => {
  try {
    const annotatedArea = await AnnotatedArea.findById(req.params.id);
    
    if (!annotatedArea) {
      return res.status(404).json({ message: 'Annotated area not found' });
    }
    
    // Check if user is authorized to update
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'manager' &&
      annotatedArea.createdBy.toString() !== req.user._id.toString() &&
      !annotatedArea.assignedTo.some(id => id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to update this annotated area' });
    }
    
    // Prevent changing drone image and construction site
    delete req.body.droneImage;
    delete req.body.constructionSite;
    
    // Update the fields
    annotatedArea.label = req.body.label;
    annotatedArea.color = req.body.color;
    annotatedArea.category = req.body.category;
    annotatedArea.lastUpdatedBy = req.user._id;
    
    // Save the updated area
    const updatedArea = await annotatedArea.save();
    
    // Populate the related fields
    const populatedArea = await AnnotatedArea.findById(updatedArea._id)
      .populate('droneImage', 'title imageUrl')
      .populate('constructionSite', 'name')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('assignedTo', 'name email')
    
    res.json(populatedArea);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Delete an annotated area
 * @route   DELETE /api/annotated-areas/:id
 * @access  Private
 */
const deleteAnnotatedArea = async (req, res) => {
  try {
    const annotatedArea = await AnnotatedArea.findById(req.params.id);
    
    if (!annotatedArea) {
      return res.status(404).json({ message: 'Annotated area not found' });
    }
    
    // Check if user is authorized to delete
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'manager' &&
      annotatedArea.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this annotated area' });
    }
    
    await annotatedArea.deleteOne();
    
    res.json({ message: 'Annotated area removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all annotated areas for a specific drone image
 * @route   GET /api/drone-images/:imageId/annotated-areas
 * @access  Private
 */
const getImageAnnotatedAreas = async (req, res) => {
  try {
    const imageId = req.params.imageId;
    
    // Check if the image exists
    const droneImage = await DroneImage.findById(imageId);
    if (!droneImage) {
      return res.status(404).json({ message: 'Drone image not found' });
    }
    
    // Get annotated areas
    const areas = await AnnotatedArea.find({ droneImage: imageId })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(areas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get annotated areas with progress data
 * @route   GET /api/annotated-areas/with-progress
 * @access  Private
 */
const getAnnotationsWithProgress = async (req, res) => {
  try {
    // Filter by drone image or construction site if provided
    const filter = {};
    if (req.query.droneImage) {
      filter.droneImage = req.query.droneImage;
    }
    if (req.query.constructionSite) {
      filter.constructionSite = req.query.constructionSite;
    }
    
    // For non-admin/manager, only show areas from assigned sites
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      filter.constructionSite = { $in: req.user.assignedSites };
    }
    
    // Filter by category if provided
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      // Default sort by creation date
      sort.createdAt = -1;
    }
    
    // Retrieve annotated areas with progress data populated
    const annotatedAreas = await AnnotatedArea.find(filter)
      .populate('droneImage', 'title imageUrl captureDate')
      .populate('constructionSite', 'name location')
      .populate('createdBy', 'name email')
      .populate({
        path: 'progressData',
        options: { sort: { date: -1 } },
        populate: {
          path: 'createdBy',
          select: 'name email'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(limit);
      
    // Get total count for pagination
    const totalCount = await AnnotatedArea.countDocuments(filter);
    
    // For each area, calculate the latest progress percentage
    const areasWithProgress = annotatedAreas.map(area => {
      const areaObj = area.toObject();
      
      if (areaObj.progressData && areaObj.progressData.length > 0) {
        // Get the latest progress data (already sorted by date desc)
        const latestProgress = areaObj.progressData[0];
        areaObj.latestProgress = {
          percentage: latestProgress.progressPercentage,
          status: latestProgress.status,
          date: latestProgress.date,
          updatedBy: latestProgress.createdBy
        };
      } else {
        areaObj.latestProgress = {
          percentage: 0,
          status: 'not-started',
          date: null,
          updatedBy: null
        };
      }
      
      return areaObj;
    });
    
    res.json({
      areas: areasWithProgress,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllAnnotatedAreas,
  getAnnotatedAreaById,
  createAnnotatedArea,
  updateAnnotatedArea,
  deleteAnnotatedArea,
  getImageAnnotatedAreas,
  getAnnotationsWithProgress
}; 