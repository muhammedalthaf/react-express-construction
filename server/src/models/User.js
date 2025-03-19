const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'manager', 'contractor', 'inspector'],
      default: 'user',
    },
    profile: {
      title: String,
      company: String,
      phoneNumber: String,
      address: String,
      profileImage: String,
    },
    assignedSites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConstructionSite'
    }],
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    notifications: [{
      message: String,
      date: {
        type: Date,
        default: Date.now
      },
      read: {
        type: Boolean,
        default: false
      },
      relatedTo: {
        siteId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ConstructionSite'
        },
        type: String
      }
    }]
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 