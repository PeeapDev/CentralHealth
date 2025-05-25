from django.urls import path
from . import views, endpoints, additional_endpoints

urlpatterns = [
    # Existing view endpoints
    path('patients/', views.FHIRPatientViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('patients/<int:pk>/', views.FHIRPatientViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),
    path('observations/', views.FHIRObservationViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('observations/<int:pk>/', views.FHIRObservationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),
    
    # Basic FHIR endpoints
    path('fhir/patient/create/', endpoints.create_fhir_patient, name='create-fhir-patient'),
    path('fhir/observation/create/', endpoints.create_fhir_observation, name='create-fhir-observation'),
    path('fhir/patient/<int:patient_id>/observations/', endpoints.get_patient_observations, name='get-patient-observations'),
    
    # Additional FHIR endpoints
    path('fhir/condition/create/', additional_endpoints.create_condition, name='create-condition'),
    path('fhir/medication-request/create/', additional_endpoints.create_medication_request, name='create-medication-request'),
    path('fhir/patient/<int:patient_id>/history/', additional_endpoints.get_patient_history, name='get-patient-history'),
    path('fhir/appointment/schedule/', additional_endpoints.schedule_appointment, name='schedule-appointment'),
    path('fhir/search/', additional_endpoints.search_fhir_resources, name='search-fhir-resources'),
]
