import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'client';
  assignedSites: string[];
  createdAt: string;
  updatedAt: string;
}

// User Service
const userService = {
  // Get all users (available for team assignment)
  getAllUsers: async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
  
  // Get user by ID
  getUserById: async (id: string) => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },
  
  // Update user profile
  updateUserProfile: async (userData: Partial<User>) => {
    const response = await api.put<User>('/users/profile', userData);
    return response.data;
  },
  
  // Admin: Create new user
  createUser: async (userData: Partial<User>) => {
    const response = await api.post<User>('/users', userData);
    return response.data;
  },
  
  // Admin: Update any user
  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await api.put<User>(`/users/${id}`, userData);
    return response.data;
  },
  
  // Admin: Delete user
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

export default userService; 