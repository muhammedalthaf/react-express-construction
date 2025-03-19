import api from './api';
import axios from 'axios';
import apiConfig from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    assignedSites: string[];
  };
  token: string;
}

// Create a separate axios instance for auth endpoints (doesn't need auth headers)
const authApi = axios.create({
  baseURL: apiConfig.API_BASE_URL,
  headers: apiConfig.DEFAULT_HEADERS,
  timeout: apiConfig.TIMEOUT,
});

// Auth Service
const authService = {
  // Login user
  login: async (credentials: LoginCredentials) => {
    const response = await authApi.post<AuthResponse>('/auth/login', credentials);
    
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },
  
  // Register user
  register: async (userData: RegisterData) => {
    const response = await authApi.post<AuthResponse>('/auth/register', userData);
    
    // Store token in localStorage if it exists in response
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Get current authenticated user
  getCurrentUser: () => {
    const userString = localStorage.getItem('user');
    if (userString) {
      return JSON.parse(userString);
    }
    return null;
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService; 