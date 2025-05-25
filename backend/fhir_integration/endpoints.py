from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from fhir.resources.patient import Patient
from fhir.resources.observation import Observation
from .models import FHIRPatient, FHIRObservation
from .serializers import FHIRPatientSerializer, FHIRObservationSerializer
from utils.mongodb_utils import log_audit, track_analytics
from backend.mongodb import get_cache_collection
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@log_audit('create_fhir_patient')
@track_analytics('fhir_integration')
def create_fhir_patient(request):
    """Create a new FHIR Patient resource."""
    try:
        # Create FHIR Patient resource
        patient_data = request.data
        fhir_patient = Patient.parse_obj(patient_data)
        
        # Save to PostgreSQL
        db_patient = FHIRPatient.objects.create(
            fhir_resource=fhir_patient.dict(),
            identifier=fhir_patient.identifier[0].value.value if fhir_patient.identifier else None,
            name=f"{fhir_patient.name[0].given[0].value} {fhir_patient.name[0].family.value}" if fhir_patient.name else None,
        )
        
        # Cache in MongoDB
        cache = get_cache_collection()
        cache.insert_one({
            'type': 'patient',
            'id': str(db_patient.id),
            'fhir_resource': fhir_patient.dict(),
            'timestamp': datetime.utcnow()
        })
        
        serializer = FHIRPatientSerializer(db_patient)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@log_audit('create_fhir_observation')
@track_analytics('fhir_integration')
def create_fhir_observation(request):
    """Create a new FHIR Observation resource."""
    try:
        # Create FHIR Observation resource
        observation_data = request.data
        fhir_observation = Observation.parse_obj(observation_data)
        
        # Save to PostgreSQL
        db_observation = FHIRObservation.objects.create(
            fhir_resource=fhir_observation.dict(),
            patient_id=request.data.get('patient_id'),
            code=fhir_observation.code.coding[0].code.value if fhir_observation.code.coding else None,
            value=str(fhir_observation.valueQuantity.value.value) if fhir_observation.valueQuantity else None,
        )
        
        # Cache in MongoDB
        cache = get_cache_collection()
        cache.insert_one({
            'type': 'observation',
            'id': str(db_observation.id),
            'fhir_resource': fhir_observation.dict(),
            'patient_id': request.data.get('patient_id'),
            'timestamp': datetime.utcnow()
        })
        
        serializer = FHIRObservationSerializer(db_observation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@log_audit('get_patient_observations')
@track_analytics('fhir_integration')
def get_patient_observations(request, patient_id):
    """Get all observations for a specific patient."""
    try:
        # Try to get from MongoDB cache first
        cache = get_cache_collection()
        cached_observations = list(cache.find({
            'type': 'observation',
            'patient_id': patient_id
        }).sort('timestamp', -1))
        
        if cached_observations:
            return Response(cached_observations, status=status.HTTP_200_OK)
        
        # If not in cache, get from PostgreSQL
        observations = FHIRObservation.objects.filter(patient_id=patient_id)
        serializer = FHIRObservationSerializer(observations, many=True)
        
        # Cache the results
        for obs in serializer.data:
            cache.insert_one({
                'type': 'observation',
                'id': str(obs['id']),
                'fhir_resource': obs['fhir_resource'],
                'patient_id': patient_id,
                'timestamp': datetime.utcnow()
            })
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
