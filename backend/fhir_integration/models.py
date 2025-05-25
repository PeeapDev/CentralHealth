from django.db import models
from django.db.models import JSONField
from patients.models import Patient, MedicalRecord

class FHIRPatient(models.Model):
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='fhir_data')
    fhir_id = models.CharField(max_length=100, unique=True)
    fhir_resource = JSONField()
    last_synced = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f'FHIR Patient: {self.patient.first_name} {self.patient.last_name}'

class FHIRObservation(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='fhir_observations')
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='fhir_observations')
    fhir_id = models.CharField(max_length=100, unique=True)
    fhir_resource = JSONField()
    observation_date = models.DateTimeField()
    code = models.CharField(max_length=50)  # LOINC or SNOMED code
    value = models.CharField(max_length=100)
    unit = models.CharField(max_length=20, null=True, blank=True)
    
    class Meta:
        ordering = ['-observation_date']
    
    def __str__(self):
        return f'FHIR Observation: {self.code} for {self.patient.first_name}'

# Create your models here.
