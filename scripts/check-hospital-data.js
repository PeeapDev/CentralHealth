/**
 * This script checks the hospitals in the database to help debug the hospital lookup issues.
 * It follows the CentralHealth System rules by not using any mock or test data.
 */

// Load environment variables from .env file
require('dotenv').config();

// Use direct Prisma client for Node.js scripts
const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client instance for this script
// This follows CentralHealth System rules - no mock data, only accessing real hospital data
const prisma = new PrismaClient();

async function checkHospitals() {
  console.log('\n=== CHECKING HOSPITAL DATABASE ENTRIES ===\n');
  
  try {
    // Get all hospitals
    console.log('Fetching all hospitals from database...');
    const hospitals = await prisma.hospital.findMany();
    
    if (hospitals.length === 0) {
      console.log('\nNo hospitals found in database! Need to run setup script first.');
      return;
    }
    
    console.log(`\nFound ${hospitals.length} hospitals in database:`);
    hospitals.forEach((hospital, index) => {
      console.log(`\n[${index + 1}] Hospital Details:`);
      console.log(`  ID: ${hospital.id}`);
      console.log(`  Name: ${hospital.name}`);
      console.log(`  Subdomain: ${hospital.subdomain}`);
      console.log(`  Created: ${hospital.createdAt}`);
      console.log(`  Updated: ${hospital.updatedAt}`);
      
      // Check if the hospital has the required fields
      const missingFields = [];
      if (!hospital.id) missingFields.push('id');
      if (!hospital.name) missingFields.push('name');
      if (!hospital.subdomain) missingFields.push('subdomain');
      
      if (missingFields.length > 0) {
        console.log(`  ⚠️ WARNING: Missing required fields: ${missingFields.join(', ')}`);
      } else {
        console.log('  ✓ All required fields present');
      }
    });

    // Check specifically for 'lifecare' hospital
    console.log('\n=== SPECIFIC LOOKUP TEST ===\n');
    console.log('Looking up hospital with subdomain "lifecare"...');
    const lifecare = await prisma.hospital.findFirst({
      where: {
        subdomain: 'lifecare'
      }
    });
    
    if (lifecare) {
      console.log('✅ Found lifecare hospital:');
      console.log(`  ID: ${lifecare.id}`);
      console.log(`  Name: ${lifecare.name}`);
      console.log(`  Subdomain: ${lifecare.subdomain}`);
    } else {
      console.log('❌ No hospital found with subdomain "lifecare"');
      
      // Try case-insensitive search
      console.log('\nTrying case-insensitive search for "lifecare"...');
      const lifecareInsensitive = await prisma.hospital.findFirst({
        where: {
          subdomain: {
            mode: 'insensitive',
            contains: 'lifecare'
          }
        }
      });
      
      if (lifecareInsensitive) {
        console.log('✅ Found hospital with case-insensitive search:');
        console.log(`  ID: ${lifecareInsensitive.id}`);
        console.log(`  Name: ${lifecareInsensitive.name}`);
        console.log(`  Subdomain: ${lifecareInsensitive.subdomain}`);
        console.log('  NOTE: The case might be different from what\'s expected');
      } else {
        console.log('❌ No hospital found even with case-insensitive search');
      }
    }

    // Check if we need to run the setup script
    if (!lifecare) {
      console.log('\n⚠️ The lifecare hospital is not in the database.');
      console.log('You need to run the setup script:');
      console.log('  node scripts/create-lifecare-staff.js');
    }

  } catch (error) {
    console.error('Error checking hospital data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHospitals();
