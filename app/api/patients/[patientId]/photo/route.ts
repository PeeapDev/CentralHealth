import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Helper function to extract initials from a name
 */
function getInitialsFromName(name: string): string {
  if (!name || name === 'Unknown') return '?';
  
  const parts = name.trim().split(/\s+/);
  let initials = '';
  
  if (parts.length > 0) initials += parts[0][0] || '';
  if (parts.length > 1) initials += parts[parts.length - 1][0] || '';
  
  return initials.toUpperCase();
}

/**
 * Helper function to generate and serve an avatar image
 */
async function serveAvatarImage(name: string, backgroundColor: string, textColor: string): Promise<Response> {
  // Format name for avatar 
  const initials = getInitialsFromName(name);
  
  // Generate avatar URL without background color hash mark
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(backgroundColor.substring(1))}&color=${encodeURIComponent(textColor.substring(1))}&size=128`;
  
  // Fetch the avatar image
  const avatarResponse = await fetch(avatarUrl);
  if (!avatarResponse.ok) {
    throw new Error(`Failed to fetch avatar: ${avatarResponse.status} ${avatarResponse.statusText}`);
  }
  
  // Get image data and content type
  const avatarData = await avatarResponse.arrayBuffer();
  const contentType = avatarResponse.headers.get('content-type') || 'image/png';
  
  // Return the image with caching headers
  return new Response(avatarData, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  });
}

// Photo generation endpoint for patient avatars
export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
  const patientId = params.patientId;
  if (!patientId) {
    return new Response('Patient ID is required', { status: 400 });
  }
  
  try {
    // Fetch the patient to get their name and medical ID
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        name: true,
        mrn: true,
        User: true
      }
    });
    
    if (!patient) {
      console.log(`Photo endpoint - patient not found with ID: ${patientId}`);
      return new Response('Patient not found', { status: 404 });
    }
    
    // Get medical ID - this is used to generate a consistent avatar
    const medicalId = patient.mrn || '';
    console.log(`Photo endpoint - found patient with medical ID: ${medicalId}`);
    
    // No special handling for specific patients as per CentralHealth system rules
    
    // Extract patient name
    let patientName = 'Unknown';
    
    if (patient.name) {
      if (typeof patient.name === 'string') {
        try {
          // First check if it's JSON
          if (patient.name.startsWith('{') || patient.name.startsWith('[')) {
            const nameObj = JSON.parse(patient.name);
            patientName = nameObj.text || 
              ((nameObj.given && nameObj.family) ? 
              `${Array.isArray(nameObj.given) ? nameObj.given.join(' ') : nameObj.given} ${nameObj.family}` : 
              'Unknown');
          } else {
            // Just use as-is if not JSON formatted
            patientName = patient.name;
          }
        } catch (e) {
          // If parsing fails, use as-is
          patientName = patient.name;
        }
      } else if (typeof patient.name === 'object') {
        // Handle name object directly
        const nameObj = patient.name as any;
        patientName = nameObj.text || 
          ((nameObj.given && nameObj.family) ? 
          `${Array.isArray(nameObj.given) ? nameObj.given.join(' ') : nameObj.given} ${nameObj.family}` : 
          'Unknown');
      }
    }
    
    // Try to get name from User if no name from patient
    if (patientName === 'Unknown' && patient.User) {
      if (Array.isArray(patient.User) && patient.User.length > 0) {
        patientName = patient.User[0]?.name || 'Unknown';
      } else if (patient.User && (patient.User as any)?.name) {
        patientName = (patient.User as any).name;
      }
    }
    
    // For all other patients, generate a deterministic avatar based on their medical ID
    // Generate a nice background color based on the medical ID
    let backgroundColor = '#1abc9c'; // Default teal
    let textColor = '#ffffff'; // Default white
    
    // Use medical ID to determine color if available
    if (patient.mrn) {
      // Generate a consistent color from medical ID
      const hash = Array.from(patient.mrn).reduce(
        (hash, char) => (hash * 31 + char.charCodeAt(0)) & 0xFFFFFFFF, 
        0
      );
      
      // Map to nice, accessible colors
      const backgroundColors = [
        '#2ecc71', // Green
        '#3498db', // Blue
        '#9b59b6', // Purple
        '#e74c3c', // Red
        '#f39c12', // Orange
        '#16a085', // Dark Green
        '#8e44ad', // Dark Purple
        '#d35400', // Dark Orange
        '#c0392b', // Dark Red
        '#1abc9c'  // Teal
      ];
      
      backgroundColor = backgroundColors[hash % backgroundColors.length];
    }
    
    // Generate the avatar using the patient's real name
    return await serveAvatarImage(patientName, backgroundColor, textColor);
  } catch (error) {
    console.error('Error generating patient avatar:', error);
    
    // On error, serve a generic fallback avatar
    return await serveAvatarImage('Unknown Patient', '#6c757d', '#ffffff');
  }
}
