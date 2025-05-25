from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from fhir.resources.patient import Patient as FHIRPatientResource
from fhir.resources.observation import Observation as FHIRObservationResource
from .models import FHIRPatient, FHIRObservation
from .serializers import FHIRPatientSerializer, FHIRObservationSerializer
from patients.models import Patient

class FHIRPatientViewSet(viewsets.ModelViewSet):
    queryset = FHIRPatient.objects.all()
    serializer_class = FHIRPatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = FHIRPatient.objects.all()
        if not self.request.user.is_staff:
            # If not staff, only show FHIR data for the current patient
            queryset = queryset.filter(patient__user=self.request.user)
        return queryset
    
    @action(detail=False, methods=['post'])
    def sync_with_fhir(self, request):
        patient_id = request.data.get('patient_id')
        patient = get_object_or_404(Patient, id=patient_id)
        
        # Create FHIR Patient resource
        fhir_patient = FHIRPatientResource({
            'resourceType': 'Patient',
            'id': f'patient-{patient.id}',
            'name': [{
                'use': 'official',
                'family': patient.last_name,
                'given': [patient.first_name]
            }],
            'gender': patient.gender.lower(),
            'birthDate': patient.date_of_birth.isoformat(),
            'telecom': [{
                'system': 'phone',
                'value': patient.phone_number
            }, {
                'system': 'email',
                'value': patient.email
            }]
        })
        
        # Save FHIR Patient data
        fhir_patient_obj, created = FHIRPatient.objects.update_or_create(
            patient=patient,
            defaults={
                'fhir_id': f'patient-{patient.id}',
                'fhir_resource': fhir_patient.dict(),
            }
        )
        
        serializer = self.get_serializer(fhir_patient_obj)
        return Response(serializer.data)

class FHIRObservationViewSet(viewsets.ModelViewSet):
    queryset = FHIRObservation.objects.all()
    serializer_class = FHIRObservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = FHIRObservation.objects.all()
        if not self.request.user.is_staff:
            # If not staff, only show observations for the current patient
            queryset = queryset.filter(patient__user=self.request.user)
        return queryset
    
    @action(detail=False, methods=['post'])
    def create_observation(self, request):
        patient_id = request.data.get('patient_id')
        medical_record_id = request.data.get('medical_record_id')
        code = request.data.get('code')
        value = request.data.get('value')
        unit = request.data.get('unit')
        
        patient = get_object_or_404(Patient, id=patient_id)
        
        # Create FHIR Observation resource
        fhir_observation = FHIRObservationResource({
            'resourceType': 'Observation',
            'id': f'obs-{patient.id}-{code}',
            'status': 'final',
            'code': {
                'coding': [{
                    'system': 'http://loinc.org',
                    'code': code
                }]
            },
            'subject': {
                'reference': f'Patient/{patient.fhir_data.fhir_id}'
            },
            'valueQuantity': {
                'value': float(value),
                'unit': unit,
                'system': 'http://unitsofmeasure.org'
            }
        })
        
        # Save FHIR Observation
        observation = FHIRObservation.objects.create(
            patient=patient,
            medical_record_id=medical_record_id,
            fhir_id=f'obs-{patient.id}-{code}',
            fhir_resource=fhir_observation.dict(),
            observation_date=request.data.get('observation_date'),
            code=code,
            value=value,
            unit=unit
        )
        
        serializer = self.get_serializer(observation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Create your views here.
