"use client";

import { 
  addEducationResource, 
  getYouTubeEmbedUrl,
  getAllEducationResources 
} from "@/lib/education-resources-storage";

// Function to add the educational video
export function addObstetricEmergenciesVideo(): boolean {
  try {
    // Video data
    const youtubeUrl = 'https://www.youtube.com/watch?v=wt9-6VWbfHI';
    const embedUrl = getYouTubeEmbedUrl(youtubeUrl);
    
    if (!embedUrl) {
      console.error("Failed to generate embed URL");
      return false;
    }

    // Extract video ID for thumbnail
    const videoIdMatch = embedUrl.match(/embed\/([^?]+)/);
    const thumbnailUrl = videoIdMatch ? `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg` : '';

    // Create resource object - using real educational content (not mock/test data)
    const videoResource = {
      title: "Understanding Obstetric Emergencies",
      type: "Video" as const,
      categories: ["Antenatal", "First Trimester", "Second Trimester", "Third Trimester"],
      targetAudience: 'Patient' as const,
      size: 'N/A',
      duration: "10:43",
      url: embedUrl,
      thumbnailUrl,
      description: "Comprehensive guide to identifying and managing obstetric emergencies. Important for expectant mothers to recognize warning signs.",
      viewCount: 0,
      completionCount: 0
    };

    // Add the resource
    const success = addEducationResource(videoResource);
    
    if (success) {
      console.log('Video added successfully!');
      return true;
    } else {
      console.error('Failed to add video');
      return false;
    }
  } catch (error) {
    console.error('Error adding video:', error);
    return false;
  }
}
