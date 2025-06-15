import os
import json
import uuid
from datetime import datetime, timedelta, timezone
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    create_refresh_token, get_jwt_identity, get_jwt
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
jwt = JWTManager(app)

# Mock database
users = {
    'patient@example.com': {
        'id': 'patient-001',
        'email': 'patient@example.com',
        'password': 'password123',
        'name': 'John Doe',
        'role': 'patient'
    },
    'provider@example.com': {
        'id': 'provider-001',
        'email': 'provider@example.com',
        'password': 'password123',
        'name': 'Dr. Jane Smith',
        'role': 'provider'
    },
    'admin@example.com': {
        'id': 'admin-001',
        'email': 'admin@example.com',
        'password': 'password123',
        'name': 'Admin User',
        'role': 'admin'
    }
}

@app.route('/api/health-check', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': 'v1'
    })

@app.route('/api/token/', methods=['POST'])
def login():
    """Login endpoint"""
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    
    email = request.json.get('email', None)
    password = request.json.get('password', None)
    
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400
    
    user = users.get(email)
    
    if not user or user['password'] != password:
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Create tokens
    access_token = create_access_token(identity=user['id'])
    refresh_token = create_refresh_token(identity=user['id'])
    
    return jsonify({
        'id': user['id'],
        'email': user['email'],
        'name': user['name'],
        'role': user['role'],
        'access_token': access_token,
        'refresh_token': refresh_token
    })

@app.route('/api/token/refresh/', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh token endpoint"""
    current_user_id = get_jwt_identity()
    
    # Find the user by ID
    user = next((u for u in users.values() if u['id'] == current_user_id), None)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'access_token': access_token
    })

@app.route('/api/register/', methods=['POST'])
def register():
    """Register endpoint"""
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    
    email = request.json.get('email', None)
    password = request.json.get('password', None)
    name = request.json.get('name', None)
    role = request.json.get('role', 'patient')  # Default to patient
    
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400
    
    if email in users:
        return jsonify({"error": "Email already registered"}), 409
    
    # Generate a new user ID
    user_id = f"{role}-{len(users) + 1:03d}"
    
    # Create new user
    users[email] = {
        'id': user_id,
        'email': email,
        'password': password,
        'name': name,
        'role': role
    }
    
    # Create tokens
    access_token = create_access_token(identity=user_id)
    refresh_token = create_refresh_token(identity=user_id)
    
    return jsonify({
        'id': user_id,
        'email': email,
        'name': name,
        'role': role,
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201

@app.route('/api/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user endpoint"""
    current_user_id = get_jwt_identity()
    
    # Find the user by ID
    user = next((u for u in users.values() if u['id'] == current_user_id), None)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Don't return the password
    user_data = {k: v for k, v in user.items() if k != 'password'}
    
    return jsonify(user_data)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)

# Mock FHIR database
patients = [
    {
        "id": "patient-001",
        "resourceType": "Patient",
        "name": [{"given": ["John"], "family": "Doe"}],
        "gender": "male",
        "birthDate": "1990-01-15",
        "address": [{"line": ["123 Main St"], "city": "Anytown", "state": "CA", "postalCode": "12345"}],
        "telecom": [{"system": "phone", "value": "555-123-4567"}],
        "active": True
    },
    {
        "id": "patient-002",
        "resourceType": "Patient",
        "name": [{"given": ["Jane"], "family": "Smith"}],
        "gender": "female",
        "birthDate": "1985-05-20",
        "address": [{"line": ["456 Oak Ave"], "city": "Sometown", "state": "NY", "postalCode": "67890"}],
        "telecom": [{"system": "phone", "value": "555-987-6543"}],
        "active": True
    }
]

observations = [
    {
        "id": "obs-001",
        "resourceType": "Observation",
        "status": "final",
        "code": {
            "coding": [
                {"system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure"}
            ]
        },
        "subject": {"reference": "Patient/patient-001"},
        "effectiveDateTime": "2023-03-15T09:30:00Z",
        "valueQuantity": {
            "value": 120,
            "unit": "mmHg",
            "system": "http://unitsofmeasure.org",
            "code": "mm[Hg]"
        }
    },
    {
        "id": "obs-002",
        "resourceType": "Observation",
        "status": "final",
        "code": {
            "coding": [
                {"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic blood pressure"}
            ]
        },
        "subject": {"reference": "Patient/patient-001"},
        "effectiveDateTime": "2023-03-15T09:30:00Z",
        "valueQuantity": {
            "value": 80,
            "unit": "mmHg",
            "system": "http://unitsofmeasure.org",
            "code": "mm[Hg]"
        }
    }
]

