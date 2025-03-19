const ProgressData = require('../models/ProgressData');
const AnnotatedArea = require('../models/AnnotatedArea');
const ConstructionSite = require('../models/ConstructionSite');

/**
 * @desc    Get all progress data
 * @route   GET /api/progress-data
 * @access  Private
 */
const getAllProgressData = async (req, res) => {
  try {
    // Filter by annotated area, drone image, or construction site if provided
    const filter = {};
    if (req.query.annotationId) {
      filter.annotatedArea = req.query.annotationId;
    }
    
    // For non-admin/manager, only show progress data from assigned sites
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      filter.constructionSite = { $in: req.user.assignedSites };
    }
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filter.date = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filter.date = { $lte: new Date(req.query.endDate) };
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
      // Default sort by date
      sort.date = -1;
    }
    
    const progressData = await ProgressData.find(filter)
      .populate('annotatedArea', 'title category')
      .populate('droneImage', 'title imageUrl captureDate')
      .populate('constructionSite', 'name location')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('issues.reportedBy', 'name email')
      .populate('issues.assignedTo', 'name email')
      .populate('nextSteps.assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
      
    // Get total count for pagination
    const totalCount = await ProgressData.countDocuments(filter);
    
    res.json({
      progressData,
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
 * @desc    Get progress data by ID
 * @route   GET /api/progress-data/:id
 * @access  Private
 */
const getProgressDataById = async (req, res) => {
  try {
    const progressData = await ProgressData.findById(req.params.id)
      .populate('annotatedArea', 'title category geometry')
      .populate('droneImage', 'title imageUrl captureDate')
      .populate('constructionSite', 'name location status')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('issues.reportedBy', 'name email')
      .populate('issues.assignedTo', 'name email')
      .populate('nextSteps.assignedTo', 'name email');
    
    if (!progressData) {
      return res.status(404).json({ message: 'Progress data not found' });
    }
    
    // Check if user has access to the site
    const siteId = progressData.constructionSite._id;
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'manager' && 
      !req.user.assignedSites.some(id => id.toString() === siteId.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to access this progress data' });
    }
    
    res.json(progressData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create new progress data
 * @route   POST /api/progress-data
 * @access  Private
 */
const createProgressData = async (req, res) => {
  try {
    const { annotationId, droneImageId, constructionSite, constructionSiteId, workType, progressPercentage, startDate, completionDate, notes, status } = req.body;

    // Extract the actual construction site ID from the nested object
    let siteId = constructionSite?._id || constructionSiteId;

    // Verify the annotated area exists
    const annotatedArea = await AnnotatedArea.findById(annotationId)
      .populate('droneImage');

    if (!annotatedArea) {
      return res.status(404).json({ message: 'Annotated area not found' });
    }
    
    if(!siteId){
      siteId = annotatedArea.constructionSite?._id  || annotatedArea.constructionSiteId
    }

    // Check if user has access to the site
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'manager' && 
      !req.user.assignedSites.some(id => id.toString() === siteId.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to add progress data to this site' });
    }
    
    // Validate required fields
    if (progressPercentage === undefined || progressPercentage === null) {
      return res.status(400).json({ message: 'Progress percentage is required' });
    }
    
    if (progressPercentage < 0 || progressPercentage > 100) {
      return res.status(400).json({ message: 'Progress percentage must be between 0 and 100' });
    }
    
    // Check for existing progress data
    const existingData = await ProgressData.findOne({
      annotatedArea: annotationId
    });
    
    // Map the status to valid enum values
    let validStatus = 'not-started';
    if (status) {
      switch (status.toLowerCase()) {
        case 'inprogress':
        case 'in_progress':
          validStatus = 'in-progress';
          break;
        case 'completed':
          validStatus = 'completed';
          break;
        case 'delayed':
          validStatus = 'delayed';
          break;
        case 'notstarted':
        case 'not_started':
          validStatus = 'not-started';
          break;
        default:
          validStatus = 'not-started';
      }
    } else if (progressPercentage === 100) {
      validStatus = 'completed';
    } else if (progressPercentage > 0) {
      validStatus = 'in-progress';
    }

    let progressData;
    if (existingData) {
      // Store the previous value before updating
      existingData.previousValue = {
        percentage: existingData.progressPercentage,
        date: existingData.date,
        status: existingData.status
      };

      // Update the existing data
      existingData.progressPercentage = progressPercentage;
      existingData.startDate = startDate || existingData.startDate;
      existingData.completionDate = completionDate;
      existingData.notes = notes;
      existingData.status = validStatus;
      existingData.workType = workType;
      existingData.lastUpdatedBy = req.user._id;

      progressData = await existingData.save();
    } else {
      // Create new progress data
      progressData = new ProgressData({
        annotatedArea: annotationId,
        droneImage: droneImageId,
        constructionSite: siteId,
        workType,
        progressPercentage,
        startDate: startDate || new Date(),
        completionDate,
        notes,
        status: validStatus,
        createdBy: req.user._id,
        lastUpdatedBy: req.user._id
      });
      
      progressData = await progressData.save();
    }
    
    // Update the construction site's overall progress
    const updateSiteFlag = req.body.updateSiteProgress !== false; // Default to true
    if (updateSiteFlag) {
      await updateSiteProgress(siteId);
    }
    
    // Populate related fields
    const populatedProgressData = await ProgressData.findById(progressData._id)
      .populate('annotatedArea', 'title category geometry')
      .populate('droneImage', 'title imageUrl')
      .populate('constructionSite', 'name')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');
    
    res.status(201).json(populatedProgressData);
  } catch (error) {
    console.error('Error creating/updating progress data:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors // Include validation error details
    });
  }
};

/**
 * @desc    Update progress data
 * @route   PUT /api/progress-data/:id
 * @access  Private
 */
const updateProgressData = async (req, res) => {
  try {
    const progressData = await ProgressData.findById(req.params.id);
    
    if (!progressData) {
      return res.status(404).json({ message: 'Progress data not found' });
    }
    
    // Check if user is authorized to update
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'manager' &&
      progressData.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to update this progress data' });
    }
    
    // Store the previous value before updating
    if (req.body.progressPercentage !== undefined && 
        req.body.progressPercentage !== progressData.progressPercentage) {
      progressData.previousValue = {
        percentage: progressData.progressPercentage,
        date: progressData.date,
        status: progressData.status
      };
    }
    
    // Validate progress percentage if provided
    if (req.body.progressPercentage !== undefined) {
      if (req.body.progressPercentage < 0 || req.body.progressPercentage > 100) {
        return res.status(400).json({ message: 'Progress percentage must be between 0 and 100' });
      }
      
      // Auto-update status based on progress if status not explicitly provided
      if (req.body.status === undefined) {
        if (req.body.progressPercentage === 0) {
          req.body.status = 'not-started';
        } else if (req.body.progressPercentage === 100) {
          req.body.status = 'completed';
        }
        // Otherwise keep the existing status
      }
    }
    
    // Prevent changing annotated area, drone image, and construction site
    delete req.body.annotatedArea;
    delete req.body.droneImage;
    delete req.body.constructionSite;
    
    // Special handling for issues and nextSteps - append instead of replace
    if (req.body.newIssue) {
      progressData.issues.push({
        description: req.body.newIssue.description,
        severity: req.body.newIssue.severity || 'medium',
        status: 'open',
        reportedBy: req.user._id,
        assignedTo: req.body.newIssue.assignedTo,
        reportedDate: new Date()
      });
      delete req.body.newIssue;
    }
    
    if (req.body.newStep) {
      progressData.nextSteps.push({
        description: req.body.newStep.description,
        dueDate: req.body.newStep.dueDate,
        assignedTo: req.body.newStep.assignedTo,
        status: 'pending'
      });
      delete req.body.newStep;
    }
    
    // Update issue status if provided
    if (req.body.updateIssue && req.body.updateIssue.issueId) {
      const issue = progressData.issues.id(req.body.updateIssue.issueId);
      if (issue) {
        issue.status = req.body.updateIssue.status || issue.status;
        if (req.body.updateIssue.status === 'resolved' || req.body.updateIssue.status === 'closed') {
          issue.resolvedDate = new Date();
        }
      }
      delete req.body.updateIssue;
    }
    
    // Update step status if provided
    if (req.body.updateStep && req.body.updateStep.stepId) {
      const step = progressData.nextSteps.id(req.body.updateStep.stepId);
      if (step) {
        step.status = req.body.updateStep.status || step.status;
      }
      delete req.body.updateStep;
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'createdBy') { // Prevent changing the creator
        progressData[key] = req.body[key];
      }
    });
    
    // Update lastUpdatedBy
    progressData.lastUpdatedBy = req.user._id;
    
    const updatedProgressData = await progressData.save();
    
    // Update construction site progress
    const updateSiteFlag = req.body.updateSiteProgress !== false; // Default to true
    if (updateSiteFlag) {
      await updateSiteProgress(progressData.constructionSite);
    }
    
    // Populate related fields
    await updatedProgressData
      .populate('annotatedArea', 'title category geometry')
      .populate('droneImage', 'title imageUrl captureDate')
      .populate('constructionSite', 'name location')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('issues.reportedBy', 'name email')
      .populate('issues.assignedTo', 'name email')
      .populate('nextSteps.assignedTo', 'name email')
      .execPopulate();
    
    res.json(updatedProgressData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Delete progress data
 * @route   DELETE /api/progress-data/:id
 * @access  Private
 */
const deleteProgressData = async (req, res) => {
  try {
    const progressData = await ProgressData.findById(req.params.id);
    
    if (!progressData) {
      return res.status(404).json({ message: 'Progress data not found' });
    }
    
    // Check if user is authorized to delete
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'manager' &&
      progressData.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this progress data' });
    }
    
    // Store construction site ID before deletion
    const siteId = progressData.constructionSite;
    
    await progressData.deleteOne();
    
    // Update the construction site's overall progress
    await updateSiteProgress(siteId);
    
    res.json({ message: 'Progress data removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get progress trend for an annotated area
 * @route   GET /api/annotated-areas/:areaId/progress-trend
 * @access  Private
 */
const getProgressTrend = async (req, res) => {
  try {
    const areaId = req.params.areaId;
    
    // Check if the area exists
    const area = await AnnotatedArea.findById(areaId);
    if (!area) {
      return res.status(404).json({ message: 'Annotated area not found' });
    }
    
    // Get the trend data
    const limit = parseInt(req.query.limit) || 10;
    const trend = await ProgressData.getProgressTrend(areaId, limit);
    
    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Helper function to update a construction site's overall progress
 */
const updateSiteProgress = async (siteId) => {
  try {
    // Get all active annotated areas for the site
    const areas = await AnnotatedArea.find({
      constructionSite: siteId,
      status: { $ne: 'flagged' } // Exclude flagged areas
    });
    
    if (areas.length === 0) {
      return;
    }
    
    // Get the latest progress data for each area
    let totalProgress = 0;
    let areaCount = 0;
    
    for (const area of areas) {
      const latestProgress = await ProgressData.findOne({
        annotatedArea: area._id
      })
      .sort({ date: -1 })
      .limit(1);
      
      if (latestProgress) {
        totalProgress += latestProgress.progressPercentage;
        areaCount++;
      }
    }
    
    // Calculate average progress
    const averageProgress = areaCount > 0 ? Math.round(totalProgress / areaCount) : 0;
    
    // Update the site's progress
    await ConstructionSite.findByIdAndUpdate(siteId, {
      progress: averageProgress
    });
    
  } catch (error) {
    console.error('Error updating site progress:', error);
  }
};

module.exports = {
  getAllProgressData,
  getProgressDataById,
  createProgressData,
  updateProgressData,
  deleteProgressData,
  getProgressTrend
}; 