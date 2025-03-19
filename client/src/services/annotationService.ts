import api from './api';

// Types
export interface Annotation {
  id?: string;
  type: 'rectangle' | 'polygon' | 'point' | 'marker';
  coordinates: number[][];
  points?: number[];
  label: string;
  color: string;
  category?: string;
  droneImageId: string;
  constructionSiteId: string;
  status?: string;
  createdBy?: string;
  lastUpdatedBy?: string;
  assignedTo?: string[];
  comments?: any[];
  progressData?: any[];
}

// Service methods
export const getAnnotations = async (droneImageId: string) => {
  try {
    const response = await api.get(`/drone-images/${droneImageId}/annotated-areas`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAnnotationById = async (id: string) => {
  try {
    const response = await api.get(`/annotations/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createAnnotation = async (annotation: Annotation) => {
  try {
    const response = await api.post('/annotations', annotation);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAnnotation = async (id: string, annotation: Partial<Annotation>) => {
  try {
    const response = await api.put(`/annotations/${id}`, annotation);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAnnotation = async (id: string) => {
  try {
    const response = await api.delete(`/annotations/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkSaveAnnotations = async (
  annotations: Annotation[], 
  droneImageId: string, 
  constructionSiteId: string
) => {
  try {
    // Create a deep copy and ensure all annotations have the correct IDs
    const annotationsToSave = annotations.map(ann => ({
      ...ann,
      droneImageId: droneImageId,
      constructionSiteId: constructionSiteId
    }));
    
    const response = await api.post('/annotations/bulk', {
      annotations: annotationsToSave,
      droneImageId,
      constructionSiteId
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

const annotationService = {
  getAnnotations,
  getAnnotationById,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
  bulkSaveAnnotations
};

export default annotationService; 