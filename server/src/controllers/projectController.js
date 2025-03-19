const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({});
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a project by ID
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const project = new Project({
      name: req.body.name,
      description: req.body.description,
      location: req.body.location,
      startDate: req.body.startDate,
      expectedEndDate: req.body.expectedEndDate,
      status: req.body.status,
      client: req.body.client,
      budget: req.body.budget,
      progress: req.body.progress || 0,
      images: req.body.images || [],
      tasks: req.body.tasks || [],
      createdBy: req.user._id,
    });

    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update fields
    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;
    project.location = req.body.location || project.location;
    project.startDate = req.body.startDate || project.startDate;
    project.expectedEndDate = req.body.expectedEndDate || project.expectedEndDate;
    project.status = req.body.status || project.status;
    project.client = req.body.client || project.client;
    project.budget = req.body.budget || project.budget;
    project.progress = req.body.progress !== undefined ? req.body.progress : project.progress;
    project.images = req.body.images || project.images;
    project.tasks = req.body.tasks || project.tasks;
    
    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    await project.remove();
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
}; 