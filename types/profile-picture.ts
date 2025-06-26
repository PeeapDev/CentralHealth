// Profile Picture type definitions
export interface ProfilePicture {
  id: string;
  patientId?: string | null;
  userId?: string | null;
  imageUrl: string;
  imageData?: Uint8Array | null;
  mimeType: string;
  filename?: string | null;
  size: number;
  width?: number | null;
  height?: number | null;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy?: string | null;
  ownerType: 'PATIENT' | 'USER';
}

// Type for creating a new profile picture
export interface CreateProfilePictureInput {
  patientId?: string;
  userId?: string;
  imageUrl: string;
  imageData?: Uint8Array;
  mimeType: string;
  filename?: string;
  size: number;
  width?: number;
  height?: number;
  uploadedBy?: string;
  ownerType: 'PATIENT' | 'USER';
}

// Type for updating an existing profile picture
export interface UpdateProfilePictureInput {
  imageUrl?: string;
  imageData?: Uint8Array;
  mimeType?: string;
  filename?: string;
  size?: number;
  width?: number;
  height?: number;
  uploadedBy?: string;
}
