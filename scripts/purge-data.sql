-- SQL script to completely purge all patient data
-- This will remove all test patient data including any "MOHAM" medical IDs
-- CAUTION: THIS WILL DELETE ALL PATIENT DATA AND CANNOT BE UNDONE

-- Step 1: Directly target and remove any patients with MOHAM IDs first
DELETE FROM "Patient" WHERE mrn = 'MOHAM' OR mrn LIKE '%MOHAM%';

-- Step 2: Delete all data from dependent tables in correct order
DELETE FROM "EmailVerification";
DELETE FROM "PatientSession";
DELETE FROM "Appointment" WHERE "patientId" IS NOT NULL;
DELETE FROM "MedicalRecord" WHERE "patientId" IS NOT NULL;

-- Step 3: Now purge all patient data
DELETE FROM "Patient";

-- Step 4: Remove PATIENT users
DELETE FROM "User" WHERE role = 'PATIENT';

-- Step 5: Clean up any tables that might have cached data or references
TRUNCATE "_NextPersistentCache";

-- Step 6: Check for any remaining test data (will show the count)
SELECT COUNT(*) FROM "Patient" WHERE mrn = 'MOHAM' OR mrn LIKE '%MOHAM%';
