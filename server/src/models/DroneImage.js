const mongoose = require('mongoose');

const droneImageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String,
    constructionSite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConstructionSite',
      required: true
    },
    captureDate: {
      type: Date,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    imageUrl: {
      type: String,
      required: true
    },
    thumbnailUrl: String,
    originalFilename: String,
    fileSize: Number, // in bytes
    resolution: {
      width: Number,
      height: Number
    },
    imageType: {
      type: String,
      enum: ['rgb', 'thermal', 'lidar', 'orthomosaic', 'other'],
      default: 'rgb'
    },
    metaData: {
      altitude: Number, // in meters
      speed: Number, // in m/s
      cameraModel: String,
      focalLength: Number,
      isoSpeed: Number,
      shutterSpeed: String,
      aperture: String,
      gpsCoordinates: {
        latitude: Number,
        longitude: Number,
        altitude: Number
      },
      compass: {
        direction: Number, // in degrees
        accuracy: Number
      }
    },
    sector: {
      type: String,
      ref: 'ConstructionSite.sectors.name'
    },
    tags: [String],
    droneInfo: {
      model: String,
      serialNumber: String,
      operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    coverage: {
      // GeoJSON format for image coverage area
      type: {
        type: String,
        enum: ['Polygon'],
        required: function() {
          // Only required if coordinates are specified
          return this.coverage && this.coverage.coordinates && this.coverage.coordinates.length > 0;
        }
      },
      coordinates: {
        type: [[[Number]]], // Array of arrays of arrays of numbers
        required: function() {
          // Only required if type is specified
          return this.coverage && this.coverage.type === 'Polygon';
        },
        validate: {
          validator: function(coords) {
            // Allow undefined/null coordinates when type is not specified
            if (!this.coverage || !this.coverage.type) {
              return true;
            }
            // Otherwise validate that coordinates are an array with at least one polygon
            return Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0]);
          },
          message: 'Coverage coordinates must be a valid GeoJSON Polygon'
        }
      }
    },
    processed: {
      type: Boolean,
      default: false
    },
    processingDetails: {
      status: {
        type: String,
        enum: ['not-started', 'processing', 'completed', 'failed'],
        default: 'not-started'
      },
      startTime: Date,
      endTime: Date,
      errorMessage: String
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for annotated areas
droneImageSchema.virtual('annotatedAreas', {
  ref: 'AnnotatedArea',
  localField: '_id',
  foreignField: 'droneImage'
});

// Index for efficient queries by construction site and date
droneImageSchema.index({ constructionSite: 1, captureDate: -1 });

// Index for geospatial queries
droneImageSchema.index({ 'coverage': '2dsphere' });

const DroneImage = mongoose.model('DroneImage', droneImageSchema);

module.exports = DroneImage; 