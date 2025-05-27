from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Hospital
from .serializers import HospitalSerializer

class IsHospitalAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return hasattr(request, 'is_hospital_admin') and request.is_hospital_admin

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_current_hospital(request):
    """Get the current hospital based on the subdomain"""
    if not hasattr(request, 'hospital') or not request.hospital:
        return Response(
            {'detail': 'No hospital found for this domain'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = HospitalSerializer(request.hospital)
    return Response({
        'hospital': serializer.data,
        'is_admin': request.is_hospital_admin
    })

@api_view(['GET'])
@permission_classes([IsHospitalAdmin])
def get_hospital_dashboard(request):
    """Get dashboard data for the current hospital"""
    if not request.hospital:
        return Response(
            {'detail': 'No hospital found for this domain'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Add any dashboard-specific data here
    return Response({
        'hospital': HospitalSerializer(request.hospital).data,
        'stats': {
            'total_patients': 0,  # Add actual stats
            'total_appointments': 0,
            'active_chats': 0,
        }
    })
