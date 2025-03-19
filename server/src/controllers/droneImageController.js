const DroneImage = require('../models/DroneImage');
const ConstructionSite = require('../models/ConstructionSite');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Get all drone images
 * @route   GET /api/drone-images
 * @access  Private
 */
const getAllDroneImages = async (req, res) => {
  try {
    // Filter by construction site if provided
    const filter = {};
    if (req.query.site) {
      filter.constructionSite = req.query.site;
    }
    
    // For non-admin/manager, only show images from assigned sites
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      filter.constructionSite = { $in: req.user.assignedSites };
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
      // Default sort by capture date
      sort.captureDate = -1;
    }
    
    const droneImages = await DroneImage.find(filter)
      .populate('constructionSite', 'name location')
      .populate('uploadedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
      
    // Get total count for pagination
    const totalCount = await DroneImage.countDocuments(filter);
    
    res.json({
      images: droneImages,
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
 * @desc    Get a drone image by ID
 * @route   GET /api/drone-images/:id
 * @access  Private
 */
const getDroneImageById = async (req, res) => {
  try {
    const droneImage = await DroneImage.findById(req.params.id)
      .populate('constructionSite', 'name location client status')
      .populate('uploadedBy', 'name email')
      .populate('droneInfo.operator', 'name email');
    
    if (!droneImage) {
      return res.status(404).json({ message: 'Drone image not found' });
    }
    
    // Check if user has access to the site
    const siteId = droneImage.constructionSite._id;
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'manager' && 
      !req.user.assignedSites.some(id => id.toString() === siteId.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to access this drone image' });
    }
    
    res.json(droneImage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Upload a new drone image
 * @route   POST /api/drone-images
 * @access  Private
 */
const uploadDroneImage = async (req, res) => {
  try {
    // Verify the construction site exists
    const siteId = req.params.siteId;
    const site = await ConstructionSite.findById(siteId);
    
    if (!site) {
      // Remove uploaded file if site doesn't exist
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Construction site not found' });
    }
    
    // Create image URL from the uploaded file
    let imageUrl = '';
    let thumbnailUrl = '';
    let fileSize = 0;
    let originalFilename = '';
    
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      imageUrl = `${baseUrl}/uploads/${siteId}/${req.file.filename}`;
      thumbnailUrl = imageUrl; // In a real app, you'd generate a thumbnail
      fileSize = req.file.size;
      originalFilename = req.file.originalname;
    } else {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Create base drone image record
    const droneImageData = {
      title: req.body.title,
      description: req.body.description || '',
      constructionSite: siteId,
      captureDate: req.body.captureDate || new Date(),
      imageUrl,
      thumbnailUrl,
      originalFilename,
      fileSize,
      uploadedBy: req.user._id,
      sector: req.body.sector,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      droneInfo: {
        model: req.body.droneModel,
        serialNumber: req.body.droneSerialNumber,
        operator: req.body.operatorId || req.user._id
      },
      imageType: req.body.imageType || 'rgb'
    };
    
    // Only add coverage field if skip flag is not set and coordinates are provided
    if (req.body.skipCoverage !== 'true') {
      if (req.body.coverageCoordinates) {
        try {
          const coordinates = JSON.parse(req.body.coverageCoordinates);
          droneImageData.coverage = {
            type: 'Polygon',
            coordinates: coordinates
          };
        } catch (e) {
          console.error('Error parsing coverage coordinates:', e);
        }
      } else {
        // Don't include the coverage field if no coordinates are provided
        console.log('Skipping coverage field - no coordinates provided');
      }
    } else {
      console.log('Skipping coverage field as requested');
    }
    
    // Add resolution if provided
    if (req.body.width && req.body.height) {
      droneImageData.resolution = {
        width: req.body.width,
        height: req.body.height
      };
    }
    
    // Add metadata if provided
    if (req.body.metaData) {
      try {
        droneImageData.metaData = JSON.parse(req.body.metaData);
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    }
    
    const droneImage = new DroneImage(droneImageData);
    const savedImage = await droneImage.save();
    
    res.status(201).json(savedImage);
  } catch (error) {
    // Remove uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading drone image:', error);
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Update a drone image
 * @route   PUT /api/drone-images/:id
 * @access  Private
 */
const updateDroneImage = async (req, res) => {
  try {
    const droneImage = await DroneImage.findById(req.params.id);
    
    if (!droneImage) {
      return res.status(404).json({ message: 'Drone image not found' });
    }
    
    // Check if user is authorized to update
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'manager' &&
      droneImage.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to update this drone image' });
    }
    
    // Update basic fields
    const fieldsToUpdate = [
      'title', 'description', 'captureDate', 'sector', 
      'processed', 'processingDetails'
    ];
    
    for (const field of fieldsToUpdate) {
      if (req.body[field] !== undefined) {
        droneImage[field] = req.body[field];
      }
    }
    
    // Update tags if provided
    if (req.body.tags) {
      droneImage.tags = req.body.tags.split(',').map(tag => tag.trim());
    }
    
    // Update drone info if provided
    if (req.body.droneModel || req.body.droneSerialNumber || req.body.operatorId) {
      droneImage.droneInfo = {
        ...droneImage.droneInfo,
        model: req.body.droneModel || droneImage.droneInfo.model,
        serialNumber: req.body.droneSerialNumber || droneImage.droneInfo.serialNumber,
        operator: req.body.operatorId || droneImage.droneInfo.operator
      };
    }
    
    // Update metadata if provided
    if (req.body.metaData) {
      try {
        droneImage.metaData = {
          ...droneImage.metaData,
          ...JSON.parse(req.body.metaData)
        };
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    }
    
    const updatedImage = await droneImage.save();
    
    res.json(updatedImage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Delete a drone image
 * @route   DELETE /api/drone-images/:id
 * @access  Private
 */
const deleteDroneImage = async (req, res) => {
  try {
    const droneImage = await DroneImage.findById(req.params.id);
    
    if (!droneImage) {
      return res.status(404).json({ message: 'Drone image not found' });
    }
    
    // Check if user is authorized to delete
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'manager' &&
      droneImage.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this drone image' });
    }
    
    // Delete the physical file
    const uploadDir = path.join(__dirname, '../../', process.env.UPLOAD_PATH || 'uploads');
    const siteId = droneImage.constructionSite.toString();
    const filename = droneImage.imageUrl.split('/').pop();
    const filePath = path.join(uploadDir, siteId, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete the record
    await droneImage.deleteOne();
    
    res.json({ message: 'Drone image removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get images for a specific construction site
 * @route   GET /api/sites/:siteId/images
 * @access  Private
 */
const getSiteImages = async (req, res) => {
  try {
    const siteId = req.params.siteId;
    
    // Check if the site exists
    const site = await ConstructionSite.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Construction site not found' });
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
      sort.captureDate = -1;
    }
    
    // Get images
    const images = await DroneImage.find({ constructionSite: siteId })
      .populate('uploadedBy', 'name email')
      .sort(sort)
      // .skip(skip)
      // .limit(limit);
      
    // Get total count for pagination
    // const totalCount = await DroneImage.countDocuments({ constructionSite: siteId });
    
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllDroneImages,
  getDroneImageById,
  uploadDroneImage,
  updateDroneImage,
  deleteDroneImage,
  getSiteImages
}; 