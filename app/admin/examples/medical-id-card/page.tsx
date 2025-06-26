'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled to avoid NextRouter not mounted errors
const MedicalIdCardExample = dynamic(
  () => import('../../../../components/examples/MedicalIdCardExample'),
  { ssr: false }
);

/**
 * Example page for Medical ID Card component in admin panel
 * 
 * This page demonstrates the Medical ID Card component with various configurations
 * and provides documentation on its proper usage according to hospital system rules.
 */
const MedicalIdCardExamplePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Medical ID Card Component</h1>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This example demonstrates the Medical ID Card component that displays patient medical IDs
              according to CentralHealth system rules:
            </p>
            
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Medical IDs are permanent and immutable 5-character alphanumeric codes</li>
              <li>Medical IDs are stored consistently in the mrn field in patient records</li>
              <li>No test/mock data allowed</li>
              <li>Role-based access control determines what information is visible</li>
            </ul>
          </div>
          
          <MedicalIdCardExample />
        </div>
      </div>
    </div>
  );
};

export default MedicalIdCardExamplePage;
