"use client";

import React, { useState } from 'react';
import { QrCodeTester } from '@/components/qr-code-tester';
import DoctorDirectory from '@/components/widgets/DoctorDirectory';
import { DoctorData } from '@/components/widgets/DoctorDirectory/DoctorCard';
import { PatientSearchWidget } from '@/components/patient-search-widget';
import Link from 'next/link';

// Sample doctor data for testing (will be replaced by API data in production)
const SAMPLE_DOCTORS: DoctorData[] = [
  {
    id: 'doc-001',
    name: 'Dr. Sarah Johnson',
    title: 'Chief Medical Officer',
    specialty: 'Cardiology',
    hospitalName: 'Central Hospital',
    hospitalId: 'hosp-001',
    photoUrl: '/images/default-doctor.png',
    ratings: 4.8,
    reviewCount: 124,
    available: true,
    experience: '15 years',
    languages: ['English', 'Spanish'],
    education: ['Harvard Medical School', 'Johns Hopkins Residency']
  },
  {
    id: 'doc-002',
    name: 'Dr. Michael Chen',
    title: 'Senior Specialist',
    specialty: 'Pediatrics',
    hospitalName: 'Children\'s Medical Center',
    hospitalId: 'hosp-002',
    photoUrl: '/images/default-doctor.png',
    ratings: 4.9,
    reviewCount: 98,
    available: true,
    experience: '12 years',
    languages: ['English', 'Mandarin']
  },
  {
    id: 'doc-003',
    name: 'Dr. Emily Rodriguez',
    title: 'Department Head',
    specialty: 'Neurology',
    hospitalName: 'Central Hospital',
    hospitalId: 'hosp-001',
    photoUrl: '/images/default-doctor.png',
    ratings: 4.7,
    reviewCount: 87,
    available: false,
    experience: '10 years',
    languages: ['English', 'Spanish']
  },
  {
    id: 'doc-004',
    name: 'Dr. James Wilson',
    title: 'Attending Physician',
    specialty: 'Orthopedics',
    hospitalName: 'Sports Medicine Institute',
    hospitalId: 'hosp-003',
    photoUrl: '/images/default-doctor.png',
    ratings: 4.5,
    reviewCount: 76,
    available: true,
    experience: '8 years'
  },
  {
    id: 'doc-005',
    name: 'Dr. Maria Santos',
    title: 'Specialist',
    specialty: 'Obstetrics',
    hospitalName: 'Women\'s Health Center',
    hospitalId: 'hosp-004',
    photoUrl: '/images/default-doctor.png',
    ratings: 4.9,
    reviewCount: 112,
    available: true,
    experience: '14 years'
  },
  {
    id: 'doc-006',
    name: 'Dr. Robert Kim',
    title: 'Research Director',
    specialty: 'Oncology',
    hospitalName: 'Central Hospital',
    hospitalId: 'hosp-001',
    photoUrl: '/images/default-doctor.png',
    ratings: 4.6,
    reviewCount: 93,
    available: false
  }
];

export default function HospitalWidgetsTest() {
  const [selectedTab, setSelectedTab] = useState<'qr-test' | 'doctors' | 'patient-search'>('doctors');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorData | null>(null);
  
  // Handle doctor selection
  const handleDoctorSelect = (doctor: DoctorData) => {
    setSelectedDoctor(doctor);
  };

  // Handle patient selection from search
  const handlePatientSelect = (patient: any) => {
    console.log('Selected patient:', patient);
    // In production, you'd navigate to patient details or perform other actions
    alert(`Selected patient: ${patient.name} (Medical ID: ${patient.mrn || 'N/A'})`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Hospital Widgets Test Suite
          </h1>
          <p className="text-gray-600">
            Test the QR code functionality and doctor directory widget
          </p>
          <nav className="mt-4">
            <div className="flex border-b border-gray-200">
              <button 
                className={`px-4 py-2 ${selectedTab === 'doctors' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                onClick={() => setSelectedTab('doctors')}
              >
                Doctor Directory
              </button>
              <button 
                className={`px-4 py-2 ${selectedTab === 'qr-test' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                onClick={() => setSelectedTab('qr-test')}
              >
                QR Code Tester
              </button>
              <button 
                className={`px-4 py-2 ${selectedTab === 'patient-search' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                onClick={() => setSelectedTab('patient-search')}
              >
                Patient Search
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Back to dashboard link */}
        <div className="mb-6">
          <Link href="http://localhost:3005/patient/dashboard?ts=1750984513474" className="text-blue-600 hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        
        {selectedTab === 'qr-test' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">QR Code Testing Tool</h2>
            <p className="mb-4 text-gray-600">
              Generate test QR codes to scan with the patient search widget.
              Each QR code follows the format <code className="bg-gray-100 px-1 rounded">CentralHealth:MRN</code> where MRN is a 5-character medical ID.
            </p>
            <div className="max-w-md mx-auto">
              <QrCodeTester />
            </div>
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-yellow-800">Testing Instructions</h3>
              <ol className="mt-2 text-sm text-yellow-700 list-decimal pl-5 space-y-1">
                <li>Generate a QR code using the tool above</li>
                <li>Go to the Patient Search tab and click the QR code scanner button</li>
                <li>Scan the generated QR code using your device camera</li>
                <li>Verify that the patient search interface correctly processes the medical ID</li>
              </ol>
            </div>
          </div>
        )}
        
        {selectedTab === 'doctors' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Doctor Directory Widget</h2>
              <p className="mb-4 text-gray-600">
                Browse and filter doctors across different hospitals. 
                In production, this data would come from the real API.
              </p>
              
              <DoctorDirectory 
                initialDoctors={SAMPLE_DOCTORS} 
                title="Doctors from All Hospitals"
                onDoctorSelect={handleDoctorSelect}
              />
            </div>
            
            {selectedDoctor && (
              <div className="bg-white rounded-lg shadow p-6 mt-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">Selected Doctor Details</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-600" 
                    onClick={() => setSelectedDoctor(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="mt-1">{selectedDoctor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Title</p>
                    <p className="mt-1">{selectedDoctor.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Specialty</p>
                    <p className="mt-1">{selectedDoctor.specialty}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Hospital</p>
                    <p className="mt-1">{selectedDoctor.hospitalName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Experience</p>
                    <p className="mt-1">{selectedDoctor.experience || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Languages</p>
                    <p className="mt-1">{selectedDoctor.languages?.join(', ') || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Education</p>
                    <p className="mt-1">{selectedDoctor.education?.join(', ') || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {selectedTab === 'patient-search' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Patient Search Widget</h2>
            <p className="mb-4 text-gray-600">
              Search for patients by name, email, or medical ID. 
              Click the QR code icon to scan a QR code generated by the QR Code Tester.
            </p>
            
            <div className="max-w-md mx-auto">
              <PatientSearchWidget 
                onSelect={handlePatientSelect}
                showCameraButton={true}
              />
            </div>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800">Note</h3>
              <p className="mt-2 text-sm text-blue-700">
                This widget connects to the actual patient search API and will retrieve real patient records from the database.
                In accordance with hospital policy, all retrieved patient data is real and authentic - no test or mock data is used.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
