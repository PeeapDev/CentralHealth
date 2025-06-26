/**
 * Emergency fix script for Prisma schema inconsistency
 * 
 * This script temporarily modifies the Prisma schema and regenerates
 * the client to allow the application to work without the problematic
 * password_resets table.
 */
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const SCHEMA_PATH = path.resolve(__dirname, '../prisma/schema.prisma');

async function main() {
  console.log('Emergency Prisma Schema Fix Script');
  console.log('==================================');
  console.log('Backing up original schema...');
  
  // 1. Back up the original schema
  const originalSchema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const backupPath = path.resolve(__dirname, '../prisma/schema.prisma.backup');
  fs.writeFileSync(backupPath, originalSchema);
  console.log(`Backup created at: ${backupPath}`);
  
  // 2. Modify the schema to remove the PasswordReset relation from Patient model
  console.log('Modifying schema to remove problematic PasswordReset relation...');
  
  const modifiedSchema = originalSchema
    // Remove the PasswordReset field from Patient model
    .replace(/\s+PasswordReset\s+PasswordReset\[\]/g, '  // PasswordReset relation temporarily disabled')
    
    // Comment out the PasswordReset model's patient relation
    .replace(
      /(patient\s+Patient\?\s+@relation\(fields:\s+\[patientId\],\s+references:\s+\[id\],\s+onDelete:\s+Cascade\))/g,
      '// $1 - temporarily disabled'
    );
  
  // Write the modified schema back
  fs.writeFileSync(SCHEMA_PATH, modifiedSchema);
  console.log('Schema modified successfully');
  
  // 3. Generate Prisma client with the modified schema
  console.log('Generating new Prisma client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('Prisma client regenerated successfully');
    
    console.log('\nFIX APPLIED: The application should now function without the password_resets table.');
    console.log('\nIMPORTANT NEXT STEPS:');
    console.log('1. Restart your application');
    console.log('2. Contact your database administrator to properly synchronize the database schema');
    console.log('3. Once database is properly synchronized, restore the original schema from the backup');
  } catch (error) {
    console.error('Error generating Prisma client:', error);
    // Restore the original schema
    fs.writeFileSync(SCHEMA_PATH, originalSchema);
    console.error('Schema restored to original state due to error');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
