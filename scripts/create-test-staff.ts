import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcrypt';

async function createTestStaff() {
  try {
    console.log('Creating test hospital if it doesn\'t exist...');
    // Ensure we have a hospital
    const hospital = await prisma.hospital.upsert({
      where: { name: 'central-hospital' },
      update: {},
      create: {
        name: 'central-hospital',
        displayName: 'Central Hospital',
        address: '123 Healthcare Avenue',
        city: 'Medical City',
        state: 'Health State',
        zipCode: '12345',
        country: 'United States',
        phone: '(555) 123-4567',
        email: 'info@central-hospital.example.com',
        website: 'https://central-hospital.example.com',
        logo: '/images/central-hospital-logo.png',
      },
    });
    
    console.log(`Hospital created/confirmed with ID: ${hospital.id}`);
    
    // Create test staff
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    const staffMember = await prisma.staff.create({
      data: {
        name: 'Dr. Jane Smith',
        email: 'jane.smith@central-hospital.com',
        password: hashedPassword,
        role: 'DOCTOR',
        specialties: ['Cardiology', 'Internal Medicine'],
        salary: 120000,
        taxRate: 25,
        hospital: {
          connect: { id: hospital.id },
        },
        gender: 'FEMALE',
        shift: 'MORNING',
        walletBalance: 5000,
        telemedicineEnabled: true,
        onlineBookingEnabled: true,
        department: 'Cardiology',
      },
    });
    
    console.log(`Test staff created with ID: ${staffMember.id}`);
    console.log('Test staff credentials:');
    console.log('Email: jane.smith@central-hospital.com');
    console.log('Password: Password123');

  } catch (error) {
    console.error('Error creating test staff:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestStaff()
  .then(() => console.log('Script completed successfully'))
  .catch((error) => console.error('Script failed:', error));
