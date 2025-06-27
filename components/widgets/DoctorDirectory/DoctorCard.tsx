import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './styles.module.css';

export interface DoctorData {
  id: string;
  name: string;
  title: string;
  specialty: string;
  hospitalName: string;
  hospitalId: string;
  photoUrl: string;
  ratings?: number;
  reviewCount?: number;
  available?: boolean;
  experience?: string;
  languages?: string[];
  education?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

export const DoctorCard: React.FC<{
  doctor: DoctorData;
  onClick?: (doctor: DoctorData) => void;
  className?: string;
}> = ({ doctor, onClick, className = '' }) => {
  const defaultImage = '/images/default-doctor.png';
  
  const handleClick = () => {
    if (onClick) {
      onClick(doctor);
    }
  };
  
  return (
    <div 
      className={`${styles.doctorCard} ${className} rounded-lg shadow-md bg-white overflow-hidden transition-transform hover:shadow-lg`} 
      onClick={handleClick}
    >
      <div className="p-4 flex">
        <div className="mr-4 flex-shrink-0">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-blue-100">
            <Image
              src={doctor.photoUrl || defaultImage}
              alt={`Dr. ${doctor.name}`}
              width={80}
              height={80}
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = defaultImage;
              }}
            />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">{doctor.name}</h3>
          <p className="text-sm text-gray-600 mb-1">{doctor.title} - {doctor.specialty}</p>
          
          <div className="text-xs text-gray-500 mb-2">
            {doctor.hospitalName}
          </div>
          
          {doctor.ratings !== undefined && (
            <div className="flex items-center">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(doctor.ratings!) ? 'text-yellow-400' : 'text-gray-300'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-1 text-xs text-gray-600">
                {doctor.ratings.toFixed(1)} ({doctor.reviewCount} reviews)
              </span>
            </div>
          )}
        </div>
      </div>
      
      {doctor.available !== undefined && (
        <div className={`px-4 py-2 text-xs font-medium ${doctor.available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {doctor.available ? 'Available for Appointments' : 'Currently Unavailable'}
        </div>
      )}
    </div>
  );
};