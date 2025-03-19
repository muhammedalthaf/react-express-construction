import api from './api';

// Types
export interface DroneImage {
  _id: string;
  constructionSite: any;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  captureDate: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  fileType?: string;
  annotations?: Array<{
    _id: string;
    type: 'polygon' | 'rectangle' | 'point';
    coordinates: number[][];
    label?: string;
    category?: string;
    notes?: string;
    developmentData?: {
      workType?: string;
      progress?: number;
      startDate?: string;
      completionDate?: string;
      status?: string;
      notes?: string;
    };
  }>;
  isProcessed: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  coverage?: {
    type: 'Polygon';
    coordinates?: number[][][];
  };
}

// Drone Image Service
const droneImageService = {
  // Get all drone images
  getAllImages: async (siteId?: string) => {
    const endpoint = siteId ? `/sites/${siteId}/images` : '/drone-images';
    const response = await api.get<DroneImage[]>(endpoint);
    console.log("res", response)
    return response.data;
  },
  
  // Get drone image by ID
  getImageById: async (imageId: string) => {
    const response = await api.get<DroneImage>(`/drone-images/${imageId}`);
    return response.data;
  },
  
  // Upload a new drone image
  uploadImage: async (siteId: string, formData: FormData) => {
    // Add constructionSite to formData
    formData.append('constructionSite', siteId);
    
    // Skip coverage field for now - it will be added during annotation
    // We explicitly add an empty object to avoid the GeoJSON validation error
    formData.append('skipCoverage', 'true');
    
    // Use the drone-images endpoint as defined in the server routes
    const response = await api.post<DroneImage>(`/drone-images/${siteId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Update drone image details
  updateImage: async (imageId: string, imageData: Partial<DroneImage>) => {
    const response = await api.put<DroneImage>(`/drone-images/${imageId}`, imageData);
    return response.data;
  },
  
  // Delete a drone image
  deleteImage: async (imageId: string) => {
    const response = await api.delete(`/drone-images/${imageId}`);
    return response.data;
  },
  
  // Get annotations for a drone image
  getAnnotations: async (imageId: string) => {
    const response = await api.get(`/drone-images/${imageId}/annotations`);
    return response.data;
  },
  
  // Save annotations for a drone image
  saveAnnotations: async (imageId: string, annotations: any[]) => {
    const response = await api.post(`/drone-images/${imageId}/annotations`, { annotations });
    return response.data;
  }
};

export default droneImageService; 