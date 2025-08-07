import { prisma } from '../lib/database/prisma-client';
import bcrypt from 'bcryptjs';
import { generateMedicalID } from '../utils/medical-id';

async function createTestUsers() {
  console.log('🚀 Creating test users for the platform...');

  try {
    // 1. Create Test Patient User
    const patientPassword = await bcrypt.hash('testpatient123', 12);
    const patientMedicalId = generateMedicalID();
    
    const testPatient = await prisma.patient.upsert({
      where: { mrn: patientMedicalId },
      update: {},
      create: {
        mrn: patientMedicalId,
        name: 'John Test Patient',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'MALE',
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Create associated user account
        User: {
          create: {
            email: 'patient@test.com',
            password: patientPassword,
            role: 'PATIENT',
            name: 'John Test Patient',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        },
        // Create email record
        Emails: {
          create: {
            email: 'patient@test.com',
            verified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        },
        // Create phone record
        Phones: {
          create: {
            phone: '+23276123456',
            verified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }
      }
    });

    console.log('✅ Created test patient:', {
      email: 'patient@test.com',
      password: 'testpatient123',
      medicalId: patientMedicalId,
      name: 'John Test Patient'
    });

    // 2. Create Test Doctor User
    const doctorPassword = await bcrypt.hash('testdoctor123', 12);
    
    const testDoctor = await prisma.user.upsert({
      where: { email: 'doctor@test.com' },
      update: {},
      create: {
        email: 'doctor@test.com',
        password: doctorPassword,
        role: 'DOCTOR',
        name: 'Dr. Sarah Test',
        specialties: ['Cardiology', 'Internal Medicine'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ Created test doctor:', {
      email: 'doctor@test.com',
      password: 'testdoctor123',
      name: 'Dr. Sarah Test',
      specialties: ['Cardiology', 'Internal Medicine']
    });

    // 3. Create Test Hospital Admin User
    const adminPassword = await bcrypt.hash('testadmin123', 12);
    
    const testAdmin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        password: adminPassword,
        role: 'ADMIN',
        name: 'Hospital Admin Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ Created test hospital admin:', {
      email: 'admin@test.com',
      password: 'testadmin123',
      name: 'Hospital Admin Test'
    });

    // 4. Create Test Nurse User
    const nursePassword = await bcrypt.hash('testnurse123', 12);
    
    const testNurse = await prisma.user.upsert({
      where: { email: 'nurse@test.com' },
      update: {},
      create: {
        email: 'nurse@test.com',
        password: nursePassword,
        role: 'STAFF',
        name: 'Nurse Mary Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ Created test nurse:', {
      email: 'nurse@test.com',
      password: 'testnurse123',
      name: 'Nurse Mary Test'
    });

    // 5. Create Another Test Patient (Female)
    const patient2Password = await bcrypt.hash('testpatient456', 12);
    const patient2MedicalId = generateMedicalID();
    
    const testPatient2 = await prisma.patient.upsert({
      where: { mrn: patient2MedicalId },
      update: {},
      create: {
        mrn: patient2MedicalId,
        name: 'Jane Test Patient',
        dateOfBirth: new Date('1985-06-20'),
        gender: 'FEMALE',
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Create associated user account
        User: {
          create: {
            email: 'patient2@test.com',
            password: patient2Password,
            role: 'PATIENT',
            name: 'Jane Test Patient',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        },
        // Create email record
        Emails: {
          create: {
            email: 'patient2@test.com',
            verified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        },
        // Create phone record
        Phones: {
          create: {
            phone: '+23276654321',
            verified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }
      }
    });

    console.log('✅ Created second test patient:', {
      email: 'patient2@test.com',
      password: 'testpatient456',
      medicalId: patient2MedicalId,
      name: 'Jane Test Patient'
    });

    console.log('\n🎉 All test users created successfully!');
    console.log('\n📋 LOGIN CREDENTIALS SUMMARY:');
    console.log('═══════════════════════════════════════');
    console.log('👤 PATIENT 1:');
    console.log('   Email: patient@test.com');
    console.log('   Password: testpatient123');
    console.log('   Medical ID:', patientMedicalId);
    console.log('');
    console.log('👤 PATIENT 2:');
    console.log('   Email: patient2@test.com');
    console.log('   Password: testpatient456');
    console.log('   Medical ID:', patient2MedicalId);
    console.log('');
    console.log('👨‍⚕️ DOCTOR:');
    console.log('   Email: doctor@test.com');
    console.log('   Password: testdoctor123');
    console.log('');
    console.log('👨‍💼 HOSPITAL ADMIN:');
    console.log('   Email: admin@test.com');
    console.log('   Password: testadmin123');
    console.log('');
    console.log('👩‍⚕️ NURSE:');
    console.log('   Email: nurse@test.com');
    console.log('   Password: testnurse123');
    console.log('═══════════════════════════════════════');
    console.log('\n🌐 Login URLs:');
    console.log('Patient Login: https://obsequious-knowledge-production.up.railway.app/auth/login');
    console.log('Staff Login: https://obsequious-knowledge-production.up.railway.app/admin/auth/login');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUsers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
