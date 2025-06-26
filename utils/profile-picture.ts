import { prisma } from '@/lib/database/prisma-client';

/**
 * Creates a profile picture entry for a patient
 * 
 * @param patientId - ID of the patient
 * @param imageData - Base64 encoded image data or URL
 * @param mimeType - MIME type of the image (e.g., image/jpeg)
 * @returns The created profile picture record
 */
export async function createPatientProfilePicture(
  patientId: string, 
  imageUrl: string,
  mimeType: string = 'image/jpeg',
  uploadedBy?: string
) {
  try {
    // Calculate size based on imageUrl length as a fallback
    // In real implementation, you'd have the actual file size
    const estimatedSize = imageUrl.length;
    
    const profilePicture = await prisma.profilePicture.create({
      data: {
        patientId,
        imageUrl,
        mimeType,
        size: estimatedSize,
        ownerType: 'PATIENT',
        uploadedBy
      }
    });
    
    return profilePicture;
  } catch (error) {
    console.error('Failed to create profile picture:', error);
    throw new Error('Failed to create profile picture');
  }
}

/**
 * Retrieves a patient's profile picture
 * 
 * @param patientId - ID of the patient
 * @returns The profile picture record or null if not found
 */
export async function getPatientProfilePicture(patientId: string) {
  try {
    const profilePicture = await prisma.profilePicture.findFirst({
      where: {
        patientId,
      }
    });
    
    return profilePicture;
  } catch (error) {
    console.error('Failed to retrieve profile picture:', error);
    return null;
  }
}

/**
 * Updates a patient's profile picture
 * 
 * @param patientId - ID of the patient
 * @param imageData - New base64 encoded image data or URL
 * @param mimeType - MIME type of the image
 * @returns The updated profile picture record
 */
export async function updatePatientProfilePicture(
  patientId: string,
  imageUrl: string,
  mimeType?: string
) {
  try {
    // Find existing profile picture
    const existing = await prisma.profilePicture.findFirst({
      where: {
        patientId,
      }
    });

    if (!existing) {
      // Create new if it doesn't exist
      return createPatientProfilePicture(patientId, imageUrl, mimeType);
    }

    // Calculate size based on imageUrl length as a fallback
    const estimatedSize = imageUrl.length;
    
    // Update existing profile picture
    const profilePicture = await prisma.profilePicture.update({
      where: {
        id: existing.id,
      },
      data: {
        imageUrl,
        mimeType: mimeType || existing.mimeType,
        size: estimatedSize,
        updatedAt: new Date()
      }
    });
    
    return profilePicture;
  } catch (error) {
    console.error('Failed to update profile picture:', error);
    throw new Error('Failed to update profile picture');
  }
}
