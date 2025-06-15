-- Create tables for PostgreSQL database

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'patient',
    patient_id VARCHAR(50),
    profile_image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient profiles table
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    hospital_code VARCHAR(50),
    date_of_birth DATE,
    blood_type VARCHAR(10),
    gender VARCHAR(20),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    admin_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    description TEXT,
    website VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospital modules table
CREATE TABLE IF NOT EXISTS hospital_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id),
    module_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id),
    plan VARCHAR(50) DEFAULT 'basic',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create demo user for testing (password: password123)
INSERT INTO users (email, password, first_name, last_name, role, patient_id, is_superuser)
VALUES ('patient@example.com', '$2b$12$mL8ab2sMbIdBk0A28V5VOeJWN7.x7GlXyjlVpxWrtQXaMGrz4YQbW', 'Demo', 'Patient', 'patient', 'MED-54321', FALSE)
ON CONFLICT (email) DO NOTHING;

-- Create demo admin user (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role, is_superuser)
VALUES ('admin@example.com', '$2b$12$iRvPT7p9hQHI0QHP99Jvfe7UQIGhT3T.FZvdvlVdKtPFqOsIHGGPm', 'Admin', 'User', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Create patient profile for demo patient
INSERT INTO patient_profiles (user_id, patient_id, hospital_code, date_of_birth, blood_type, gender, phone, address)
SELECT id, 'MED-54321', 'CENTRAL', '1990-01-01'::DATE, 'O+', 'Other', '+1234567890', '123 Health St, Medical City, MC 12345'
FROM users WHERE email = 'patient@example.com'
ON CONFLICT DO NOTHING;
