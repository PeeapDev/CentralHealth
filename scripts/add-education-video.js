// Script to add a YouTube video to the patient education resources
const { 
  addEducationResource, 
  getYouTubeEmbedUrl,
  getAllEducationResources 
} = require('../lib/education-resources-storage');

// Video data
const youtubeUrl = 'https://www.youtube.com/watch?v=wt9-6VWbfHI';
const embedUrl = getYouTubeEmbedUrl(youtubeUrl);

// Extract video ID for thumbnail
const videoIdMatch = embedUrl.match(/embed\/([^?]+)/);
const thumbnailUrl = videoIdMatch ? `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg` : '';

// Create resource object
const videoResource = {
  title: "Understanding Obstetric Emergencies",
  type: "Video",
  categories: ["Antenatal", "First Trimester", "Second Trimester", "Third Trimester"],
  targetAudience: 'Patient',
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
  
  // Show all resources to confirm
  const allResources = getAllEducationResources();
  console.log(`Total resources: ${allResources.length}`);
  console.log('Recently added video:', allResources.find(r => r.url === embedUrl));
} else {
  console.error('Failed to add video');
}
