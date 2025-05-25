# Hospital FHIR Backend API

This is the backend API for the Hospital FHIR application. It provides RESTful endpoints for patient management, medical records, appointments, real-time chat, and FHIR integration.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a PostgreSQL database and update .env file with your database credentials.

4. Run migrations:
```bash
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

## API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT token pair
- `POST /api/token/refresh/` - Refresh JWT token

### Patients
- `GET /api/v1/patients/` - List all patients
- `POST /api/v1/patients/` - Create a new patient
- `GET /api/v1/patients/{id}/` - Get patient details
- `PUT /api/v1/patients/{id}/` - Update patient details
- `DELETE /api/v1/patients/{id}/` - Delete a patient
- `GET /api/v1/patients/{id}/medical-records/` - Get patient's medical records
- `GET /api/v1/patients/{id}/appointments/` - Get patient's appointments

### Medical Records
- `GET /api/v1/medical-records/` - List all medical records
- `POST /api/v1/medical-records/` - Create a new medical record
- `GET /api/v1/medical-records/{id}/` - Get medical record details
- `PUT /api/v1/medical-records/{id}/` - Update medical record
- `DELETE /api/v1/medical-records/{id}/` - Delete a medical record

### Appointments
- `GET /api/v1/appointments/` - List all appointments
- `POST /api/v1/appointments/` - Create a new appointment
- `GET /api/v1/appointments/{id}/` - Get appointment details
- `PUT /api/v1/appointments/{id}/` - Update appointment
- `DELETE /api/v1/appointments/{id}/` - Delete an appointment
- `POST /api/v1/appointments/{id}/cancel/` - Cancel an appointment

### Chat
- `GET /api/v1/chat-rooms/` - List all chat rooms
- `POST /api/v1/chat-rooms/` - Create a new chat room
- `GET /api/v1/chat-rooms/{id}/` - Get chat room details
- `GET /api/v1/chat-rooms/{id}/messages/` - Get chat room messages
- `GET /api/v1/messages/` - List all messages
- `POST /api/v1/messages/` - Send a new message

### FHIR Integration
- `GET /api/v1/fhir/patients/` - List all FHIR patients
- `POST /api/v1/fhir/patients/sync-with-fhir/` - Sync patient with FHIR
- `GET /api/v1/fhir/observations/` - List all FHIR observations
- `POST /api/v1/fhir/observations/create-observation/` - Create a FHIR observation

### WebSocket Endpoints
- `ws://localhost:8000/ws/chat/{room_id}/` - WebSocket endpoint for real-time chat

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## FHIR Integration

The API supports FHIR R4 resources for:
- Patient
- Observation

## Real-time Chat

The chat functionality uses WebSocket for real-time communication. Connect to the WebSocket endpoint with your JWT token for authentication.
