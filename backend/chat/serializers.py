from rest_framework import serializers
from .models import ChatRoom, Message
from patients.serializers import PatientSerializer, UserSerializer

class ChatRoomSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    hospital_staff = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatRoom
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
