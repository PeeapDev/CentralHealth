from rest_framework import serializers
from .models import FHIRPatient, FHIRObservation
from patients.serializers import PatientSerializer, MedicalRecordSerializer

class FHIRPatientSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    
    class Meta:
        model = FHIRPatient
        fields = '__all__'

class FHIRObservationSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    medical_record = MedicalRecordSerializer(read_only=True)
    
    class Meta:
        model = FHIRObservation
        fields = '__all__'
