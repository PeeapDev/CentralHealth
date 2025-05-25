#!/bin/bash

# Activate virtual environment
source ../venv/bin/activate

# Install requirements if needed
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
