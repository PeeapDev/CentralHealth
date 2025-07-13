/**
 * Utility functions for handling patient referrals
 * Follows CentralHealth System requirements for medical IDs
 */

import { v4 as uuidv4 } from 'uuid';

// Define referral priority and status types
export type ReferralPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';
export type ReferralStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

// Define status history entry type
export interface StatusHistoryEntry {
  from: string;
  to: string;
  timestamp: string;
  updatedBy?: string;
}

/**
 * Define the referral type with all required fields
 * Ensures mrn is used as the standard field for medical IDs
 */
export interface PatientReferral {
  id: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  referralCode: string;
  patientId: string;
  patientName: string;
  mrn: string; // Medical ID following NHS-style 5-character alphanumeric format
  referringHospitalId: string;
  referringHospitalName: string;
  receivingHospitalId: string;
  receivingHospitalName: string;
  priority: ReferralPriority;
  status: ReferralStatus;
  notes?: string;
  reason: string;
  requiresAmbulance: boolean;
  statusHistory: StatusHistoryEntry[];
}

const STORAGE_KEY = 'centralhealth_patient_referrals';

/**
 * Check if we're in a browser environment
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
};

/**
 * Generate a unique referral code
 * Format: REF-XXXXX (where X is alphanumeric)
 */
export function generateReferralCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "REF-";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Save a referral to local storage
 */
export function saveReferral(referral: PatientReferral): PatientReferral {
  if (!isBrowser()) {
    console.warn('Cannot save referral: not in browser environment');
    return referral;
  }
  
  try {
    // Get existing referrals
    const existingReferrals = getAllReferrals();
    
    // Check if this is an update to an existing referral
    const existingIndex = existingReferrals.findIndex(r => r.id === referral.id);
    
    if (existingIndex >= 0) {
      // Update existing referral
      existingReferrals[existingIndex] = {
        ...referral,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new referral with generated ID if not provided
      const newReferral = {
        ...referral,
        id: referral.id || uuidv4(),
        createdAt: referral.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        referralCode: referral.referralCode || generateReferralCode(),
        statusHistory: referral.statusHistory || [{
          from: '',
          to: referral.status,
          timestamp: new Date().toISOString()
        }]
      };
      
      existingReferrals.unshift(newReferral);
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingReferrals));
    
    // Dispatch events to notify components
    if (typeof window !== 'undefined') {
      // Custom event for referral changes
      const event = new CustomEvent('referralUpdated', { 
        detail: existingIndex >= 0 ? 'updated' : 'created'
      });
      window.dispatchEvent(event);
      
      // Also dispatch storage event for components listening to storage changes
      window.dispatchEvent(new Event('storage'));
    }
    
    return existingIndex >= 0 ? existingReferrals[existingIndex] : existingReferrals[0];
  } catch (error) {
    console.error('Error saving referral to local storage:', error);
    return referral;
  }
}

/**
 * Get all referrals from local storage
 */
export function getAllReferrals(): PatientReferral[] {
  if (!isBrowser()) {
    console.warn('Cannot get referrals: not in browser environment');
    return [];
  }
  
  try {
    const storedReferrals = localStorage.getItem(STORAGE_KEY);
    if (!storedReferrals) {
      return [];
    }
    
    return JSON.parse(storedReferrals) as PatientReferral[];
  } catch (error) {
    console.error('Error retrieving referrals from local storage:', error);
    return [];
  }
}

/**
 * Get referrals for a specific patient by medical ID (mrn)
 * Ensures we use the standardized mrn field for medical IDs
 */
export function getPatientReferrals(mrn: string): PatientReferral[] {
  if (!mrn) {
    console.warn('Cannot get patient referrals: no medical ID provided');
    return [];
  }
  
  try {
    const allReferrals = getAllReferrals();
    return allReferrals.filter(referral => referral.mrn === mrn);
  } catch (error) {
    console.error('Error retrieving patient referrals:', error);
    return [];
  }
}

/**
 * Get referrals for a specific hospital (either as referring or receiving)
 */
export function getHospitalReferrals(hospitalId: string): PatientReferral[] {
  if (!hospitalId) {
    console.warn('Cannot get hospital referrals: no hospital ID provided');
    return [];
  }
  
  try {
    const allReferrals = getAllReferrals();
    return allReferrals.filter(referral => 
      referral.referringHospitalId === hospitalId || 
      referral.receivingHospitalId === hospitalId
    );
  } catch (error) {
    console.error('Error retrieving hospital referrals:', error);
    return [];
  }
}

