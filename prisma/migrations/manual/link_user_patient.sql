-- Add userId column to Patient table if it doesn't exist
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE;

-- Set uniqueness constraint
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_key" UNIQUE ("userId");

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "Patient_userId_idx" ON "Patient"("userId");

-- In the future, after data migration, to make userId non-null:
-- ALTER TABLE "Patient" ALTER COLUMN "userId" SET NOT NULL;
