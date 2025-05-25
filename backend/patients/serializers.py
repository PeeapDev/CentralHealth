from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Patient, MedicalRecord, Appointment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'

class MedicalRecordSerializer(serializers.ModelSerializer):
    recorded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'
