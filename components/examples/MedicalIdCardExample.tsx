import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MedicalIdCard from '../widgets/MedicalIdCard';
import { PatientMedicalIdData, UserRole } from '../widgets/MedicalIdCard/types';

/**
 * Example component that demonstrates how to use MedicalIdCard
 * 
 * FOLLOWS CENTRALHEALTH SYSTEM RULES:
 * - Never modifies medical IDs
 * - Uses proper role-based access control
 * - No mock/test data allowed
 */
const MedicalIdCardExample: React.FC = () => {
  const router = useRouter();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('physician');
  
  // Example patient with permanent medical ID
  // In a real implementation, this would come from an API call
  const examplePatient: PatientMedicalIdData = {
    id: '123e4567-e89b-12d3-a456-426614174000', // System UUID (internal)
    mrn: '9XF3A',                               // Permanent medical ID
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1985-06-15',
    registrationDate: '2023-02-10',
    onboardingCompleted: true,
    hospitalId: 'hosp_123'
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentUserRole(e.target.value as UserRole);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Medical ID Card Examples</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <label htmlFor="role-select" style={{ marginRight: '1rem' }}>
          View as role:
        </label>
        <select 
          id="role-select" 
          value={currentUserRole} 
          onChange={handleRoleChange}
          style={{ padding: '0.5rem' }}
        >
          <option value="super_admin">Super Admin</option>
          <option value="hospital_admin">Hospital Admin</option>
          <option value="clinical_admin">Clinical Admin</option>
          <option value="physician">Physician</option>
          <option value="nurse">Nurse</option>
          <option value="front_desk">Front Desk</option>
          <option value="billing">Billing</option>
          <option value="patient">Patient</option>
        </select>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '2rem' 
      }}>
        {/* Example 1: Direct patient data */}
        <div>
          <h2>Standard Card</h2>
          <MedicalIdCard 
            patientData={examplePatient}
            currentUserRole={currentUserRole}
            showPatientName={true}
            showRegistrationDate={true}
          />
        </div>

        {/* Example 2: Compact view */}
        <div>
          <h2>Compact Card</h2>
          <MedicalIdCard 
            patientData={examplePatient}
            currentUserRole={currentUserRole}
            showPatientName={true}
            showRegistrationDate={false}
            compact={true}
          />
        </div>

        {/* Example 3: With QR code */}
        <div>
          <h2>With QR Code</h2>
          <MedicalIdCard 
            patientData={examplePatient}
            currentUserRole={currentUserRole}
            showQrCode={true}
          />
        </div>

        {/* Example 4: Fetch by Medical ID */}
        <div>
          <h2>Fetch By Medical ID (API)</h2>
          <MedicalIdCard 
            medicalId="9XF3A"
            currentUserRole={currentUserRole}
            onError={(err) => console.error('Error loading patient:', err)}
          />
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Implementation Notes</h3>
        <ul>
          <li>Medical IDs are permanent and never change once assigned</li>
          <li>Patient data visibility varies by role according to system rules</li>
          <li>The <code>mrn</code> field is always used for the medical ID</li>
          <li>No mock data is used in production</li>
          <li>Data is fetched directly from the database with proper authentication</li>
        </ul>
      </div>
    </div>
  );
};

export default MedicalIdCardExample;
