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
  },
  {
    id: 'doc-7',
    name: 'Dr. David Park',
    hospital: 'Central Hospital',
    profession: 'Endocrinologist',
    yearsOfService: 11,
    about: 'Dr. Park specializes in hormone-related disorders and diabetes management.',
    availability: {
      days: ['Monday', 'Wednesday', 'Friday'],
      hours: '8:00 AM - 3:00 PM'
    }
  },
  {
    id: 'doc-8',
    name: 'Dr. Amina Hassan',
    hospital: 'City Medical Center',
    profession: 'Ophthalmologist',
    yearsOfService: 7,
    about: 'Dr. Hassan is an eye specialist focusing on retinal disorders and cataract surgery.',
    availability: {
      days: ['Tuesday', 'Thursday'],
      hours: '9:00 AM - 5:00 PM'
    }
  },
  {
    id: 'doc-9',
    name: 'Dr. Robert Kang',
    hospital: 'Central Hospital',
    profession: 'Gastroenterologist',
    yearsOfService: 13,
    about: 'Dr. Kang specializes in digestive disorders and advanced endoscopic procedures.',
    availability: {
      days: ['Monday', 'Tuesday', 'Thursday'],
      hours: '10:00 AM - 6:00 PM'
    }
  },
  {
    id: 'doc-10',
    name: 'Dr. Fatima Al-Farsi',
    hospital: 'Metro Health',
    profession: 'Rheumatologist',
    yearsOfService: 10,
    about: 'Dr. Al-Farsi specializes in autoimmune disorders and inflammatory conditions.',
    availability: {
      days: ['Wednesday', 'Friday'],
      hours: '8:30 AM - 4:30 PM'
    }
  },
  {
    id: 'doc-11',
    name: 'Dr. William Turner',
    hospital: 'Central Hospital',
    profession: 'Urologist',
    yearsOfService: 15,
    about: 'Dr. Turner specializes in urinary tract disorders and minimally invasive surgical procedures.',
    availability: {
      days: ['Monday', 'Thursday', 'Friday'],
      hours: '9:00 AM - 5:00 PM'
    }
  },
  {
    id: 'doc-12',
    name: 'Dr. Sofia Martinez',
    hospital: 'North Medical',
    profession: 'Allergist',
    yearsOfService: 6,
    about: 'Dr. Martinez specializes in allergy testing, immunotherapy, and asthma management.',
    availability: {
      days: ['Tuesday', 'Wednesday', 'Friday'],
      hours: '10:00 AM - 4:00 PM'
    }
  },
  {
    id: 'doc-13',
    name: 'Dr. Jamal Ibrahim',
    hospital: 'Central Hospital',
    profession: 'Hematologist',
    yearsOfService: 12,
    about: 'Dr. Ibrahim specializes in blood disorders and cancer treatments related to blood.',
    availability: {
      days: ['Monday', 'Tuesday', 'Thursday'],
      hours: '8:00 AM - 3:00 PM'
    }
  },
  {
    id: 'doc-14',
    name: 'Dr. Grace Wong',
    hospital: 'City Medical Center',
    profession: 'Nephrologist',
    yearsOfService: 9,
    about: 'Dr. Wong specializes in kidney disease management and transplant care.',
    availability: {
      days: ['Wednesday', 'Friday'],
      hours: '9:00 AM - 6:00 PM'
    }
  },
  {
    id: 'doc-15',
    name: 'Dr. Marcus Brown',
    hospital: 'Central Hospital',
    profession: 'Psychiatrist',
    yearsOfService: 11,
    about: 'Dr. Brown specializes in mood disorders and cognitive behavioral therapy.',
    availability: {
      days: ['Monday', 'Thursday', 'Friday'],
      hours: '10:00 AM - 7:00 PM'
    }
  },
  {
    id: 'doc-16',
    name: 'Dr. Priya Sharma',
    hospital: 'Metro Health',
    profession: 'Gynecologist',
    yearsOfService: 14,
    about: 'Dr. Sharma specializes in women\'s health and reproductive medicine.',
    availability: {
      days: ['Tuesday', 'Wednesday', 'Friday'],
      hours: '9:00 AM - 5:00 PM'
    }
  },
  {
    id: 'doc-17',
    name: 'Dr. Kwame Osei',
    hospital: 'Central Hospital',
    profession: 'Oncologist',
    yearsOfService: 16,
    about: 'Dr. Osei specializes in cancer diagnosis and treatment with a focus on personalized medicine.',
    availability: {
      days: ['Monday', 'Tuesday', 'Thursday'],
      hours: '8:00 AM - 4:00 PM'
    }
  },
  {
    id: 'doc-18',
    name: 'Dr. Elena Petrova',
    hospital: 'North Medical',
    profession: 'Infectious Disease',
    yearsOfService: 8,
    about: 'Dr. Petrova specializes in complex infectious diseases and international travel medicine.',
    availability: {
      days: ['Wednesday', 'Friday'],
      hours: '10:00 AM - 6:00 PM'
    }
  },
  {
    id: 'doc-19',
    name: 'Dr. Benjamin Cohen',
    hospital: 'Central Hospital',
    profession: 'Neurosurgeon',
    yearsOfService: 18,
    about: 'Dr. Cohen specializes in complex brain and spine surgeries using minimally invasive techniques.',
    availability: {
      days: ['Monday', 'Thursday'],
      hours: '7:00 AM - 3:00 PM'
    }
  },
  {
    id: 'doc-20',
    name: 'Dr. Yasmin Ahmed',
    hospital: 'City Medical Center',
    profession: 'Radiologist',
    yearsOfService: 10,
    about: 'Dr. Ahmed specializes in advanced medical imaging and interventional radiology procedures.',
    availability: {
      days: ['Tuesday', 'Wednesday', 'Friday'],
      hours: '9:00 AM - 5:00 PM'
    }
  },
  {
    id: 'doc-21',
    name: 'Dr. Samuel Okoro',
    hospital: 'Central Hospital',
    profession: 'Sports Medicine',
    yearsOfService: 12,
    about: 'Dr. Okoro specializes in athletic injuries, rehabilitation, and performance enhancement.',
    availability: {
      days: ['Monday', 'Wednesday', 'Friday'],
      hours: '8:00 AM - 4:00 PM'
    }
  },
  {
    id: 'doc-22',
    name: 'Dr. Isabella Romano',
    hospital: 'Metro Health',
    profession: 'Geriatrician',
    yearsOfService: 9,
    about: 'Dr. Romano specializes in eldercare and age-related conditions.',
    availability: {
      days: ['Tuesday', 'Thursday'],
      hours: '10:00 AM - 6:00 PM'
    }
  },
  {
    id: 'doc-23',
    name: 'Dr. Daniel Lee',
    hospital: 'Central Hospital',
    profession: 'ENT Specialist',
    yearsOfService: 11,
    about: 'Dr. Lee specializes in disorders of the ear, nose, and throat with a focus on minimally invasive surgeries.',
    availability: {
      days: ['Monday', 'Wednesday', 'Friday'],
      hours: '9:00 AM - 5:00 PM'
    }
  },
  {
    id: 'doc-24',
    name: 'Dr. Aisha Mahmoud',
    hospital: 'North Medical',
    profession: 'Nutritionist',
    yearsOfService: 7,
    about: 'Dr. Mahmoud specializes in clinical nutrition and dietary management of chronic diseases.',
    availability: {
      days: ['Tuesday', 'Thursday', 'Friday'],
      hours: '10:00 AM - 4:00 PM'
    }
  },
  {
    id: 'doc-25',
    name: 'Dr. Victor Nguyen',
    hospital: 'Central Hospital',
    profession: 'Pain Management',
    yearsOfService: 13,
    about: 'Dr. Nguyen specializes in chronic pain management using multidisciplinary approaches.',
    availability: {
      days: ['Monday', 'Wednesday', 'Thursday'],
      hours: '8:30 AM - 4:30 PM'
    }
  },
  {
    id: 'doc-26',
    name: 'Dr. Sophia Williams',
    hospital: 'City Medical Center',
    profession: 'Neonatologist',
    yearsOfService: 15,
    about: 'Dr. Williams specializes in the care of newborns, particularly those who are ill or premature.',
    availability: {
      days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
      hours: '7:00 AM - 7:00 PM'
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
