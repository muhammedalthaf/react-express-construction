const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'delayed'],
      default: 'pending',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dueDate: Date,
    completedDate: Date,
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    expectedEndDate: {
      type: Date,
      required: true,
    },
    actualEndDate: Date,
    status: {
      type: String,
      enum: ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'],
      default: 'planning',
    },
    client: {
      name: String,
      contactPerson: String,
      email: String,
      phone: String,
    },
    budget: {
      estimated: Number,
      actual: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    images: [
      {
        url: String,
        caption: String,
        dateUploaded: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tasks: [taskSchema],
    team: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate progress based on tasks
projectSchema.methods.calculateProgress = function () {
  if (!this.tasks || this.tasks.length === 0) {
    return 0;
  }
  
  const totalTasks = this.tasks.length;
  const completedTasks = this.tasks.filter(
    (task) => task.status === 'completed'
  ).length;
  
  return Math.round((completedTasks / totalTasks) * 100);
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 