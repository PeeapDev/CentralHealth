from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Hospital, Subscription
from rest_framework.views import APIView
from django.http import JsonResponse
from bson import ObjectId
from django.utils.text import slugify
from django.contrib.auth.hashers import make_password

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser

class HospitalView(APIView):
    permission_classes = [IsSuperAdmin]
    
    async def get(self, request):
        cursor = Hospital.collection.find()
        hospitals = []
        async for doc in cursor:
            doc['_id'] = str(doc['_id'])  # Convert ObjectId to string
            hospitals.append(doc)
        return JsonResponse({'hospitals': hospitals})
    
    async def post(self, request):
        data = request.data
        
        # Create hospital
        hospital = await Hospital.create(
            name=data['name'],
            admin_email=data['admin_email'],
            admin_password=make_password(data['admin_password']),
            is_active=True
        )
        
        # Create subscription
        subscription = await Subscription.create(
            hospital_id=hospital._id,
            plan=data.get('subscription_plan', Subscription.BASIC)
        )
        
        response_data = hospital.to_dict()
        response_data['_id'] = str(response_data['_id'])
        response_data['subscription'] = subscription.to_dict()
        response_data['subscription']['_id'] = str(response_data['subscription']['_id'])
        
        return JsonResponse(response_data, status=201)

class HospitalDetailView(APIView):
    permission_classes = [IsSuperAdmin]
    
    async def get(self, request, hospital_id):
        doc = await Hospital.collection.find_one({'_id': ObjectId(hospital_id)})
        if not doc:
            return JsonResponse({'error': 'Hospital not found'}, status=404)
        
        doc['_id'] = str(doc['_id'])
        return JsonResponse(doc)
    
    async def patch(self, request, hospital_id):
        data = request.data
        update_data = {}
        
        if 'name' in data:
            update_data['name'] = data['name']
            update_data['subdomain'] = slugify(data['name'])
        
        if 'is_active' in data:
            update_data['is_active'] = data['is_active']
            # Update subscription status too
            await Subscription.collection.update_one(
                {'hospital_id': ObjectId(hospital_id)},
                {'$set': {'is_active': data['is_active']}}
            )
        
        if update_data:
            update_data['updated_at'] = datetime.datetime.now()
            result = await Hospital.collection.update_one(
                {'_id': ObjectId(hospital_id)},
                {'$set': update_data}
            )
            
            if result.modified_count == 0:
                return JsonResponse({'error': 'Hospital not found'}, status=404)
        
        doc = await Hospital.collection.find_one({'_id': ObjectId(hospital_id)})
        doc['_id'] = str(doc['_id'])
        return JsonResponse(doc)
    
    async def delete(self, request, hospital_id):
        result = await Hospital.collection.delete_one({'_id': ObjectId(hospital_id)})
        if result.deleted_count == 0:
            return JsonResponse({'error': 'Hospital not found'}, status=404)
        
        # Delete associated subscription
        await Subscription.collection.delete_many({'hospital_id': ObjectId(hospital_id)})
        
        return JsonResponse({'status': 'deleted'})
