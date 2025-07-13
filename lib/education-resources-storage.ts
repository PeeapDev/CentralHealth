/**
 * Education Resources Storage Utilities
 * 
 * This module provides utilities for managing educational resources 
 * including videos, PDFs, and other materials in local storage.
 * It ensures persistence between sessions and provides a bridge 
 * between admin uploading and patient viewing.
 */

export interface EducationalResource {
  id: string;
  title: string;
  type: 'Video' | 'PDF' | 'Interactive' | 'Webinar';
  categories: string[];
  dateAdded: string;
  lastUpdated: string;
  size: string;
  targetAudience: 'Patient' | 'Staff' | 'Both';
  duration: string; // format: "8:20" or similar
  url?: string; // YouTube URL or file URL
  thumbnailUrl?: string;
  description?: string;
  // Specific to antenatal resources
  gestationalAgeRange?: {
    min: number; // week
    max: number; // week
  };
  // For tracking
  viewCount?: number;
  completionCount?: number;
}

// Local storage keys
const EDUCATION_RESOURCES_KEY = 'hospital-education-resources';
const PATIENT_RESOURCES_KEY = 'hospital-patient-resources';

/**
 * Get all educational resources from local storage
 */
export function getAllEducationResources(): EducationalResource[] {
  try {
    if (typeof window === 'undefined') return [];
    const resourcesJson = localStorage.getItem(EDUCATION_RESOURCES_KEY);
    return resourcesJson ? JSON.parse(resourcesJson) : [];
  } catch (error) {
    console.error('Error getting education resources:', error);
    return [];
  }
}

/**
 * Add a new educational resource
 */
export function addEducationResource(resource: Omit<EducationalResource, 'id' | 'dateAdded' | 'lastUpdated'> & { id?: string }): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    // Create a complete resource with all required fields
    const now = new Date().toISOString();
    const completeResource: EducationalResource = {
      // Copy all existing fields from the input resource
      ...resource,
      // Ensure required fields are set
      id: resource.id || `resource-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      dateAdded: now,
      lastUpdated: now
    };
    
    // Get existing resources
    const resources = getAllEducationResources();
    
    // Add new resource
    resources.push(completeResource);
    
    // Save to local storage
    localStorage.setItem(EDUCATION_RESOURCES_KEY, JSON.stringify(resources));
    
    // If this is a patient resource, add it to the patient resources as well
    if (completeResource.targetAudience === 'Patient' || completeResource.targetAudience === 'Both') {
      addPatientResource(completeResource);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding education resource:', error);
    return false;
  }
}

/**
 * Get resources specifically for patients (antenatal videos, etc.)
 */
export function getPatientResources(): EducationalResource[] {
  try {
    if (typeof window === 'undefined') return [];
    const resourcesJson = localStorage.getItem(PATIENT_RESOURCES_KEY);
    return resourcesJson ? JSON.parse(resourcesJson) : [];
  } catch (error) {
    console.error('Error getting patient resources:', error);
    return [];
  }
}

/**
 * Add a resource specifically for patients
 */
export function addPatientResource(resource: EducationalResource): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    // Get existing patient resources
    const resources = getPatientResources();
    
    // Check if resource already exists
    const exists = resources.some(r => r.id === resource.id);
    if (exists) {
      // Update the existing resource
      const index = resources.findIndex(r => r.id === resource.id);
      resources[index] = { ...resources[index], ...resource };
    } else {
      // Add new resource
      resources.push(resource);
    }
    
    // Save to local storage
    localStorage.setItem(PATIENT_RESOURCES_KEY, JSON.stringify(resources));
    return true;
  } catch (error) {
    console.error('Error adding patient resource:', error);
    return false;
  }
}

/**
 * Get resources filtered by gestational age for antenatal videos
 */
export function getAntenatalResourcesByGestationalAge(gestationalAge?: number): EducationalResource[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const resources = getPatientResources();
    
    // If no gestational age provided, return all antenatal resources
    if (!gestationalAge) {
      return resources.filter(r => 
        r.categories.some(c => c.toLowerCase().includes('antenatal') || c.toLowerCase().includes('pregnancy'))
      );
    }
    
    // Filter by gestational age range if available
    return resources.filter(r => {
      // Include if it has a gestational age range and the current age falls within it
      if (r.gestationalAgeRange) {
        return gestationalAge >= r.gestationalAgeRange.min && gestationalAge <= r.gestationalAgeRange.max;
      }
      
      // If no range specified but is antenatal, include it
      return r.categories.some(c => c.toLowerCase().includes('antenatal') || c.toLowerCase().includes('pregnancy'));
    });
  } catch (error) {
    console.error('Error getting antenatal resources by gestational age:', error);
    return [];
  }
}

/**
 * Track resource view
 */
export function recordResourceView(resourceId: string): void {
  try {
    if (typeof window === 'undefined') return;
    
    // Update in both storage locations
    [EDUCATION_RESOURCES_KEY, PATIENT_RESOURCES_KEY].forEach(key => {
      const resourcesJson = localStorage.getItem(key);
      if (!resourcesJson) return;
      
      const resources = JSON.parse(resourcesJson);
      const resourceIndex = resources.findIndex((r: EducationalResource) => r.id === resourceId);
      
      if (resourceIndex >= 0) {
        resources[resourceIndex].viewCount = (resources[resourceIndex].viewCount || 0) + 1;
        localStorage.setItem(key, JSON.stringify(resources));
      }
    });
  } catch (error) {
    console.error('Error recording resource view:', error);
  }
}

/**
 * Record resource completion
 */
export function recordResourceCompletion(resourceId: string): void {
  try {
    if (typeof window === 'undefined') return;
    
    // Update in both storage locations
    [EDUCATION_RESOURCES_KEY, PATIENT_RESOURCES_KEY].forEach(key => {
      const resourcesJson = localStorage.getItem(key);
      if (!resourcesJson) return;
      
      const resources = JSON.parse(resourcesJson);
      const resourceIndex = resources.findIndex((r: EducationalResource) => r.id === resourceId);
      
      if (resourceIndex >= 0) {
        resources[resourceIndex].completionCount = (resources[resourceIndex].completionCount || 0) + 1;
        localStorage.setItem(key, JSON.stringify(resources));
      }
    });
  } catch (error) {
    console.error('Error recording resource completion:', error);
  }
}

/**
 * Delete an educational resource
 */
export function deleteEducationResource(resourceId: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    // Remove from both storage locations
    [EDUCATION_RESOURCES_KEY, PATIENT_RESOURCES_KEY].forEach(key => {
      const resourcesJson = localStorage.getItem(key);
      if (!resourcesJson) return;
      
      const resources = JSON.parse(resourcesJson);
      const filteredResources = resources.filter((r: EducationalResource) => r.id !== resourceId);
      
      localStorage.setItem(key, JSON.stringify(filteredResources));
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting education resource:', error);
    return false;
  }
}

/**
 * Convert YouTube URL to embed URL
 */
export function getYouTubeEmbedUrl(youtubeUrl: string): string {
  try {
    if (!youtubeUrl) return '';
    
    // Match YouTube URL patterns
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = youtubeUrl.match(regExp);
    
    if (match && match[2].length === 11) {
      // Return embed URL
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    return youtubeUrl; // Return original if not a valid YouTube URL
  } catch (error) {
    console.error('Error converting YouTube URL:', error);
    return youtubeUrl;
  }
}
