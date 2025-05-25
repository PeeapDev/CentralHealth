from django.urls import path
from . import views, endpoints

urlpatterns = [
    # Existing view endpoints
    path('patients/', views.FHIRPatientViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('patients/<int:pk>/', views.FHIRPatientViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),
    path('observations/', views.FHIRObservationViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('observations/<int:pk>/', views.FHIRObservationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),
    
    # New FHIR-specific endpoints
    path('fhir/patient/create/', endpoints.create_fhir_patient, name='create-fhir-patient'),
    path('fhir/observation/create/', endpoints.create_fhir_observation, name='create-fhir-observation'),
    path('fhir/patient/<int:patient_id>/observations/', endpoints.get_patient_observations, name='get-patient-observations'),
]
