#!/usr/bin/env node
/**
 * Database Schema Check Script
 * 
 * This script inspects the database connection and schema to help
 * diagnose migration issues with the Patient table.
 */

// Import PrismaClient directly from the generated location
const { PrismaClient } = require('../prisma/node_modules/.prisma/client');

// Initialize a new client for diagnostics only - read-only operations
// This follows CentralHealth data governance requirements
const prisma = new PrismaClient({
  log: ['error', 'warn']
});

async function checkDatabaseSchema() {
  try {
    console.log('\n=================================');
    console.log('🏥 DATABASE SCHEMA CHECK');
    console.log('=================================\n');

    // Verify database connection
    console.log('Step 1: Checking database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Successfully connected to database\n');

    // Check for the Patient table
    console.log('Step 2: Checking for Patient table...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('Available tables:');
    tables.forEach(t => console.log(`- ${t.table_name}`));
    
    const patientTable = tables.find(t => 
      t.table_name.toLowerCase() === 'patient' || 
      t.table_name === 'Patient'
    );
    
    if (patientTable) {
      console.log(`\n✅ Patient table found as: ${patientTable.table_name}\n`);
      
      // Check the structure of the Patient table
      console.log('Step 3: Checking Patient table structure...');
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${patientTable.table_name}
        ORDER BY ordinal_position;
      `;
      
      console.log('Patient table columns:');
      columns.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));
      
      // Check if contact column exists
      const contactColumn = columns.find(c => c.column_name === 'contact');
      if (contactColumn) {
        console.log(`\n✅ contact column exists with type: ${contactColumn.data_type}`);
      } else {
        console.log(`\n❌ contact column not found in Patient table`);
        console.log('This is why the migration is failing - need to add this column manually');
      }
    } else {
      console.log('\n❌ Patient table not found in database');
      console.log('This explains why the migration is failing');
      
      // Check what casing convention is used in the database
      console.log('\nAnalyzing table naming convention...');
      if (tables.length > 0) {
        const hasUppercase = tables.some(t => /[A-Z]/.test(t.table_name));
        const hasLowercase = tables.some(t => /[a-z]/.test(t.table_name));
        
        if (hasUppercase && hasLowercase) {
          console.log('Tables use mixed case: This might be causing schema mismatch issues');
        } else if (hasUppercase) {
          console.log('Tables use PascalCase: Ensure Prisma schema uses the same casing (Patient)');
        } else {
          console.log('Tables use lowercase: Ensure Prisma schema uses the same casing (patient)');
        }
      }
    }
    
    console.log('\nStep 4: Checking schema name...');
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      ORDER BY schema_name;
    `;
    
    console.log('Available schemas:');
    schemas.forEach(s => console.log(`- ${s.schema_name}`));
    
    // Get database info
    console.log('\nStep 5: Checking database configuration...');
    const dbConfig = await prisma.$queryRaw`
      SELECT current_database() as database, current_schema() as schema;
    `;
    
    console.log('Current database configuration:');
    console.log(`- Database: ${dbConfig[0].database}`);
    console.log(`- Schema: ${dbConfig[0].schema}`);
    
    // Check the Prisma shadow database setting
    console.log('\nStep 6: Checking Prisma shadow database...');
    
    const { readFileSync } = require('fs');
    const { join } = require('path');
    
    try {
      const prismaSchema = readFileSync(
        join(__dirname, '..', 'prisma', 'schema.prisma'),
        'utf8'
      );
      
      const shadowDbMatch = prismaSchema.match(/shadowDatabaseUrl\s*=\s*"([^"]+)"/);
      if (shadowDbMatch) {
        // Don't print the full connection string for security reasons
        console.log('✅ Shadow database is configured');
        
        // Extract parts safely (hostname only)
        const url = shadowDbMatch[1];
        const hostname = url.match(/\/\/([^:@]+)/)?.[1] || 'unknown';
        console.log(`- Shadow DB host: ${hostname}`);
      } else {
        console.log('❌ No shadow database configured in schema.prisma');
        console.log('This might be causing migration issues - add a shadowDatabaseUrl');
      }
    } catch (err) {
      console.log(`❌ Could not read schema.prisma: ${err.message}`);
    }

    console.log('\n=================================');
    console.log('📊 DATABASE SCHEMA ANALYSIS COMPLETE');
    console.log('=================================\n');
  } catch (error) {
    console.error('\n❌ ERROR during database schema check:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabaseSchema();
