/**
 * Main Antenatal Care Component
 * 
 * Primary interface for the Antenatal Care plugin
 */

import React, { useState, useEffect } from 'react';

export default function AntenatalCareMain({ patient, settings, hospital }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Calculate estimated due date based on LMP
  const calculateEDD = (lmp) => {
    if (!lmp) return 'Unknown';
    const date = new Date(lmp);
    date.setDate(date.getDate() + 280); // Add 280 days (40 weeks)
    return date.toLocaleDateString();
  };
  
  // Calculate current gestational age
  const calculateGA = (lmp) => {
    if (!lmp) return 'Unknown';
    const lmpDate = new Date(lmp);
    const today = new Date();
    const diffTime = Math.abs(today - lmpDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return `${weeks} weeks, ${days} days`;
  };
  
  useEffect(() => {
    // In a real implementation, this would fetch antenatal visits from the plugin's data store
    const fetchAntenatalData = async () => {
      try {
        // This is just mock data for demonstration purposes
        setVisits([
          {
            id: '1',
            date: '2025-05-10',
            week: 12,
            bp: '120/80',
            weight: 58,
            fetalHeartRate: 160,
            notes: 'Normal progression. Prescribed prenatal vitamins.'
          },
          {
            id: '2',
            date: '2025-05-31',
            week: 16,
            bp: '118/76',
            weight: 59.2,
            fetalHeartRate: 155,
            notes: 'Patient reports mild morning sickness. Recommended dietary changes.'
          }
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching antenatal data:', error);
        setLoading(false);
      }
    };
    
    fetchAntenatalData();
  }, [patient?.id]);
  
  // Mock patient data for demonstration
  const antenatalData = {
    lmp: '2024-12-15',
    gravida: 2,
    para: 1,
    bloodType: 'O+',
    riskFactors: ['Previous C-section'],
  };
  
  if (loading) {
    return <div className="p-4">Loading antenatal care data...</div>;
  }
  
  return (
    <div className="p-4 space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Pregnancy Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-blue-700">LMP</p>
            <p className="font-medium">{new Date(antenatalData.lmp).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Estimated Due Date</p>
            <p className="font-medium">{calculateEDD(antenatalData.lmp)}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Current Gestational Age</p>
            <p className="font-medium">{calculateGA(antenatalData.lmp)}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Gravida/Para</p>
            <p className="font-medium">G{antenatalData.gravida}P{antenatalData.para}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Blood Type</p>
            <p className="font-medium">{antenatalData.bloodType}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Risk Assessment</p>
            <p className="font-medium">
              {settings?.general_enableRiskAssessment ? 
                (antenatalData.riskFactors.length > 0 ? 'Medium Risk' : 'Low Risk') : 
                'Not Enabled'}
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Antenatal Visits</h2>
          <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">+ New Visit</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FHR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(visit.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{visit.week}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{visit.bp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{visit.weight}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{visit.fetalHeartRate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{visit.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {visits.length === 0 && (
          <div className="text-center py-6 bg-gray-50">
            <p className="text-gray-500">No antenatal visits recorded yet</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Required Laboratory Tests</h3>
          <ul className="space-y-1">
            {settings?.laboratory_requiredTests?.map((test, index) => (
              <li key={index} className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>{test}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Upcoming Appointments</h3>
          <p className="text-gray-500 text-sm">Next visit recommended at week 20</p>
        </div>
      </div>
    </div>
  );
}
