from django.urls import path
from .views import HospitalView, HospitalDetailView

urlpatterns = [
    path('hospitals/', HospitalView.as_view(), name='hospital-list'),
    path('hospitals/<str:hospital_id>/', HospitalDetailView.as_view(), name='hospital-detail'),
]
