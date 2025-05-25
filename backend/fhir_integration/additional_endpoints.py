from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from fhir.resources.patient import Patient
from fhir.resources.condition import Condition
from fhir.resources.medication import Medication
from fhir.resources.medicationrequest import MedicationRequest
from fhir.resources.appointment import Appointment as FHIRAppointment
from datetime import datetime
from .models import FHIRPatient, FHIRObservation
from .serializers import FHIRPatientSerializer, FHIRObservationSerializer
from utils.mongodb_utils import log_audit, track_analytics
from backend.mongodb import get_cache_collection

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@log_audit('create_fhir_condition')
@track_analytics('fhir_integration')
def create_condition(request):
    """Create a new FHIR Condition resource."""
    try:
        condition_data = request.data
        fhir_condition = Condition.parse_obj(condition_data)
        
        # Cache in MongoDB
        cache = get_cache_collection()
        cache_entry = {
            'type': 'condition',
            'patient_id': request.data.get('patient_id'),
            'fhir_resource': fhir_condition.dict(),
            'timestamp': datetime.utcnow()
        }
        cache.insert_one(cache_entry)
        
        return Response(fhir_condition.dict(), status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@log_audit('create_medication_request')
@track_analytics('fhir_integration')
def create_medication_request(request):
    """Create a new FHIR MedicationRequest resource."""
    try:
        med_request_data = request.data
        fhir_med_request = MedicationRequest.parse_obj(med_request_data)
        
        # Cache in MongoDB
        cache = get_cache_collection()
        cache_entry = {
            'type': 'medication_request',
            'patient_id': request.data.get('patient_id'),
            'fhir_resource': fhir_med_request.dict(),
            'timestamp': datetime.utcnow()
        }
        cache.insert_one(cache_entry)
        
        return Response(fhir_med_request.dict(), status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@log_audit('get_patient_history')
@track_analytics('fhir_integration')
def get_patient_history(request, patient_id):
    """Get complete patient history including conditions, medications, and observations."""
    try:
        cache = get_cache_collection()
        
        # Get all patient-related resources from cache
        conditions = list(cache.find({
            'type': 'condition',
            'patient_id': patient_id
        }).sort('timestamp', -1))
        
        medications = list(cache.find({
            'type': 'medication_request',
            'patient_id': patient_id
        }).sort('timestamp', -1))
        
        observations = list(cache.find({
            'type': 'observation',
            'patient_id': patient_id
        }).sort('timestamp', -1))
        
        patient_history = {
            'conditions': conditions,
            'medications': medications,
            'observations': observations
        }
        
        return Response(patient_history, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@log_audit('schedule_fhir_appointment')
@track_analytics('fhir_integration')
def schedule_appointment(request):
    """Schedule a new FHIR Appointment."""
    try:
        appointment_data = request.data
        fhir_appointment = FHIRAppointment.parse_obj(appointment_data)
        
        # Cache in MongoDB
        cache = get_cache_collection()
        cache_entry = {
            'type': 'appointment',
            'patient_id': request.data.get('patient_id'),
            'fhir_resource': fhir_appointment.dict(),
            'timestamp': datetime.utcnow()
        }
        cache.insert_one(cache_entry)
        
        return Response(fhir_appointment.dict(), status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@log_audit('search_fhir_resources')
@track_analytics('fhir_integration')
def search_fhir_resources(request):
    """Search across all FHIR resources."""
    try:
        resource_type = request.query_params.get('resource_type')
        search_term = request.query_params.get('search_term')
        
        cache = get_cache_collection()
        query = {'type': resource_type} if resource_type else {}
        
        if search_term:
            query['$text'] = {'$search': search_term}
        
        results = list(cache.find(query).sort('timestamp', -1).limit(50))
        return Response(results, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
