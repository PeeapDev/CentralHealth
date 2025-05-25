from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer

class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = ChatRoom.objects.all()
        if not self.request.user.is_staff:
            # If not staff, only show chat rooms for the current patient
            queryset = queryset.filter(patient__user=self.request.user)
        return queryset
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        chat_room = self.get_object()
        messages = Message.objects.filter(chat_room=chat_room)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Message.objects.all()
        chat_room_id = self.request.query_params.get('chat_room', None)
        if chat_room_id:
            queryset = queryset.filter(chat_room_id=chat_room_id)
        if not self.request.user.is_staff:
            # If not staff, only show messages from their chat rooms
            queryset = queryset.filter(chat_room__patient__user=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        # Send message through WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{message.chat_room.id}',
            {
                'type': 'chat.message',
                'message': MessageSerializer(message).data
            }
        )

# Create your views here.
