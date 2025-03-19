// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  assignedSites?: string[];
}

// Construction site types
export interface Location {
  address: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface ConstructionSite {
  id: string;
  name: string;
  description: string;
  location: Location;
  status: 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
  isReadyForViewing: boolean;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// Drone image types
export interface DroneImage {
  id: string;
  title: string;
  description?: string;
  constructionSite: string | ConstructionSite;
  captureDate: string;
  uploadDate: string;
  imageUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Annotation types
export type GeometryType = 'Point' | 'LineString' | 'Polygon' | 'Rectangle' | 'Circle';
export type CategoryType = 
  | 'foundation' 
  | 'structure' 
  | 'electrical' 
  | 'plumbing' 
  | 'hvac' 
  | 'interior' 
  | 'exterior' 
  | 'landscaping' 
  | 'issue' 
  | 'progress' 
  | 'other';

export interface AnnotatedArea {
  id: string;
  title: string;
  description?: string;
  droneImage: string | DroneImage;
  constructionSite: string | ConstructionSite;
  geometry: {
    type: GeometryType;
    coordinates: number[] | number[][] | number[][][];
  };
  category: CategoryType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'flagged';
  createdAt: string;
  updatedAt: string;
}

// Progress data types
export interface ProgressData {
  id: string;
  annotatedArea: string | AnnotatedArea;
  droneImage: string | DroneImage;
  constructionSite: string | ConstructionSite;
  date: string;
  progressPercentage: number;
  status: 'not-started' | 'behind-schedule' | 'on-schedule' | 'ahead-of-schedule' | 'completed' | 'blocked' | 'on-hold';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
  data: T[];
} 