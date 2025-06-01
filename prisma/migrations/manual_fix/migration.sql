-- Add verification fields to Patient table
ALTER TABLE "Patient" 
ADD COLUMN IF NOT EXISTS "verificationCode" TEXT,
ADD COLUMN IF NOT EXISTS "verificationExpiry" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- Mark migration as applied
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES ('manual_fix', 'manual fix for patient verification fields', NOW(), '20250601000000_add_patient_verification_fields', '', NULL, NOW(), 1)
ON CONFLICT DO NOTHING;
