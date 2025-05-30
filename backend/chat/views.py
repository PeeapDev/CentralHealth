from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
import motor.motor_asyncio
from django.conf import settings
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync, sync_to_async
from bson import ObjectId
from .models import ChatRoom, Message, ChatNotification, chat_rooms, messages, notifications
from .serializers import ChatRoomSerializer, MessageSerializer, ChatNotificationSerializer

class ChatRoomViewSet(viewsets.ViewSet):
    def get_mongo_db(self):
        client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
        return client[settings.MONGODB_DB_NAME]
    permission_classes = [permissions.IsAuthenticated]
    
    @sync_to_async
    def list(self, request):
        db = self.get_mongo_db()
        chat_rooms = []
        cursor = db.chat_rooms.find()
        for room in cursor:
            chat_rooms.append(room)
        serializer = ChatRoomSerializer(chat_rooms, many=True)
        return Response(serializer.data)
    
    @sync_to_async
    def create(self, request):
        serializer = ChatRoomSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            data['participants'] = [str(request.user.id)]
            room = ChatRoom.create(**data)
            return Response(ChatRoomSerializer(room).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @sync_to_async
    def retrieve(self, request, pk=None):
        db = self.get_mongo_db()
        room = db.chat_rooms.find_one({'_id': ObjectId(pk)})
        if not room:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ChatRoomSerializer(room)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    @sync_to_async
    def messages(self, request, pk=None):
        db = self.get_mongo_db()
        room_messages = list(db.messages.find({'chat_room_id': ObjectId(pk)}))
        
        # Mark messages as read
        user_id = str(request.user.id)
        unread_filter = {
            'chat_room_id': ObjectId(pk),
            'is_read': False,
            'sender_id': {'$ne': user_id}
        }
        
        db.messages.update_many(unread_filter, {'$set': {'is_read': True}})
        
        # Update chat room unread status
        unread_count = db.messages.count_documents({
            'chat_room_id': ObjectId(pk),
            'is_read': False
        })
        
        if unread_count == 0:
            db.chat_rooms.update_one(
                {'_id': ObjectId(pk)},
                {'$set': {'has_unread_messages': False}}
            )
        
        serializer = MessageSerializer(room_messages, many=True)
        return Response(serializer.data)

class MessageViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    async def list(self, request):
        chat_room_id = request.query_params.get('chat_room')
        if not chat_room_id:
            return Response({'error': 'chat_room parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        room_messages = await Message.get_room_messages(chat_room_id)
        serializer = MessageSerializer(room_messages, many=True)
        return Response(serializer.data)
    
    async def create(self, request):
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            data['sender_id'] = str(request.user.id)
            
            message = await Message.create(**data)
            
            # Update chat room
            await chat_rooms.update_one(
                {'_id': ObjectId(data['chat_room_id'])},
                {
                    '$set': {
                        'has_unread_messages': True,
                        'last_message_timestamp': message.timestamp
                    }
                }
            )
            
            # Send WebSocket notification
            channel_layer = get_channel_layer()
            await sync_to_async(channel_layer.group_send)(
                f'chat_{data["chat_room_id"]}',
                {
                    'type': 'chat.message',
                    'message': MessageSerializer(message).data
                }
            )
            
            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChatNotificationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    async def list(self, request):
        user_notifications = await notifications.find({
            'recipient_id': str(request.user.id)
        }).sort('created_at', -1).to_list(length=None)
        
        serializer = ChatNotificationSerializer(user_notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    async def mark_all_read(self, request):
        await notifications.update_many(
            {
                'recipient_id': str(request.user.id),
                'is_read': False
            },
            {'$set': {'is_read': True}}
        )
        return Response({'status': 'notifications marked as read'})
    
    @action(detail=True, methods=['post'])
    async def mark_read(self, request, pk=None):
        await notifications.update_one(
            {'_id': ObjectId(pk)},
            {'$set': {'is_read': True}}
        )
        return Response({'status': 'notification marked as read'})
    
    @action(detail=False, methods=['get'])
    async def unread_count(self, request):
        count = await notifications.count_documents({
            'recipient_id': str(request.user.id),
            'is_read': False
        })
        return Response({'unread_count': count})
