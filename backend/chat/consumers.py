import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, Message, ChatNotification
from django.contrib.auth.models import User
from django.utils import timezone

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        user_id = text_data_json['user_id']
        
        # Save message to database
        saved_message = await self.save_message(user_id, message)
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat.message',
                'message': message,
                'user_id': user_id,
                'timestamp': saved_message.timestamp.isoformat(),
                'is_read': saved_message.is_read
            }
        )
    
    async def chat_message(self, event):
        message = event['message']
        user_id = event['user_id']
        timestamp = event['timestamp']
        is_read = event['is_read']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'user_id': user_id,
            'timestamp': timestamp,
            'is_read': is_read
        }))
    
    @database_sync_to_async
    def save_message(self, user_id, content):
        user = User.objects.get(id=user_id)
        chat_room = ChatRoom.objects.get(id=self.room_id)
        message = Message.objects.create(
            chat_room=chat_room,
            sender=user,
            content=content
        )
        
        # Update chat room status
        chat_room.has_unread_messages = True
        chat_room.last_message_timestamp = timezone.now()
        chat_room.save()
        
        # Create notifications
        if user.is_staff:
            # If sender is staff, notify the patient
            ChatNotification.objects.create(
                chat_room=chat_room,
                recipient=chat_room.patient.user,
                notification_type=ChatNotification.NotificationType.NEW_MESSAGE,
                message=message
            )
        else:
            # If sender is patient, notify all staff members
            for staff in chat_room.hospital_staff.all():
                if staff != user:
                    ChatNotification.objects.create(
                        chat_room=chat_room,
                        recipient=staff,
                        notification_type=ChatNotification.NotificationType.NEW_MESSAGE,
                        message=message,
                        metadata={
                            'patient_name': chat_room.patient.full_name,
                            'message_preview': content[:100]
                        }
                    )
        return message
