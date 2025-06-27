"use client";

import { useState } from 'react';
import QRCode from 'react-qr-code';

interface QrCodeTesterProps {
  onClose?: () => void;
}

/**
 * QR Code Test Utility
 * 
 * This component generates test QR codes in the correct format for scanning tests.
 * It follows the NHS-style 5-character alphanumeric format for medical IDs.
 */
export function QrCodeTester({ onClose }: QrCodeTesterProps) {
  const [medicalId, setMedicalId] = useState('');
  const [qrValue, setQrValue] = useState('');
  
  const generateRandomId = () => {
    // Generate NHS-style 5-character alphanumeric ID
    // Exclude confusing characters: i, l, 1, o, 0
    const validChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let result = '';
    
    for (let i = 0; i < 5; i++) {
      result += validChars.charAt(Math.floor(Math.random() * validChars.length));
    }
    
    setMedicalId(result);
    setQrValue(`CentralHealth:${result}`);
  };

  const handleCustomId = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 5);
    setMedicalId(value);
    if (value) {
      setQrValue(`CentralHealth:${value}`);
    } else {
      setQrValue('');
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">QR Code Test Utility</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Medical ID (5 characters)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={medicalId}
            onChange={handleCustomId}
            placeholder="AB123"
            className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onClick={generateRandomId}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Generate Random
          </button>
        </div>
      </div>

      {qrValue && (
        <div className="flex flex-col items-center p-4 border rounded bg-gray-50">
          <QRCode 
            value={qrValue}
            size={200}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
          <p className="mt-4 text-sm text-gray-600">
            QR Code Value: <span className="font-mono font-semibold">{qrValue}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Scan this code with the patient search widget's QR scanner
          </p>
        </div>
      )}
    </div>
  );
}
