const mongoose = require('mongoose');

const constructionSiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    location: {
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: String,
      country: {
        type: String,
        required: true
      },
      zipCode: String,
      coordinates: {
        latitude: {
          type: Number,
          required: true
        },
        longitude: {
          type: Number,
          required: true
        }
      }
    },
    area: {
      size: Number, // in square meters/feet
      unit: {
        type: String,
        enum: ['sqft', 'sqm', 'acre', 'hectare'],
        default: 'sqm'
      }
    },
    boundaries: {
      // GeoJSON format for site boundaries
      type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon'
      },
      coordinates: {
        type: [[[Number]]], // Array of arrays of arrays of numbers
        default: undefined
      }
    },
    startDate: {
      type: Date,
      required: true
    },
    expectedEndDate: {
      type: Date,
      required: true
    },
    actualEndDate: Date,
    status: {
      type: String,
      enum: ['planning', 'not-started', 'in-progress', 'on-hold', 'completed', 'delayed', 'cancelled'],
      default: 'planning'
    },
    isReadyForViewing: {
      type: Boolean,
      default: false
    },
    client: {
      name: {
        type: String,
        required: true
      },
      contactPerson: String,
      email: String,
      phone: String
    },
    budget: {
      estimated: Number,
      actual: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    team: [{
      user: String,
      role: String,
      permissions: [{
        type: String,
        enum: ['view', 'edit', 'delete', 'annotate', 'upload']
      }]
    }],
    sectors: [{
      name: String,
      description: String,
      status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed', 'delayed'],
        default: 'not-started'
      }
    }],
    tags: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for getting associated drone images
constructionSiteSchema.virtual('droneImages', {
  ref: 'DroneImage',
  localField: '_id',
  foreignField: 'constructionSite'
});

// Virtual for getting most recent drone image
constructionSiteSchema.virtual('latestDroneImage', {
  ref: 'DroneImage',
  localField: '_id',
  foreignField: 'constructionSite',
  options: { sort: { captureDate: -1 }, limit: 1 }
});

// Index for geospatial queries
constructionSiteSchema.index({ 'location.coordinates': '2dsphere' });

const ConstructionSite = mongoose.model('ConstructionSite', constructionSiteSchema);

module.exports = ConstructionSite; 