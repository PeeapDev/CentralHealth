import React, { useState, useEffect, useCallback } from 'react';
import styles from './styles.module.css';
import { PatientSearchProps, PatientResult, PatientSearchResponse, PatientSearchError, UserRole } from './types';

/**
 * PatientSearch component - Centralized patient search widget
 * Follows CentralHealth system rules:
 * - Never modifies medical IDs
 * - Respects role-based access to protected personal data
 * - Uses proper error handling and validation
 * - No test/mock data allowed
 */
const PatientSearch: React.FC<PatientSearchProps> = ({
  onPatientSelect,
  currentUserRole,
  hospitalId,
  className = '',
  placeholder = 'Search by name, medical ID, or email...',
  maxResults = 10,
  showDetailedView = false,
  headerContent,
  footerContent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PatientResult[]>([]);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState<number | null>(null);
  const [error, setError] = useState<PatientSearchError | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
  });

  // Filter visible fields based on user role
  const getVisibleFields = useCallback((role: UserRole) => {
    // Base fields visible to all roles
    const fields = ['id', 'mrn', 'name', 'hospitalId'];
    
    // Add role-specific fields
    switch (role) {
      case 'super_admin':
      case 'hospital_admin':
        // Add admin-specific fields
        return [
          ...fields,
          'gender',
          'dateOfBirth',
          'age',
          'onboardingCompleted',
          'lastVisit',
          'email',
          'phone',
          'address',
        ];
      case 'clinical_admin':
      case 'physician':
      case 'nurse':
        // Add clinical fields but not all admin fields
        return [
          ...fields,
          'gender',
          'dateOfBirth',
          'age',
          'onboardingCompleted',
          'lastVisit',
          'upcomingAppointment',
        ];
      case 'front_desk':
        // Front desk can see appointment info but limited personal data
        return [...fields, 'gender', 'dateOfBirth', 'upcomingAppointment'];
      case 'billing':
        // Billing sees minimal identification info
        return [...fields];
      default:
        return fields;
    }
  }, []);

  // Perform search
  const searchPatients = useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Use existing API endpoint - DO NOT create new ones per our rules
      const searchParams = new URLSearchParams();
      searchParams.append('query', searchQuery);
      searchParams.append('limit', maxResults.toString());
      searchParams.append('page', pagination.currentPage.toString());
      if (hospitalId) {
        searchParams.append('hospitalId', hospitalId);
      }
      
      // Include role for backend authorization
      searchParams.append('role', currentUserRole);

      const response = await fetch(`/api/patients/search?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for auth
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search patients');
      }

      const data: PatientSearchResponse = await response.json();
      
      // Ensure we never expose protected fields beyond role permissions
      const visibleFields = getVisibleFields(currentUserRole);
      const filteredResults = data.patients.map(patient => {
        const filteredPatient: any = {};
        visibleFields.forEach(field => {
          if (field in patient) {
            filteredPatient[field] = patient[field as keyof typeof patient];
          }
        });
        return filteredPatient as PatientResult;
      });

      setResults(filteredResults);
      setPagination({
        currentPage: data.page || 1,
        totalPages: Math.ceil((data.total || 0) / (data.limit || maxResults)),
        totalResults: data.total || 0,
      });
    } catch (err: any) {
      console.error('Patient search error:', err);
      setError({ message: err.message || 'Failed to search patients' });
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, maxResults, pagination.currentPage, hospitalId, currentUserRole, getVisibleFields]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedPatientIndex(null);
    setPagination({ ...pagination, currentPage: 1 });
    searchPatients();
  };

  // Handle patient selection
  const handlePatientSelect = (patient: PatientResult, index: number) => {
    setSelectedPatientIndex(index);
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
  };

  // Handle pagination
  const changePage = (newPage: number) => {
    setPagination({ ...pagination, currentPage: newPage });
  };

  // Execute search when page changes
  useEffect(() => {
    if (searchQuery.trim() && pagination.currentPage > 0) {
      searchPatients();
    }
  }, [pagination.currentPage, searchPatients]);

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Patient Search</h3>
        {headerContent}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className={styles.searchInput}
          aria-label="Search patients"
        />
        <button 
          type="submit" 
          className={styles.searchButton}
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Results */}
      <div className={styles.resultsContainer}>
        {error && (
          <div className={styles.errorContainer}>
            <p>{error.message}</p>
          </div>
        )}

        {!error && results.length > 0 ? (
          <ul className={styles.resultsList}>
            {results.map((patient, index) => (
              <li
                key={patient.id}
                className={`${styles.resultItem} ${
                  selectedPatientIndex === index ? styles.resultItemSelected : ''
                }`}
                onClick={() => handlePatientSelect(patient, index)}
              >
                <div className={styles.patientName}>{patient.name}</div>
                <div className={styles.patientMedicalId}>ID: {patient.mrn}</div>
                
                {showDetailedView ? (
                  <div className={styles.detailedView}>
                    {/* Display fields based on role permission */}
                    {patient.gender && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Gender</span>
                        <span className={styles.detailValue}>{patient.gender}</span>
                      </div>
                    )}
                    {patient.dateOfBirth && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Date of Birth</span>
                        <span className={styles.detailValue}>
                          {new Date(patient.dateOfBirth).toLocaleDateString()}
                          {patient.age ? ` (${patient.age} years)` : ''}
                        </span>
                      </div>
                    )}
                    {patient.email && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Email</span>
                        <span className={styles.detailValue}>{patient.email}</span>
                      </div>
                    )}
                    {patient.lastVisit && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Last Visit</span>
                        <span className={styles.detailValue}>
                          {new Date(patient.lastVisit).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {patient.upcomingAppointment && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Next Appointment</span>
                        <span className={styles.detailValue}>
                          {new Date(patient.upcomingAppointment).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.patientDetails}>
                    {patient.dateOfBirth && (
                      <span>
                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                        {patient.age ? ` (${patient.age} years)` : ''}
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          !isSearching && (
            <div className={styles.noResults}>
              {searchQuery.trim() ? 'No patients found' : 'Enter search terms to find patients'}
            </div>
          )
        )}
      </div>

      {/* Footer with pagination */}
      {(footerContent || (results.length > 0 && pagination.totalPages > 1)) && (
        <div className={styles.footer}>
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                disabled={pagination.currentPage === 1}
                onClick={() => changePage(pagination.currentPage - 1)}
              >
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className={styles.paginationButton}
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => changePage(pagination.currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
          {footerContent}
        </div>
      )}
    </div>
  );
};

export default PatientSearch;