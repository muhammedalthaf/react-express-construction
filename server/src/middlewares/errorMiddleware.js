/**
 * Error handling middleware for not found routes (404)
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  console.error(`[404] Not Found - ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Custom error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Set status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Enhanced error logging
  console.error(`[${statusCode}] Error on ${req.method} ${req.originalUrl}`);
  console.error(`Error Message: ${err.message}`);
  console.error(`Request Body:`, req.body);
  
  if (err.stack) {
    console.error('Stack Trace:');
    console.error(err.stack);
  }
  
  if (err.name) {
    console.error(`Error Type: ${err.name}`);
  }
  
  res.status(statusCode);
  
  // Format mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    console.error(`Validation Error: ${message}`);
    return res.json({
      message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }
  
  // Handle mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const errorMessage = `Duplicate value for ${field}: ${err.keyValue[field]}. Please use another value.`;
    console.error(`Duplicate Key Error: ${errorMessage}`);
    return res.json({
      message: errorMessage,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }
  
  // Return JSON error response
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler }; 