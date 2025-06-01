// Script to add missing verification fields to Patient table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if we can connect to the database
    console.log('Connecting to database...');
    
    // Get a list of all tables to verify connection
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Available tables:', tables.map(t => t.table_name).join(', '));
    
    // Check if the Patient table exists
    console.log('Checking Patient table structure...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Patient'
    `;
    
    // Log existing columns
    console.log('Existing Patient columns:', columns.map(c => c.column_name).join(', '));
    
    // Check if verification columns already exist
    const hasVerificationCode = columns.some(c => c.column_name === 'verificationCode');
    const hasVerificationExpiry = columns.some(c => c.column_name === 'verificationExpiry');
    const hasIsVerified = columns.some(c => c.column_name === 'isVerified');
    
    // Add missing columns if needed
    const queries = [];
    
    if (!hasVerificationCode) {
      console.log('Adding verificationCode column...');
      queries.push(prisma.$executeRaw`ALTER TABLE "Patient" ADD COLUMN "verificationCode" TEXT`);
    }
    
    if (!hasVerificationExpiry) {
      console.log('Adding verificationExpiry column...');
      queries.push(prisma.$executeRaw`ALTER TABLE "Patient" ADD COLUMN "verificationExpiry" TIMESTAMP(3)`);
    }
    
    if (!hasIsVerified) {
      console.log('Adding isVerified column...');
      queries.push(prisma.$executeRaw`ALTER TABLE "Patient" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false`);
    }
    
    // Execute all queries
    if (queries.length > 0) {
      console.log(`Executing ${queries.length} column additions...`);
      for (const query of queries) {
        await query;
      }
      console.log('All columns added successfully!');
    } else {
      console.log('All required columns already exist.');
    }
    
    // Count patients
    const patientCount = await prisma.patient.count();
    console.log(`Total patients in database: ${patientCount}`);
    
    console.log('Database update completed successfully!');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
