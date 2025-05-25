import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatNotification
from django.contrib.auth.models import User

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.notification_group_name = f'notifications_{self.user_id}'
        
        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave notification group
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')
        
        if action == 'mark_read':
            notification_id = text_data_json.get('notification_id')
            await self.mark_notification_read(notification_id)
            
            # Send update to all connected clients
            await self.channel_layer.group_send(
                self.notification_group_name,
                {
                    'type': 'notification.update',
                    'notification_id': notification_id,
                    'is_read': True
                }
            )
    
    async def notification_update(self, event):
        # Send notification update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification_update',
            'notification_id': event['notification_id'],
            'is_read': event['is_read']
        }))
    
    async def new_notification(self, event):
        # Send new notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': event['notification']
        }))
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        try:
            notification = ChatNotification.objects.get(
                id=notification_id,
                recipient_id=self.user_id,
                is_read=False
            )
            notification.is_read = True
            notification.save()
            
            # If this is a message notification, also mark the message as read
            if notification.message:
                notification.message.is_read = True
                notification.message.save()
                
                # Check if all messages in the chat room are read
                unread_count = notification.chat_room.messages.filter(is_read=False).count()
                if unread_count == 0:
                    notification.chat_room.has_unread_messages = False
                    notification.chat_room.save()
            
            return True
        except ChatNotification.DoesNotExist:
            return False
