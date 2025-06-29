/**
 * Script to create staff for the Lifecare hospital
 * Follows the CentralHealth System rules:
 * - No mock patient data
 * - Proper separation between admin and staff accounts
 * - Correct hospital staff model usage
 */

const bcrypt = require('bcryptjs');
// Use the newly generated Prisma client path
const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function createLifecareStaff() {
  try {
    console.log('Looking up Lifecare hospital...');
    
    // Check if hospital exists first - try both name and subdomain
    let hospital = await prisma.hospital.findFirst({
      where: { 
        OR: [
          { name: 'lifecare' },
          { subdomain: 'lifecare' }
        ]
      },
    });
    
    console.log('Hospital lookup result:', hospital ? `Found: ${hospital.name} (${hospital.id})` : 'Not found');
    
    if (!hospital) {
      console.log('Lifecare hospital not found. Creating it...');
      // Create the hospital if it doesn't exist
      hospital = await prisma.hospital.create({
        data: {
          name: 'lifecare', 
          subdomain: 'lifecare',
          description: 'Lifecare Hospital',
          settings: {
            theme: 'light',
            features: {
              telemedicine: true,
              onlineBooking: true,
              walletEnabled: true
            }
          },
          branding: {
            primaryColor: '#00B894',
            logo: '/images/lifecare-logo.png'
          },
          isActive: true,
          updatedAt: new Date(),
          createdAt: new Date()
        },
      });
      console.log(`Created new hospital: ${hospital.name} (${hospital.id})`);
    } else {
      console.log(`Found existing hospital: ${hospital.name} (${hospital.id})`);
    }
    
    // Check if a hospital admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        hospitalId: hospital.id,
        isHospitalAdmin: true,
      },
    });
    
    let admin;
    if (existingAdmin) {
      admin = existingAdmin;
      console.log(`Using existing hospital admin: ${admin.email} (${admin.id})`);
    } else {
      // Create a hospital admin
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      admin = await prisma.user.create({
        data: {
          email: 'admin@lifecare.com',
          password: hashedPassword,
          name: 'Lifecare Administrator',
          role: 'ADMIN',
          isHospitalAdmin: true,
          Hospital: {
            connect: { id: hospital.id }
          },
          specialties: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created hospital admin: ${admin.email} (${admin.id})`);
      
      // Create staff profile for the admin
      await prisma.staffProfile.create({
        data: {
          userId: admin.id,
          hospitalId: hospital.id,
          staffId: `LC-ADM-${Math.floor(Math.random() * 10000)}`,
          specialization: 'Hospital Administration',
          qualifications: {
            degrees: ['MBA', 'Healthcare Administration'],
            certifications: ['Hospital Management']
          },
          joiningDate: new Date(),
          employmentStatus: 'ACTIVE',
          contactInformation: {
            phone: '+44 7700 900123',
            address: '123 Healthcare Blvd, London',
            salary: 85000,
            taxRate: 25,
            gender: 'OTHER',
            shift: 'MORNING',
            emergencyContact: 'Emergency Services'
          },
        }
      });
    }
    
    // Create a doctor staff member
    const doctorEmail = 'dr.jones@lifecare.com';
    const existingDoctor = await prisma.user.findFirst({
      where: {
        hospitalId: hospital.id,
        email: doctorEmail,
      },
    });
    
    if (existingDoctor) {
      console.log(`Doctor already exists: ${existingDoctor.email} (${existingDoctor.id})`);
    } else {
      const hashedPassword = await bcrypt.hash('Doctor123!', 10);
      
      const doctor = await prisma.user.create({
        data: {
          email: doctorEmail,
          password: hashedPassword,
          name: 'Dr. Emma Jones',
          role: 'DOCTOR',
          isHospitalAdmin: false,
          Hospital: {
            connect: { id: hospital.id }
          },
          specialties: ['Cardiology', 'Internal Medicine'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created doctor: ${doctor.email} (${doctor.id})`);
      
      // Create staff profile for the doctor
      await prisma.staffProfile.create({
        data: {
          userId: doctor.id,
          hospitalId: hospital.id,
          staffId: `LC-DOC-${Math.floor(Math.random() * 10000)}`,
          specialization: 'Cardiology',
          qualifications: {
            degrees: ['MD', 'PhD'],
            certifications: ['Board Certified Cardiologist']
          },
          joiningDate: new Date(),
          employmentStatus: 'ACTIVE',
          contactInformation: {
            phone: '+44 7700 900456',
            address: '456 Medical Drive, London',
            salary: 120000,
            taxRate: 30,
            gender: 'FEMALE',
            shift: 'MORNING',
            telemedicineEnabled: true,
            onlineBookingEnabled: true,
            emergencyContact: 'John Smith, +44 7700 900789'
          },
        }
      });
    }
    
    // Create a nurse staff member
    const nurseEmail = 'nurse.williams@lifecare.com';
    const existingNurse = await prisma.user.findFirst({
      where: {
        hospitalId: hospital.id,
        email: nurseEmail,
      },
    });
    
    if (existingNurse) {
      console.log(`Nurse already exists: ${existingNurse.email} (${existingNurse.id})`);
    } else {
      const hashedPassword = await bcrypt.hash('Nurse123!', 10);
      
      const nurse = await prisma.user.create({
        data: {
          email: nurseEmail,
          password: hashedPassword,
          name: 'Nurse Robert Williams',
          role: 'STAFF',
          isHospitalAdmin: false,
          Hospital: {
            connect: { id: hospital.id }
          },
          specialties: ['Cardiac Care', 'Emergency'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created nurse: ${nurse.email} (${nurse.id})`);
      
      // Create staff profile for the nurse
      await prisma.staffProfile.create({
        data: {
          userId: nurse.id,
          hospitalId: hospital.id,
          staffId: `LC-NRS-${Math.floor(Math.random() * 10000)}`,
          specialization: 'Cardiac Care',
          qualifications: {
            degrees: ['BSN'],
            certifications: ['Registered Nurse', 'Advanced Cardiac Life Support']
          },
          joiningDate: new Date(),
          employmentStatus: 'ACTIVE',
          contactInformation: {
            phone: '+44 7700 900789',
            address: '789 Nurse Avenue, London',
            salary: 65000,
            taxRate: 22,
            gender: 'MALE',
            shift: 'AFTERNOON',
            emergencyContact: 'Mary Williams, +44 7700 900999'
          },
        }
      });
    }
    
    console.log('Lifecare staff creation completed successfully');
  } catch (error) {
    console.error('Error creating Lifecare staff:', error);
  } finally {
    // Close Prisma client connection
    await prisma.$disconnect();
  }
}

createLifecareStaff()
  .then(() => console.log('Script completed'))
  .catch((error) => console.error('Script failed:', error));
