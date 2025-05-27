from django.urls import path, include
from rest_framework.routers import DefaultRouter
from patients.views import PatientViewSet, MedicalRecordViewSet, AppointmentViewSet
from fhir_integration.views import FHIRPatientViewSet, FHIRObservationViewSet

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'medical-records', MedicalRecordViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'fhir/patients', FHIRPatientViewSet)
router.register(r'fhir/observations', FHIRObservationViewSet)

urlpatterns = [
    path('v1/', include(router.urls)),
    path('auth/', include('rest_framework.urls')),
]
