from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Hospital, Subscription

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['plan', 'start_date', 'end_date', 'is_active']

class HospitalSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    subscription = SubscriptionSerializer(read_only=True)
    
    class Meta:
        model = Hospital
        fields = ['id', 'name', 'subdomain', 'admin', 'subscription', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['subdomain']  # subdomain is auto-generated from name

class HospitalCreateSerializer(serializers.ModelSerializer):
    admin_email = serializers.EmailField(write_only=True)
    admin_password = serializers.CharField(write_only=True, min_length=8)
    subscription_plan = serializers.ChoiceField(choices=Subscription.PLAN_CHOICES, write_only=True)
    
    class Meta:
        model = Hospital
        fields = ['name', 'admin_email', 'admin_password', 'subscription_plan']
    
    def create(self, validated_data):
        # Create admin user
        admin = User.objects.create_user(
            username=validated_data['admin_email'],
            email=validated_data['admin_email'],
            password=validated_data['admin_password'],
            is_staff=True
        )
        
        # Create hospital
        hospital = Hospital.objects.create(
            name=validated_data['name'],
            admin=admin
        )
        
        # Create subscription
        Subscription.objects.create(
            hospital=hospital,
            plan=validated_data['subscription_plan']
        )
        
        return hospital
