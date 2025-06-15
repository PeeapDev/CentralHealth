# Hospital FHIR Platform

This repository contains the Hospital FHIR platform, including:
- FastAPI backend (PostgreSQL)
- Flutter mobile app
- Next.js web application

## Development Setup

The project is configured for seamless development across all components, ensuring they stay connected through consistent ports and configurations.

### Prerequisites

- Python 3.9+ with pip
- Node.js 18+ with npm
- Flutter SDK
- PostgreSQL database
- Xcode (for iOS development)

### Database Setup

The backend requires a PostgreSQL database. Make sure you have PostgreSQL running and configured:

```bash
# Create the database if it doesn't exist
psql -U postgres -c "CREATE DATABASE hospital_fhir;"

# Initialize the database schema
cd backend
psql -U postgres -d hospital_fhir -f setup_db.sql
```

### Install Dependencies

```bash
# Install backend dependencies
cd backend
pip install fastapi uvicorn asyncpg bcrypt python-multipart python-jose pydantic

# Install mobile app dependencies
cd ../mobile_app
flutter pub get

# Install web dependencies
cd ..
npm install
```

## Running the Application

### Integrated Development Environment

The easiest way to develop is using the integrated development script which launches both backend and mobile app:

```bash
npm run dev:all
```

This script:
1. Starts the FastAPI backend on port 8001
2. Launches the Flutter mobile app connected to the backend
3. Provides color-coded logs from all components

### Individual Components

If you prefer to run components separately:

```bash
# Run only the backend
npm run dev:backend

# Run only the mobile app
npm run dev:mobile  

# Run only the web app
npm run dev
```

### Backend API Endpoints

The backend serves:
- Authentication: `/api/auth/mobile/login`
- Patient profiles: `/api/patients/profile`
- Hospital management: `/api/hospitals`

### Test Accounts

For testing, the following accounts are pre-configured:

1. **Patient Account**:
   - Email: `patient@example.com`
   - Password: `password123`

2. **Admin Account**:
   - Email: `admin@example.com`
   - Password: `admin123`

## Project Structure

```
hospital-fhir/
├── backend/               # FastAPI backend server
│   ├── main.py           # Main application file
│   └── setup_db.sql      # Database schema setup
├── mobile_app/           # Flutter mobile application
│   └── lib/              # App source code
├── public/               # Next.js public assets
├── src/                  # Next.js application source
├── dev-setup.js          # Development coordination script
├── package.json          # Project configuration
└── README.md             # This file
```

## Troubleshooting

### Mobile App Connection Issues

If the mobile app cannot connect to the backend:

1. Check that backend is running on port 8001
2. Verify API constants in `mobile_app/lib/core/api/api_constants.dart`
3. For iOS simulators, ensure the app is using `127.0.0.1:8001` as the base URL

### Database Connection Issues

If the backend cannot connect to PostgreSQL:

1. Verify PostgreSQL is running: `pg_isready`
2. Check connection parameters in `main.py` (host, port, username, password)
3. Ensure the database exists: `psql -U postgres -l | grep hospital_fhir`

### Port Conflicts

If port 8001 is already in use:

```bash
# Find processes using port 8001
lsof -i :8001

# Kill the process
kill -9 [PID]
```
