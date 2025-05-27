from django.conf import settings
from django.shortcuts import get_object_or_404
from .models import Hospital

class HospitalSubdomainMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get the hostname from the request
        hostname = request.get_host().split(':')[0]
        
        # Extract subdomain
        parts = hostname.split('.')
        subdomain = None
        
        # Check if this is a superadmin request (no subdomain)
        if hostname in ['localhost', '127.0.0.1'] and len(parts) == 1:
            request.hospital = None
            return self.get_response(request)
        
        # Handle subdomain.localhost format
        if len(parts) >= 2:
            if parts[-1] in ['localhost', '127.0.0.1']:
                subdomain = parts[0]
        
        if subdomain and subdomain != 'www':
            try:
                request.hospital = Hospital.objects.get(subdomain=subdomain, is_active=True)
                # Add hospital info to request for use in views
                request.is_hospital_admin = (
                    request.user.is_authenticated and 
                    request.user == request.hospital.admin
                )
            except Hospital.DoesNotExist:
                request.hospital = None
                request.is_hospital_admin = False
        else:
            request.hospital = None
            request.is_hospital_admin = False
        
        response = self.get_response(request)
        return response
