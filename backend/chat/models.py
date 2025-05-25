from django.db import models
from patients.models import Patient
from django.utils.translation import gettext_lazy as _
from motor.motor_asyncio import AsyncIOMotorClient
from django.conf import settings
from datetime import datetime
from bson import ObjectId

# MongoDB connection
client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]

# Collections
chat_rooms = db.chat_rooms
messages = db.messages
notifications = db.notifications

# Ensure indexes
async def setup_indexes():
    await chat_rooms.create_index('name')
    await messages.create_index('chat_room_id')
    await messages.create_index('sender_id')
    await notifications.create_index('recipient_id')
    await notifications.create_index('chat_room_id')

# Model classes (for type hints and structure)
class ChatRoom:
    def __init__(self, name, description='', participants=None):
        self.name = name
        self.description = description
        self.participants = participants or []
        self.has_unread_messages = False
        self.last_message_timestamp = None
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    @classmethod
    async def create(cls, **kwargs):
        room = cls(**kwargs)
        result = await chat_rooms.insert_one(room.__dict__)
        room._id = result.inserted_id
        return room

    @classmethod
    async def get(cls, room_id):
        data = await chat_rooms.find_one({'_id': ObjectId(room_id)})
        return data

class Message:
    def __init__(self, chat_room_id, sender_id, content):
        self.chat_room_id = chat_room_id
        self.sender_id = sender_id
        self.content = content
        self.timestamp = datetime.utcnow()
        self.is_read = False

    @classmethod
    async def create(cls, **kwargs):
        message = cls(**kwargs)
        result = await messages.insert_one(message.__dict__)
        message._id = result.inserted_id
        return message

    @classmethod
    async def get_room_messages(cls, room_id):
        cursor = messages.find({'chat_room_id': ObjectId(room_id)})
        return await cursor.to_list(length=None)

class ChatNotification:
    class NotificationType(models.TextChoices):
        NEW_MESSAGE = 'NM', _('New Message')
        PATIENT_JOINED = 'PJ', _('Patient Joined')
        STAFF_JOINED = 'SJ', _('Staff Joined')
        CHAT_CLOSED = 'CC', _('Chat Closed')

    def __init__(self, recipient_id, chat_room_id, message_id=None, notification_type='new_message', content=''):
        self.recipient_id = recipient_id
        self.chat_room_id = chat_room_id
        self.message_id = message_id
        self.notification_type = notification_type
        self.content = content
        self.created_at = datetime.utcnow()
        self.is_read = False
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['chat_room', '-created_at']),
        ]

    def __str__(self):
        return f'Notification for {self.recipient.username} - {self.get_notification_type_display()}'
