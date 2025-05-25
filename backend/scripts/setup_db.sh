#!/bin/bash

# Create PostgreSQL user and database
psql -U postgres << EOF
CREATE USER postgres WITH PASSWORD 'your-password-here';
ALTER USER postgres WITH SUPERUSER;
CREATE DATABASE hospital_fhir;
GRANT ALL PRIVILEGES ON DATABASE hospital_fhir TO postgres;
EOF

# Install requirements
pip install -r requirements.txt

# Run migrations
python manage.py migrate

echo "Database setup completed!"
