// Real doctor data will come from API
// This is temporary mock data for UI development only

export interface Doctor {
  id: string;
  name: string;
  hospital: string;
  profession: string;
  yearsOfService: number;
  about: string;
  imageUrl?: string;
  availability?: {
    days: string[];
    hours: string;
  };
}

// Mock data - will be replaced with real API data
export const mockDoctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Osman Ahmed',
    hospital: 'Central Hospital',
    profession: 'Cardiologist',
    yearsOfService: 12,
    about: 'Dr. Osman is a board-certified cardiologist specializing in advanced cardiovascular treatments and preventive care.',
    imageUrl: '/images/doctors/default-doctor.png', // Will use fallback if not found
    availability: {
      days: ['Monday', 'Wednesday', 'Friday'],
      hours: '9:00 AM - 5:00 PM'
    }
  },
  {
    id: 'doc-2',
    name: 'Dr. Sarah Johnson',
    hospital: 'City Medical Center',
    profession: 'Neurologist',
    yearsOfService: 8,
    about: 'Dr. Johnson is a specialist in neurological disorders with a focus on stroke prevention and recovery.',
    availability: {
      days: ['Tuesday', 'Thursday', 'Saturday'],
      hours: '10:00 AM - 6:00 PM'
    }
  },
  {
    id: 'doc-3',
    name: 'Dr. Michael Chen',
    hospital: 'Central Hospital',
    profession: 'Pediatrician',
    yearsOfService: 15,
    about: 'Dr. Chen is a pediatric specialist with extensive experience in children\'s health and development.',
    availability: {
      days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
      hours: '8:00 AM - 4:00 PM'
    }
  },
  {
    id: 'doc-4',
    name: 'Dr. Emily Rodriguez',
    hospital: 'Metro Health',
    profession: 'Dermatologist',
    yearsOfService: 6,
    about: 'Dr. Rodriguez specializes in skin conditions and advanced dermatological treatments.',
    availability: {
      days: ['Monday', 'Wednesday', 'Friday'],
      hours: '9:00 AM - 3:00 PM'
    }
  },
  {
    id: 'doc-5',
    name: 'Dr. James Wilson',
    hospital: 'Central Hospital',
    profession: 'Orthopedic Surgeon',
    yearsOfService: 14,
    about: 'Dr. Wilson is an orthopedic specialist focusing on joint replacement and sports injuries.',
    availability: {
      days: ['Tuesday', 'Thursday'],
      hours: '11:00 AM - 7:00 PM'
    }
  },
  {
    id: 'doc-6',
    name: 'Dr. Lisa Thomas',
    hospital: 'North Medical',
    profession: 'Pulmonologist',
    yearsOfService: 9,
    about: 'Dr. Thomas specializes in respiratory conditions and lung health management.',
    availability: {
      days: ['Wednesday', 'Thursday', 'Friday'],
      hours: '10:00 AM - 4:00 PM'
    }
  }
];

// Categorized doctors by specialty
export const getSpecialistDoctors = () => {
  return {
    cardiologists: mockDoctors.filter(doctor => 
      doctor.profession.toLowerCase().includes('cardio')),
    pediatricians: mockDoctors.filter(doctor => 
      doctor.profession.toLowerCase().includes('pediatr')),
    // Add other specialties as needed
    allDoctors: mockDoctors
  };
};

// Doctors from current hospital
export const getDoctorsByHospital = (hospitalName: string) => {
  return mockDoctors.filter(doctor => 
    doctor.hospital.toLowerCase().includes(hospitalName.toLowerCase())
  );
};