/**
 * Update the status of a referral
 */
export function updateReferralStatus(
  referralId: string, 
  newStatus: ReferralStatus, 
  updatedBy?: string
): PatientReferral | null {
  if (!isBrowser()) {
    console.warn('Cannot update referral status: not in browser environment');
    return null;
  }
  
  try {
    const allReferrals = getAllReferrals();
    const referralIndex = allReferrals.findIndex(r => r.id === referralId);
    
    if (referralIndex === -1) {
      console.warn(`Referral with ID ${referralId} not found`);
      return null;
    }
    
    const referral = allReferrals[referralIndex];
    const oldStatus = referral.status;
    
    // Only update if status is actually changing
    if (oldStatus === newStatus) {
      return referral;
    }
    
    // Create status history entry
    const statusEntry: StatusHistoryEntry = {
      from: oldStatus,
      to: newStatus,
      timestamp: new Date().toISOString(),
      updatedBy
    };
    
    // Update the referral
    const updatedReferral: PatientReferral = {
      ...referral,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      completedAt: ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(newStatus) 
        ? new Date().toISOString() 
        : referral.completedAt,
      statusHistory: [...(referral.statusHistory || []), statusEntry]
    };
    
    // Update in the array
    allReferrals[referralIndex] = updatedReferral;
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allReferrals));
    
    // Dispatch events
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('referralUpdated', { 
        detail: { id: referralId, status: newStatus }
      });
      window.dispatchEvent(event);
      window.dispatchEvent(new Event('storage'));
    }
    
    return updatedReferral;
  } catch (error) {
    console.error('Error updating referral status:', error);
    return null;
  }
}

/**
 * Delete a referral
 * Note: In a production system, referrals should typically be cancelled rather than deleted
 */
export function deleteReferral(referralId: string): boolean {
  if (!isBrowser()) {
    console.warn('Cannot delete referral: not in browser environment');
    return false;
  }
  
  try {
    const allReferrals = getAllReferrals();
    const filteredReferrals = allReferrals.filter(r => r.id !== referralId);
    
    if (filteredReferrals.length === allReferrals.length) {
      console.warn(`Referral with ID ${referralId} not found`);
      return false;
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredReferrals));
    
    // Dispatch events
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('referralUpdated', { 
        detail: { id: referralId, action: 'deleted' }
      });
      window.dispatchEvent(event);
      window.dispatchEvent(new Event('storage'));
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting referral:', error);
    return false;
  }
}

/**
 * Get referral statistics for a patient
 */
export function getPatientReferralStats(mrn: string) {
  const referrals = getPatientReferrals(mrn);
  
  return {
    total: referrals.length,
    pending: referrals.filter(r => r.status === 'PENDING').length,
    accepted: referrals.filter(r => r.status === 'ACCEPTED').length,
    completed: referrals.filter(r => r.status === 'COMPLETED').length,
    rejected: referrals.filter(r => r.status === 'REJECTED').length,
    cancelled: referrals.filter(r => r.status === 'CANCELLED').length,
    urgent: referrals.filter(r => r.priority === 'URGENT' || r.priority === 'EMERGENCY').length
  };
}

/**
 * Get referral statistics for a hospital
 */
export function getHospitalReferralStats(hospitalId: string) {
  const referrals = getHospitalReferrals(hospitalId);
  const referringReferrals = referrals.filter(r => r.referringHospitalId === hospitalId);
  const receivingReferrals = referrals.filter(r => r.receivingHospitalId === hospitalId);
  
  return {
    total: referrals.length,
    referring: {
      total: referringReferrals.length,
      pending: referringReferrals.filter(r => r.status === 'PENDING').length,
      accepted: referringReferrals.filter(r => r.status === 'ACCEPTED').length,
      completed: referringReferrals.filter(r => r.status === 'COMPLETED').length,
      rejected: referringReferrals.filter(r => r.status === 'REJECTED').length,
      cancelled: referringReferrals.filter(r => r.status === 'CANCELLED').length,
    },
    receiving: {
      total: receivingReferrals.length,
      pending: receivingReferrals.filter(r => r.status === 'PENDING').length,
      accepted: receivingReferrals.filter(r => r.status === 'ACCEPTED').length,
      completed: receivingReferrals.filter(r => r.status === 'COMPLETED').length,
      rejected: receivingReferrals.filter(r => r.status === 'REJECTED').length,
      cancelled: receivingReferrals.filter(r => r.status === 'CANCELLED').length,
    }
  };
}
