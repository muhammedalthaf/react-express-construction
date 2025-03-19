import env from './environment';

// API Configuration
const config = {
  // Base API URL - uses environment-specific value
  API_BASE_URL: env.API_URL,
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Default headers to include with requests
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

export default config; 