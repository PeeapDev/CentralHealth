/**
 * Script to create a test hospital and staff member for development
 * Follows the CentralHealth System rules:
 * - No mock patient data
 * - Proper separation between admin and staff accounts
 * - Correct hospital staff model usage
 */

const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');

async function createTestHospitalAndStaff() {
  try {
    console.log('Creating test hospital if it doesn\'t exist...');
    
    // Check if hospital exists first
    const existingHospital = await prisma.hospital.findUnique({
      where: { subdomain: 'central-hospital' },
    });
    
    let hospital;
    if (existingHospital) {
      hospital = existingHospital;
      console.log(`Using existing hospital: ${hospital.name} (${hospital.id})`);
    } else {
      // Create a hospital
      hospital = await prisma.hospital.create({
        data: {
          name: 'central-hospital', 
          subdomain: 'central-hospital',
          description: 'Central Hospital for Testing',
          settings: {
            theme: 'light',
            features: {
              telemedicine: true,
              onlineBooking: true,
              walletEnabled: true
            }
          },
          branding: {
            primaryColor: '#0047AB',
            logo: '/images/central-hospital-logo.png'
          },
          isActive: true,
        },
      });
      console.log(`Created new hospital: ${hospital.name} (${hospital.id})`);
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
      // Create a hospital admin - this would normally be done by a superadmin
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      admin = await prisma.user.create({
        data: {
          email: 'admin@central-hospital.com',
          password: hashedPassword,
          name: 'Hospital Administrator',
          role: 'ADMIN',
          isHospitalAdmin: true,
          hospital: {
            connect: { id: hospital.id }
          },
          specialties: [],
        },
      });
      console.log(`Created hospital admin: ${admin.email} (${admin.id})`);
    }
    
    // Check if test staff exists
    const existingStaff = await prisma.user.findFirst({
      where: {
        hospitalId: hospital.id,
        email: 'dr.smith@central-hospital.com',
      },
    });
    
    let staff;
    if (existingStaff) {
      staff = existingStaff;
      console.log(`Using existing staff: ${staff.email} (${staff.id})`);
    } else {
      // Create a staff member (doctor)
      const hashedPassword = await bcrypt.hash('Staff123!', 10);
      
      staff = await prisma.user.create({
        data: {
          email: 'dr.smith@central-hospital.com',
          password: hashedPassword,
          name: 'Dr. Jane Smith',
          role: 'DOCTOR',
          isHospitalAdmin: false,
          hospital: {
            connect: { id: hospital.id }
          },
          specialties: ['Cardiology', 'Internal Medicine'],
          department: 'Cardiology',
        },
      });
      console.log(`Created staff member: ${staff.email} (${staff.id})`);
      
      // Add staff profile for additional details
      const staffProfile = await prisma.staffProfile.create({
        data: {
          userId: staff.id,
          hospitalId: hospital.id,
          salary: 120000,
          taxRate: 25,
          shift: 'MORNING',
          walletBalance: 5000,
          gender: 'FEMALE',
        },
      });
      console.log(`Created staff profile with wallet balance: $${staffProfile.walletBalance}`);
    }
    
    console.log('\nTest accounts created successfully:');
    console.log('Hospital Admin:');
    console.log('- Email: admin@central-hospital.com');
    console.log('- Password: Admin123!');
    console.log('\nStaff Member:');
    console.log('- Email: dr.smith@central-hospital.com');
    console.log('- Password: Staff123!');
    console.log('\nAccess URLs:');
    console.log(`- Hospital Admin Dashboard: http://localhost:3000/central-hospital/admin`);
    console.log(`- Staff Dashboard: http://localhost:3000/central-hospital/staff/dashboard`);
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestHospitalAndStaff()
  .then(() => console.log('Script completed'))
  .catch((error) => console.error('Script failed:', error));
