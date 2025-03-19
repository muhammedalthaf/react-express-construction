const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token and attaches the user to the request
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from the header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id and exclude password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ message: 'User account is deactivated' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

/**
 * Middleware to check if user is an admin
 * Must be used after the protect middleware
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

/**
 * Middleware to check if user is a manager or admin
 * Must be used after the protect middleware
 */
const manager = (req, res, next) => {
  if (req.user && (req.user.role === 'manager' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a manager' });
  }
};

/**
 * Middleware to check if the user has access to a specific construction site
 * Must be used after the protect middleware
 */
const siteAccess = async (req, res, next) => {
  try {
    const siteId = req.params.id || req.params.siteId  || req.body.constructionSite;
    
    if (!siteId) {
      return res.status(400).json({ message: 'Construction site ID is required' });
    }

    // Admin and managers have access to all sites
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      return next();
    }

    // Check if user is assigned to this site
    const hasAccess = req.user.assignedSites.some(site => site.toString() === siteId.toString());
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to access this construction site' });
    }
    
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error in site access middleware' });
  }
};

module.exports = { protect, admin, manager, siteAccess }; 