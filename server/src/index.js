const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// Import routes
const userRoutes = require('./routes/users');
const constructionSiteRoutes = require('./routes/constructionSites');
const droneImageRoutes = require('./routes/droneImages');
const annotatedAreaRoutes = require('./routes/annotatedAreas');
const progressDataRoutes = require('./routes/progressData');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Make uploads directory static
app.use('/uploads', express.static(path.join(__dirname, '../', process.env.UPLOAD_PATH || 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/sites', constructionSiteRoutes);
app.use('/api/drone-images', droneImageRoutes);
app.use('/api/annotations', annotatedAreaRoutes);
app.use('/api/progress-data', progressDataRoutes);

// Root route for API testing
app.get('/', (req, res) => {
  res.send('Construction Progress Monitoring API is running');
});

// API Documentation route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to the Construction Progress Monitoring API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      sites: '/api/sites',
      droneImages: '/api/drone-images',
      annotatedAreas: '/api/annotated-areas',
      progressData: '/api/progress-data'
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
}); 