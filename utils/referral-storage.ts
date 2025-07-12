/**
 * Utility for managing referrals in local storage
 * Provides a fallback mechanism when the API fails
 */

/**
 * Define status history entry type
 */
export interface StatusHistoryEntry {
  from: string;
  to: string;
  timestamp: string;
}

/**
 * Define the referral type with all required fields
 */
export interface LocalReferral {
  id: string;
  createdAt: string;
  updatedAt?: string;
  referralCode: string;
  patientId: string;
  patientName: string;
  mrn: string; // Medical ID following NHS-style 5-character alphanumeric format
  fromHospitalId: string;
  fromHospitalName: string;
  toHospitalId: string;
  toHospitalName: string;
  priority: string;
  status: string;
  notes?: string;
  reason: string;
  requiresAmbulance: boolean;
  statusHistory?: StatusHistoryEntry[];
}

const STORAGE_KEY = 'centralhealth_referrals';

/**
 * Check if we're in a browser environment
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
};

/**
 * Save a referral to local storage
 */
export function saveReferralToLocalStorage(referral: LocalReferral): void {
  if (!isBrowser()) {
    console.warn('Cannot save referral: not in browser environment');
    return;
  }
  
  try {
    // Get existing referrals
    const existingReferrals = getReferralsFromLocalStorage();
    
    // Add new referral
    existingReferrals.push(referral);
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingReferrals));
    
    console.log(`Referral saved to local storage: ${referral.referralCode}`);
  } catch (error) {
    console.error('Error saving referral to local storage:', error);
  }
}

/**
 * Get all referrals from local storage
 */
export function getReferralsFromLocalStorage(): LocalReferral[] {
  if (!isBrowser()) {
    console.warn('Cannot get referrals: not in browser environment');
    return [];
  }
  
  try {
    const storedReferrals = localStorage.getItem(STORAGE_KEY);
    if (!storedReferrals) {
      return [];
    }
    
    return JSON.parse(storedReferrals) as LocalReferral[];
  } catch (error) {
    console.error('Error retrieving referrals from local storage:', error);
    return [];
  }
}

/**
 * Get referrals for a specific patient by medical ID (mrn)
 */
export function getPatientReferrals(mrn: string): LocalReferral[] {
  try {
    const allReferrals = getReferralsFromLocalStorage();
    return allReferrals.filter(referral => referral.mrn === mrn);
  } catch (error) {
    console.error('Error retrieving patient referrals:', error);
    return [];
  }
}

/**
 * Get referrals for a specific hospital
 */
export function getHospitalReferrals(hospitalId: string): LocalReferral[] {
  try {
    const allReferrals = getReferralsFromLocalStorage();
    return allReferrals.filter(
      referral => referral.fromHospitalId === hospitalId || referral.toHospitalId === hospitalId
    );
  } catch (error) {
    console.error('Error retrieving hospital referrals:', error);
    return [];
  }
}

/**
 * Update a referral's status
 */
export function updateReferralStatus(referralId: string, newStatus: string): { success: boolean; message: string } {
  if (!isBrowser()) {
    return { success: false, message: 'Cannot update referral: not in browser environment' };
  }
  
  try {
    const allReferrals = getReferralsFromLocalStorage();
    const referralIndex = allReferrals.findIndex(r => r.id === referralId);
    
    if (referralIndex === -1) {
      return { success: false, message: 'Referral not found' };
    }
    
    const referral = allReferrals[referralIndex];
    const oldStatus = referral.status;
    
    // Don't update if status is the same
    if (oldStatus === newStatus) {
      return { success: false, message: `Referral is already ${newStatus}` };
    }
    
    // Update the status
    referral.status = newStatus;
    
    // Add timestamp for status change
    referral.updatedAt = new Date().toISOString();
    
    // Add status history if it doesn't exist
    if (!referral.statusHistory) {
      referral.statusHistory = [];
    }
    
    // Add status change to history
    referral.statusHistory.push({
      from: oldStatus,
      to: newStatus,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allReferrals));
    
    // Attempt to update via API if available (silently)
    try {
      fetch(`/api/referrals/${referralId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).catch(err => {
        console.log('API update failed (silent)', err);
      });
    } catch (apiError) {
      // Ignore API errors - local storage is the source of truth
    }
    
    return { 
      success: true, 
      message: `Referral status updated from ${oldStatus} to ${newStatus}` 
    };
  } catch (error) {
    console.error('Error updating referral status:', error);
    return { success: false, message: 'Failed to update referral status' };
  }
}

/**
 * Generate a unique referral code
 */
export function generateReferralCode(): string {
  const prefix = 'REF';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a unique ID
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
