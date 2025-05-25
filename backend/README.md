# Hospital FHIR - Open Source Healthcare Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

An open-source healthcare platform that integrates FHIR standards, real-time communication, and modern web technologies. The platform consists of a Django backend API, Next.js frontend, and Flutter mobile application.

## 🌟 Features

- 🏥 Complete hospital management system
- 🔄 FHIR-compliant data integration
- 💬 Real-time chat between patients and healthcare providers
- 📱 Cross-platform mobile application
- 🔒 Secure authentication and authorization
- 📊 Comprehensive medical records management
- 📅 Appointment scheduling system

## 🚀 Quick Start

This is the backend API for the Hospital FHIR application. It provides RESTful endpoints for patient management, medical records, appointments, real-time chat, and FHIR integration.

## 🛠️ Setup

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Node.js 16+
- Flutter 3.0+
- MongoDB (for additional data storage)

### Environment Setup

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

## 📚 API Documentation

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

## 💬 Real-time Chat

The chat functionality uses WebSocket for real-time communication. Connect to the WebSocket endpoint with your JWT token for authentication.

## 🤝 Contributing

We love your input! We want to make contributing to Hospital FHIR as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

### Development Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable.
2. Update the docs/ directory with any new documentation.
3. The PR will be merged once you have the sign-off of at least one other developer.

### Code Style

- Python: Follow PEP 8 guidelines
- JavaScript/TypeScript: Use Prettier and ESLint configurations
- Flutter/Dart: Follow official Flutter style guide

### Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

### Report bugs using Github's [issue tracker](https://github.com/yourusername/hospital-fhir/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/yourusername/hospital-fhir/issues/new).

### Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## 🙏 Acknowledgments

- FHIR® is the registered trademark of HL7
- Thanks to all contributors who help improve this project

## 📞 Contact

For any questions or suggestions, please open an issue or contact the maintainers:

- [Your Name](https://github.com/yourusername)
- [Project Email](mailto:your.email@example.com)

The chat functionality uses WebSocket for real-time communication. Connect to the WebSocket endpoint with your JWT token for authentication.
