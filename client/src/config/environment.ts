// Environment Configuration

// Get the current environment from process.env
const env = process.env.NODE_ENV || 'development';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configuration for different environments
const config = {
  development: {
    API_URL,
    DEBUG: true
  },
  test: {
    API_URL,
    DEBUG: true
  },
  production: {
    API_URL: process.env.REACT_APP_API_URL || '/api', // In production, use relative URL if not specified
    DEBUG: false
  }
};

// Export the config for the current environment
export default config[env as keyof typeof config]; 