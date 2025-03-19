const mongoose = require('mongoose');

const progressDataSchema = new mongoose.Schema(
  {
    annotatedArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnnotatedArea',
      required: true
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
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    workType: {
      type: String,
      required: true,
      enum: ['earthwork', 'pilingWork', 'buildingWork']
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    startDate: {
      type: Date
    },
    completionDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'behind-schedule', 'on-schedule', 'ahead-of-schedule', 'completed', 'blocked', 'on-hold'],
      default: 'on-schedule'
    },
    previousValue: {
      percentage: Number,
      date: Date,
      status: String
    },
    // Quantitative metrics
    metrics: {
      materialUsed: {
        quantity: Number,
        unit: String,
        type: String
      },
      hoursWorked: Number,
      costs: {
        labor: Number,
        materials: Number,
        equipment: Number,
        total: Number,
        currency: {
          type: String,
          default: 'USD'
        }
      },
      qualityScore: {
        type: Number,
        min: 0,
        max: 10
      }
    },
    deviation: {
      schedule: {
        days: Number,
        percentage: Number,
        impact: {
          type: String,
          enum: ['none', 'low', 'medium', 'high', 'critical'],
          default: 'none'
        }
      },
      budget: {
        amount: Number,
        percentage: Number,
        impact: {
          type: String,
          enum: ['none', 'low', 'medium', 'high', 'critical'],
          default: 'none'
        }
      }
    },
    notes: String,
    issues: [{
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open'
      },
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reportedDate: {
        type: Date,
        default: Date.now
      },
      resolvedDate: Date
    }],
    nextSteps: [{
      description: String,
      dueDate: Date,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'delayed'],
        default: 'pending'
      }
    }],
    weatherConditions: {
      temperature: Number,
      precipitation: Number,
      windSpeed: Number,
      conditions: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    attachments: [{
      type: String,
      url: String,
      name: String,
      size: Number,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

// Create compound index for efficient queries by site, area, and date
progressDataSchema.index({ constructionSite: 1, annotatedArea: 1, date: -1 });

// Create index for time-series queries
progressDataSchema.index({ date: -1 });

// Method to get progress trend
progressDataSchema.statics.getProgressTrend = async function(annotatedAreaId, limit = 5) {
  return this.find({ annotatedArea: annotatedAreaId })
    .sort({ date: -1 })
    .limit(limit)
    .select('date progressPercentage status')
    .lean();
};

const ProgressData = mongoose.model('ProgressData', progressDataSchema);

module.exports = ProgressData; 