appointments = [
    {
        "id": "appt-001",
        "resourceType": "Appointment",
        "status": "booked",
        "start": "2023-04-01T10:00:00Z",
        "end": "2023-04-01T10:30:00Z",
        "participant": [
            {"actor": {"reference": "Patient/patient-001"}, "status": "accepted"},
            {"actor": {"reference": "Provider/provider-001"}, "status": "accepted"}
        ],
        "description": "Regular checkup"
    }
]

# Hospital metrics for admin dashboard
hospital_metrics = {
    "occupancy": {
        "current": 76,
        "total": 100,
        "percentage": 76
    },
    "staff": {
        "total": 125,
        "onDuty": 45
    },
    "patients": {
        "inpatient": 76,
        "outpatient": 32,
        "emergency": 8
    },
    "revenue": {
        "daily": 57800,
        "weekly": 390000,
        "monthly": 1650000
    }
}

# Recent activities for admin dashboard
staff_activities = [
    {
        "id": "activity-001",
        "staffId": "provider-001",
        "staffName": "Dr. Jane Smith",
        "action": "Patient Check-in",
        "timestamp": "2023-04-01T08:30:00Z",
        "details": "Checked in Patient #patient-001"
    },
    {
        "id": "activity-002",
        "staffId": "provider-002",
        "staffName": "Dr. Michael Johnson",
        "action": "Medication Administration",
        "timestamp": "2023-04-01T09:15:00Z",
        "details": "Administered medication to Patient #patient-002"
    },
    {
        "id": "activity-003",
        "staffId": "provider-003",
        "staffName": "Nurse Robert Wilson",
        "action": "Vital Signs Recording",
        "timestamp": "2023-04-01T10:00:00Z",
        "details": "Recorded vitals for Patient #patient-001"
    }
]

# FHIR API endpoints
@app.route('/fhir/Patient', methods=['GET'])
@jwt_required()
def get_patients():
    """Get all patients"""
    return jsonify(patients)

@app.route('/fhir/Patient/<string:patient_id>', methods=['GET'])
@jwt_required()
def get_patient(patient_id):
    """Get patient by ID"""
    patient = next((p for p in patients if p['id'] == patient_id), None)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(patient)

@app.route('/fhir/Observation', methods=['GET'])
@jwt_required()
def get_observations():
    """Get all observations"""
    patient_id = request.args.get('patient')
    if patient_id:
        filtered_obs = [o for o in observations if f"Patient/{patient_id}" in o['subject']['reference']]
        return jsonify(filtered_obs)
    return jsonify(observations)

@app.route('/fhir/Observation/<string:obs_id>', methods=['GET'])
@jwt_required()
def get_observation(obs_id):
    """Get observation by ID"""
    obs = next((o for o in observations if o['id'] == obs_id), None)
    if not obs:
        return jsonify({"error": "Observation not found"}), 404
    return jsonify(obs)

@app.route('/fhir/Observation', methods=['POST'])
@jwt_required()
def add_observation():
    """Add a new observation"""
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    
    data = request.json
    # Generate ID if not provided
    if 'id' not in data:
        data['id'] = f"obs-{len(observations) + 1:03d}"
    
    observations.append(data)
    return jsonify(data), 201

@app.route('/fhir/Appointment', methods=['GET'])
@jwt_required()
def get_appointments():
    """Get all appointments"""
    patient_id = request.args.get('patient')
    if patient_id:
        filtered_appts = [a for a in appointments if any(p['actor']['reference'] == f"Patient/{patient_id}" for p in a['participant'])]
        return jsonify(filtered_appts)
    return jsonify(appointments)

@app.route('/fhir/Appointment/<string:appt_id>', methods=['GET'])
@jwt_required()
def get_appointment(appt_id):
    """Get appointment by ID"""
    appt = next((a for a in appointments if a['id'] == appt_id), None)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    return jsonify(appt)

@app.route('/fhir/Appointment', methods=['POST'])
@jwt_required()
def add_appointment():
    """Add a new appointment"""
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    
    data = request.json
    # Generate ID if not provided
    if 'id' not in data:
        data['id'] = f"appt-{len(appointments) + 1:03d}"
    
    appointments.append(data)
    return jsonify(data), 201

