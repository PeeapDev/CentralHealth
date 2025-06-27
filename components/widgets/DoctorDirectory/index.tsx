"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DoctorCard, DoctorData } from './DoctorCard';
import styles from './styles.module.css';

interface DoctorDirectoryProps {
  initialDoctors?: DoctorData[];
  hospitalId?: string;
  onDoctorSelect?: (doctor: DoctorData) => void;
  className?: string;
  title?: string;
  showFilters?: boolean;
}

interface FilterOptions {
  specialty: string;
  hospital: string;
  availability: 'all' | 'available' | 'unavailable';
}

export const DoctorDirectory: React.FC<DoctorDirectoryProps> = ({
  initialDoctors = [],
  hospitalId,
  onDoctorSelect,
  className = '',
  title = 'Doctors',
  showFilters = true,
}) => {
  // State
  const [doctors, setDoctors] = useState<DoctorData[]>(initialDoctors);
  const [loading, setLoading] = useState<boolean>(initialDoctors.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<FilterOptions>({
    specialty: 'all',
    hospital: 'all',
    availability: 'all',
  });

  // Fetch doctors if no initial data is provided
  useEffect(() => {
    const fetchDoctors = async () => {
      if (initialDoctors.length > 0) {
        setDoctors(initialDoctors);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Construct API URL with optional hospitalId filter
        const url = new URL('/api/doctors', window.location.origin);
        if (hospitalId) {
          url.searchParams.append('hospitalId', hospitalId);
        }
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`Error fetching doctors: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (Array.isArray(data)) {
          setDoctors(data);
        } else if (data.doctors && Array.isArray(data.doctors)) {
          setDoctors(data.doctors);
        } else {
          throw new Error('Unexpected response format from API');
        }
      } catch (err) {
        console.error('Error loading doctors:', err);
        setError(err instanceof Error ? err.message : 'Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [initialDoctors, hospitalId]);

  // Extract unique values for filters
  const { specialties, hospitals } = useMemo(() => {
    const uniqueSpecialties = new Set<string>();
    const uniqueHospitals = new Set<string>();

    doctors.forEach(doctor => {
      if (doctor.specialty) uniqueSpecialties.add(doctor.specialty);
      if (doctor.hospitalName) uniqueHospitals.add(doctor.hospitalName);
    });

    return {
      specialties: Array.from(uniqueSpecialties).sort(),
      hospitals: Array.from(uniqueHospitals).sort(),
    };
  }, [doctors]);

  // Apply filters and search
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      // Apply search term filter
      if (searchTerm && !doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Apply specialty filter
      if (filters.specialty !== 'all' && doctor.specialty !== filters.specialty) {
        return false;
      }
      
      // Apply hospital filter
      if (filters.hospital !== 'all' && doctor.hospitalName !== filters.hospital) {
        return false;
      }
      
      // Apply availability filter
      if (filters.availability === 'available' && doctor.available !== true) {
        return false;
      } else if (filters.availability === 'unavailable' && doctor.available !== false) {
        return false;
      }
      
      return true;
    });
  }, [doctors, searchTerm, filters]);

  // Handle filter changes
  const handleFilterChange = (filterName: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  return (
    <div className={`${className} w-full`}>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      
      {showFilters && (
        <div className={styles.filterBar}>
          <input
            type="text"
            placeholder="Search by name or specialty"
            className={`${styles.searchInput} border rounded-md p-2`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex flex-wrap gap-2">
            <select
              className="border rounded-md p-2 text-sm"
              value={filters.specialty}
              onChange={(e) => handleFilterChange('specialty', e.target.value)}
            >
              <option value="all">All Specialties</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
            
            {hospitals.length > 1 && (
              <select
                className="border rounded-md p-2 text-sm"
                value={filters.hospital}
                onChange={(e) => handleFilterChange('hospital', e.target.value)}
              >
                <option value="all">All Hospitals</option>
                {hospitals.map(hospital => (
                  <option key={hospital} value={hospital}>{hospital}</option>
                ))}
              </select>
            )}
            
            <select
              className="border rounded-md p-2 text-sm"
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value as any)}
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="py-10 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2 text-gray-600">Loading doctors...</p>
        </div>
      ) : error ? (
        <div className="py-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-800">{error}</p>
          <button
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-10 text-center border border-dashed rounded-lg">
          <p className="text-gray-500">No doctors found matching your criteria</p>
          {(searchTerm || filters.specialty !== 'all' || filters.hospital !== 'all' || filters.availability !== 'all') && (
            <button
              className="mt-3 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  specialty: 'all',
                  hospital: 'all',
                  availability: 'all',
                });
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className={styles.doctorDirectory}>
          {filteredDoctors.map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onClick={onDoctorSelect}
            />
          ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        {filteredDoctors.length > 0 && (
          <p>Showing {filteredDoctors.length} of {doctors.length} doctors</p>
        )}
      </div>
    </div>
  );
};

export default DoctorDirectory;