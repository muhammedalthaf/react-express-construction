import api from './api';
import axios from 'axios';
import { AxiosResponse } from 'axios';

// Interfaces
interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface Client {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

interface Budget {
  estimated: number;
  actual?: number;
  currency: string;
}

interface TeamMember {
  user: string; // userId
  role: string;
  permissions: string[];
}

interface Sector {
  name: string;
  description?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
}

interface SiteFilters {
  status?: string;
  ready?: boolean;
}

export interface ConstructionSiteData {
  name: string;
  description: string;
  location: Location;
  area?: {
    size: number;
    unit: 'sqft' | 'sqm' | 'acre' | 'hectare';
  };
  boundaries?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  status: 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
  isReadyForViewing: boolean;
  client: Client;
  budget: Budget;
  progress?: number;
  team: TeamMember[];
  sectors: Sector[];
  tags?: string[];
  assignedTo?: string;
}

export interface ConstructionSiteResponse extends ConstructionSiteData {
  _id: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  lastUpdatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Construction Site Service
const constructionSiteService = {
  // Get all construction sites
  getAllSites: async (filters?: { status?: string; ready?: boolean }) => {
    let queryParams = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.ready !== undefined) params.append('ready', filters.ready.toString());
      queryParams = `?${params.toString()}`;
    }
    
    const response = await api.get<ConstructionSiteResponse[]>(`/sites${queryParams}`);
    return response.data;
  },

  // Get a specific construction site by ID
  getSiteById: async (siteId: string) => {
    const response = await api.get<ConstructionSiteResponse>(`/sites/${siteId}`);
    return response.data;
  },

  // Create a new construction site
  createSite: async (siteData: ConstructionSiteData) => {
    const response = await api.post<ConstructionSiteResponse>('/sites', siteData);
    return response.data;
  },

  // Update an existing construction site
  updateSite: async (siteId: string, siteData: Partial<ConstructionSiteData>) => {
    const response = await api.put<ConstructionSiteResponse>(`/sites/${siteId}`, siteData);
    return response.data;
  },

  // Delete a construction site
  deleteSite: async (siteId: string) => {
    const response = await api.delete(`/sites/${siteId}`);
    return response.data;
  },

  // Get site statistics
  getSiteStats: async (siteId: string) => {
    const response = await api.get(`/sites/${siteId}/stats`);
    return response.data;
  },

  // Toggle site ready status
  toggleSiteReadyStatus: async (siteId: string) => {
    const response = await api.put(`/sites/${siteId}/toggle-ready`);
    return response.data;
  },

  // Get site images
  getSiteImages: async (siteId: string) => {
    const response = await api.get(`/sites/${siteId}/images`);
    return response.data;
  },

  // Mark site as ready and assign to user
  markSiteAsReady: async (siteId: string, userId: string): Promise<ConstructionSiteResponse> => {
    const response = await api.put(`/sites/${siteId}/mark-ready`, { assignedTo: userId });
    return response.data;
  },

  // Update site status
  updateSiteStatus: async (siteId: string, status: string): Promise<ConstructionSiteResponse> => {
    try {
      const response = await api.put(`/sites/${siteId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating site status:', error);
      throw error;
    }
  },

  // Update site progress
  updateSiteProgress: async (siteId: string, progress: number): Promise<ConstructionSiteResponse> => {
    try {
      const response = await api.put(`/sites/${siteId}/progress`, { progress });
      return response.data;
    } catch (error) {
      console.error('Error updating site progress:', error);
      throw error;
    }
  },

  // Update both status and progress
  updateSiteStatusAndProgress: async (siteId: string, status: string, progress: number): Promise<ConstructionSiteResponse> => {
    try {
      const response = await api.put(`/sites/${siteId}/status-progress`, { status, progress });
      return response.data;
    } catch (error) {
      console.error('Error updating site status and progress:', error);
      throw error;
    }
  }
};

export default constructionSiteService; 