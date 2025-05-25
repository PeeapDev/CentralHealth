from rest_framework import serializers
from django.contrib.auth import get_user_model
from bson import ObjectId
from patients.serializers import PatientSerializer

User = get_user_model()

class ObjectIdField(serializers.Field):
    def to_representation(self, value):
        return str(value)
    
    def to_internal_value(self, data):
        return ObjectId(data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']

class PatientSerializer(serializers.Serializer):
    # Assuming PatientSerializer is defined in patients.serializers
    pass

class ChatRoomSerializer(serializers.Serializer):
    _id = ObjectIdField(read_only=True)
    patient = PatientSerializer(read_only=True)
    hospital_staff = serializers.ListField(child=UserSerializer(), read_only=True)
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_unread_count(self, obj):
        user = self.context.get('request').user
        # Assuming obj.messages is a list of Message objects
        return len([message for message in obj.messages if not message.is_read and message.sender_id != str(user.id)])

    def get_last_message(self, obj):
        # Assuming obj.messages is a list of Message objects
        last_message = next((message for message in reversed(obj.messages) if message), None)
        if last_message:
            return MessageSerializer(last_message).data
        return None

class MessageSerializer(serializers.Serializer):
    _id = ObjectIdField(read_only=True)
    chat_room_id = ObjectIdField()
    sender_id = serializers.CharField(read_only=True)
    sender_type = serializers.SerializerMethodField()
    content = serializers.CharField()
    timestamp = serializers.DateTimeField(read_only=True)
    is_read = serializers.BooleanField(read_only=True)

    def get_sender_type(self, obj):
        if obj.sender_id == 'ai':
            return 'ai'
        user = User.objects.get(id=obj.sender_id)
        return 'staff' if user.is_staff else 'patient'

class ChatNotificationSerializer(serializers.Serializer):
    _id = ObjectIdField(read_only=True)
    chat_room = ChatRoomSerializer(read_only=True)
    message = MessageSerializer(read_only=True)
    recipient_id = serializers.CharField(read_only=True)
    notification_type = serializers.CharField(read_only=True)
    content = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = ChatNotification
        fields = [
            'id',
            'chat_room',
            'recipient',
            'notification_type',
            'notification_type_display',
            'message',
            'created_at',
            'is_read',
            'metadata',
        ]
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add any custom notification message based on type
        if instance.notification_type == ChatNotification.NotificationType.NEW_MESSAGE:
            data['message_preview'] = instance.message.content[:100] if instance.message else ''
        elif instance.notification_type == ChatNotification.NotificationType.STAFF_JOINED:
            data['staff_name'] = instance.metadata.get('staff_name', '')
        elif instance.notification_type == ChatNotification.NotificationType.PATIENT_JOINED:
            data['patient_name'] = instance.metadata.get('patient_name', '')
        return data