# Admin dashboard endpoints
@app.route('/api/admin/metrics', methods=['GET'])
@jwt_required()
def get_hospital_metrics():
    """Get hospital metrics for admin dashboard"""
    current_user_id = get_jwt_identity()
    
    # Find the user by ID
    user = next((u for u in users.values() if u['id'] == current_user_id), None)
    
    # Check if user is an admin
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Unauthorized - Admin access required"}), 403
    
    return jsonify(hospital_metrics)

@app.route('/api/admin/staff-activity', methods=['GET'])
@jwt_required()
def get_staff_activity():
    """Get recent staff activity for admin dashboard"""
    current_user_id = get_jwt_identity()
    
    # Find the user by ID
    user = next((u for u in users.values() if u['id'] == current_user_id), None)
    
    # Check if user is an admin
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Unauthorized - Admin access required"}), 403
    
    # Sort activities by timestamp (newest first)
    sorted_activities = sorted(
        staff_activities, 
        key=lambda x: x['timestamp'], 
        reverse=True
    )
    
    # Limit to 10 most recent activities by default
    limit = request.args.get('limit', default=10, type=int)
    return jsonify(sorted_activities[:limit])

# Provider-specific endpoints
@app.route('/api/provider/patients', methods=['GET'])
@jwt_required()
def get_provider_patients():
    """Get patients assigned to the current provider"""
    current_user_id = get_jwt_identity()
    
    # Find the user by ID
    user = next((u for u in users.values() if u['id'] == current_user_id), None)
    
    # Check if user is a provider
    if not user or user['role'] != 'provider':
        return jsonify({"error": "Unauthorized - Provider access required"}), 403
    
    # In a real app, this would filter patients by provider assignment
    # For now, just return all patients
    return jsonify(patients)

@app.route('/api/provider/appointments', methods=['GET'])
@jwt_required()
def get_provider_appointments():
    """Get appointments for the current provider"""
    current_user_id = get_jwt_identity()
    
    # Find the user by ID
    user = next((u for u in users.values() if u['id'] == current_user_id), None)
    
    # Check if user is a provider
    if not user or user['role'] != 'provider':
        return jsonify({"error": "Unauthorized - Provider access required"}), 403
    
    # Filter appointments by provider
    provider_appts = [a for a in appointments if any(
        p['actor']['reference'] == f"Provider/{user['id']}" for p in a['participant']
    )]
    
    return jsonify(provider_appts)

# Helper to generate README for the backend
@app.route('/api/docs', methods=['GET'])
def get_api_docs():
    """Get API documentation"""
    docs = {
        "api_version": "v1",
        "server_name": "Hospital FHIR API",
        "endpoints": {
            "auth": [
                {"path": "/api/health-check", "method": "GET", "description": "Health check endpoint"},
                {"path": "/api/token/", "method": "POST", "description": "Login endpoint"},
                {"path": "/api/token/refresh/", "method": "POST", "description": "Refresh token endpoint"},
                {"path": "/api/register/", "method": "POST", "description": "Register endpoint"},
                {"path": "/api/users/me", "method": "GET", "description": "Get current user endpoint"}
            ],
            "fhir": [
                {"path": "/fhir/Patient", "method": "GET", "description": "Get all patients"},
                {"path": "/fhir/Patient/<id>", "method": "GET", "description": "Get patient by ID"},
                {"path": "/fhir/Observation", "method": "GET", "description": "Get observations, filter by patient with ?patient=id"},
                {"path": "/fhir/Observation/<id>", "method": "GET", "description": "Get observation by ID"},
                {"path": "/fhir/Observation", "method": "POST", "description": "Add a new observation"},
                {"path": "/fhir/Appointment", "method": "GET", "description": "Get all appointments"},
                {"path": "/fhir/Appointment/<id>", "method": "GET", "description": "Get appointment by ID"},
                {"path": "/fhir/Appointment", "method": "POST", "description": "Add a new appointment"}
            ],
            "admin": [
                {"path": "/api/admin/metrics", "method": "GET", "description": "Get hospital metrics"},
                {"path": "/api/admin/staff-activity", "method": "GET", "description": "Get recent staff activity"}
            ],
            "provider": [
                {"path": "/api/provider/patients", "method": "GET", "description": "Get provider's patients"},
                {"path": "/api/provider/appointments", "method": "GET", "description": "Get provider's appointments"}
            ]
        }
    }
    return jsonify(docs)
