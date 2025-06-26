import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import { MedicalIdCardProps, PatientMedicalIdData } from './types';
import Image from 'next/image';

/**
 * MedicalIdCard - Displays a patient's permanent medical ID
 * 
 * FOLLOWS CENTRALHEALTH SYSTEM RULES:
 * - Medical IDs are NEVER generated or modified here, only displayed
 * - Uses the mrn field for the permanent NHS-style 5-character alphanumeric ID
 * - No mock/test data is allowed
 * - Role-based access controls what information is visible
 */
const MedicalIdCard: React.FC<MedicalIdCardProps> = ({
  patientData,
  patientId,
  medicalId,
  showPatientName = true,
  showRegistrationDate = true,
  showQrCode = false,
  compact = false,
  currentUserRole,
  className = '',
  onError,
}) => {
  const [loading, setLoading] = useState(!patientData);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientMedicalIdData | null>(patientData || null);

  // Check if role has access to view full patient details
  const canViewFullDetails = ['super_admin', 'hospital_admin', 'clinical_admin', 'physician', 'nurse'].includes(currentUserRole);
  
  // Check if role has access to personal patient information
  const canViewPersonalInfo = ['super_admin', 'hospital_admin', 'clinical_admin', 'physician', 'nurse', 'front_desk'].includes(currentUserRole);

  // Fetch patient data if not provided directly
  useEffect(() => {
    const fetchPatientData = async () => {
      // Skip fetch if we already have patient data
      if (patientData) {
        setPatient(patientData);
        return;
      }

      if (!patientId && !medicalId) {
        setError('No patient identifier provided');
        setLoading(false);
        if (onError) onError(new Error('No patient identifier provided'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Construct the API path based on available identifiers
        let apiPath: string;
        
        if (medicalId) {
          // Using the medical ID (mrn) directly if provided
          apiPath = `/api/patients/search?medicalId=${encodeURIComponent(medicalId)}`;
        } else if (patientId) {
          // Using the system ID if provided
          apiPath = `/api/patients/${encodeURIComponent(patientId)}`;
        } else {
          throw new Error('No valid patient identifier provided');
        }

        const response = await fetch(apiPath, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for auth
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch patient data: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle different response structures
        let patientRecord: PatientMedicalIdData;
        
        if (Array.isArray(data.patients)) {
          // Search API response
          if (data.patients.length === 0) {
            throw new Error('Patient not found');
          }
          patientRecord = data.patients[0];
        } else if (data.patient) {
          // Single patient response
          patientRecord = data.patient;
        } else {
          // Direct patient data
          patientRecord = data;
        }

        // Validate that we have the required mrn field
        if (!patientRecord.mrn) {
          throw new Error('Patient record missing medical ID');
        }

        setPatient(patientRecord);
      } catch (err: any) {
        console.error('Error fetching patient medical ID data:', err);
        setError(err.message || 'Failed to load patient data');
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientData, patientId, medicalId, onError]);

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  // Generate patient name based on permissions
  const getPatientName = (): string => {
    if (!patient || !canViewPersonalInfo) return '';
    
    const firstName = patient.firstName || '';
    const lastName = patient.lastName || '';
    
    if (!firstName && !lastName) return '';
    return `${firstName} ${lastName}`.trim();
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`${styles.card} ${className}`}>
        <div className={styles.loadingContainer}>
          <div className={styles.loading}></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !patient) {
    return (
      <div className={`${styles.card} ${className}`}>
        <div className={styles.errorContainer}>
          <p>{error || 'Unable to load medical ID'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${compact ? styles.cardCompact : ''} ${className}`}>
      {/* Card watermark */}
      <div className={styles.watermark}>ID</div>

      {/* Card content */}
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.cardTitle}>Patient Medical ID</h3>
          <div>
            <Image 
              src="/images/hospital-logo.svg" 
              alt="Hospital Logo" 
              className={styles.hospitalLogo}
              width={32}
              height={32}
            />
          </div>
        </div>

        {/* Medical ID */}
        <div className={styles.idContainer}>
          <div className={styles.idLabel}>Medical ID</div>
          <div className={styles.medicalId}>{patient.mrn}</div>
        </div>

        {/* Patient Info */}
        {showPatientName && getPatientName() && (
          <div className={styles.patientInfo}>
            <div className={styles.patientName}>{getPatientName()}</div>
            {showRegistrationDate && canViewFullDetails && patient.registrationDate && (
              <div className={styles.registrationDate}>
                Registered: {formatDate(patient.registrationDate)}
              </div>
            )}
          </div>
        )}

        {/* QR Code */}
        {showQrCode && !compact && (
          <div className={styles.qrCodeContainer}>
            <div className={styles.qrCode}>
              {/* QR code would be generated here based on medical ID */}
              {/* Using placeholder for now */}
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                QR: {patient.mrn}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalIdCard;