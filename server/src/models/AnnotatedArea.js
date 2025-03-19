const mongoose = require('mongoose');

const annotatedAreaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['polygon', 'rectangle', 'marker'],
    required: true
  },
  coordinates: {
    type: [[Number]],
    required: function() {
      return this.type === 'marker';
    }
  },
  points: {
    type: [Number],
    required: function() {
      return this.type === 'polygon' || this.type === 'rectangle';
    }
  },
  droneImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DroneImage',
    required: true
  },
  constructionSite: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConstructionSite',
    required: true
  },
  label: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'reviewed'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  progressData: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgressData'
  }]
}, {
  timestamps: true
});

// Add indexes for better query performance
annotatedAreaSchema.index({ droneImage: 1 });
annotatedAreaSchema.index({ constructionSite: 1 });
annotatedAreaSchema.index({ type: 1 });
annotatedAreaSchema.index({ status: 1 });

module.exports = mongoose.model('AnnotatedArea', annotatedAreaSchema); 