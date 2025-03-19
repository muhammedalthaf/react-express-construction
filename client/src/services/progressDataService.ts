import api from './api';
import { DevelopmentData } from '../components/AnnotationDevelopmentForm';

export interface ProgressData {
  id?: string;
  annotationId: string;
  droneImageId: string;
  constructionSiteId: string;
  workType: string;
  progressPercentage: number;
  startDate: string | null;
  completionDate: string | null;
  notes: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  previousProgress?: {
    progressPercentage: number;
    date: string;
  };
}

// Get progress data for a specific annotation
export const getProgressDataForAnnotation = async (annotationId: string) => {
  try {
    const response = await api.get('/progress-data/annotation', {
      params: { annotationId: annotationId }
    });
    // Return the first (and only) progress data entry for this annotation
    return response.data.progressData?.[0] || null;
  } catch (error) {
    throw error;
  }
};

// Get all progress data for a construction site
export const getProgressDataForSite = async (constructionSiteId: string) => {
  try {
    const response = await api.get(`/progress-data/site/${constructionSiteId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create or update progress data for an annotation
export const saveProgressData = async (
  annotationId: string, 
  droneImageId: string, 
  constructionSiteId: string,
  developmentData: DevelopmentData
) => {
  try {
    // // First, check if progress data exists for this annotation
    // const existingData = await getProgressDataForAnnotation(annotationId);
    
    // Ensure workType is not empty
    if (!developmentData.workType) {
      throw new Error('Work type is required');
    }

    // Map the status to match the model's enum values
    const mapStatus = (status: string) => {
      switch (status) {
        case 'notStarted':
          return 'not-started';
        case 'inProgress':
          return 'in-progress';
        case 'completed':
          return 'completed';
        default:
          return 'on-schedule';
      }
    };

    const progressData = {
      annotationId: annotationId,
      droneImageId: droneImageId,
      constructionSite: constructionSiteId,
      workType: developmentData.workType,
      progressPercentage: developmentData.progressPercentage,
      startDate: developmentData.startDate ? new Date(developmentData.startDate).toISOString() : null,
      completionDate: developmentData.completionDate ? new Date(developmentData.completionDate).toISOString() : null,
      notes: developmentData.notes || '',
      status: mapStatus(developmentData.status)
    };
    
    let response;
    response = await api.post('/progress-data', progressData);
    
    return response.data;
  } catch (error) {
    console.error('Error saving progress data:', error);
    throw error;
  }
};

// Delete progress data
export const deleteProgressData = async (progressId: string) => {
  try {
    const response = await api.delete(`/progress-data/${progressId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get progress trend data for an annotation
export const getProgressTrend = async (annotationId: string) => {
  try {
    const response = await api.get(`/progress-data/trend/${annotationId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Convert server data to form data format
export const convertToFormData = (data: any): DevelopmentData => {
  // Always determine status based on progress percentage first
  let status: 'notStarted' | 'inProgress' | 'completed';
  if (data.progressPercentage === 0) {
    status = 'notStarted';
  } else if (data.progressPercentage === 100) {
    status = 'completed';
  } else {
    status = 'inProgress';
  }
  
  return {
    workType: data.workType || '',
    progressPercentage: data.progressPercentage || 0,
    startDate: data.startDate ? new Date(data.startDate) : null,
    completionDate: data.completionDate ? new Date(data.completionDate) : null,
    notes: data.notes || '',
    status: status // Always use the status determined by progress percentage
  };
};

const progressDataService = {
  getProgressDataForAnnotation,
  getProgressDataForSite,
  saveProgressData,
  deleteProgressData,
  getProgressTrend,
  convertToFormData
};

export default progressDataService; 