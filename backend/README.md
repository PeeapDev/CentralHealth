# Hospital FHIR Backend API

This backend provides RESTful API endpoints for the Hospital FHIR mobile application, supporting authentication, FHIR resources, and role-specific functionalities.

## Setup Instructions

1. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

2. **Run the server**:
   ```
   python app.py
   ```

   The server will start on port 8000 by default. You can change the port by setting the PORT environment variable.

## Authentication

The API uses JWT tokens for authentication. To authenticate:

1. **Login**: POST to `/api/token/` with email and password
2. **Refresh Token**: POST to `/api/token/refresh/` with refresh token
3. **Register**: POST to `/api/register/` with email, password, name, and role

## Available Test Users

| Email | Password | Role |
|-------|----------|------|
| patient@example.com | password123 | patient |
| provider@example.com | password123 | provider |
| admin@example.com | password123 | admin |

## API Documentation

For full API documentation, send a GET request to `/api/docs`

## FHIR Resources

The API supports the following FHIR resources:
- Patient
- Observation
- Appointment

## Role-Based Access

- **Patients**: Can view their own data and appointments
- **Providers**: Can view patient data and manage appointments
- **Administrators**: Can access hospital metrics and staff activity data

## Health Check

To verify the API is running, send a GET request to `/api/health-check`
