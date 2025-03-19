import axios from 'axios';
import apiConfig from '../config/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: apiConfig.API_BASE_URL,
  headers: apiConfig.DEFAULT_HEADERS,
  timeout: apiConfig.TIMEOUT,
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log detailed error information
    console.error('=== API ERROR ===');
    console.error(`URL: ${error.config?.url}`);
    console.error(`Method: ${error.config?.method?.toUpperCase()}`);
    
    if (error.config?.data) {
      try {
        console.error('Request Data:', JSON.parse(error.config.data));
      } catch (e) {
        console.error('Request Data:', error.config.data);
      }
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error Message:', error.message);
    }
    
    // Handle session expiration (401 errors)
    if (error.response && error.response.status === 401) {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if we're not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 