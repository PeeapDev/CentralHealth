from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from .models import notifications, chat_rooms, messages
from .serializers import ChatNotificationSerializer
from datetime import datetime

User = get_user_model()

async def create_notification(recipient_id, chat_room_id, message_id=None, notification_type='new_message', content=''):
    notification = {
        'recipient_id': str(recipient_id),
        'chat_room_id': chat_room_id,
        'message_id': message_id,
        'notification_type': notification_type,
        'content': content,
        'created_at': datetime.utcnow(),
        'is_read': False
    }
    
    result = await notifications.insert_one(notification)
    notification['_id'] = result.inserted_id
    
    # Send notification through WebSocket
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f'notifications_{recipient_id}',
        {
            'type': 'notification.message',
            'notification': ChatNotificationSerializer(notification).data
        }
    )

async def notify_message(message, chat_room):
    sender_id = message.sender_id
    sender = await User.objects.aget(id=sender_id)
    sender_name = sender.get_full_name() or sender.username
    
    # Get all participants except sender
    room_data = await chat_rooms.find_one({'_id': chat_room['_id']})
    if not room_data:
        return
    
    for participant_id in room_data.get('participants', []):
        if participant_id != str(sender_id):
            await create_notification(
                recipient_id=participant_id,
                chat_room_id=chat_room['_id'],
                message_id=message._id,
                notification_type='new_message',
                content=f'New message from {sender_name}'
            )

async def notify_staff_change(chat_room_id, staff_id, action_type):
    staff = await User.objects.aget(id=staff_id)
    staff_name = staff.get_full_name() or staff.username
    
    # Get all participants except the staff member
    room_data = await chat_rooms.find_one({'_id': chat_room_id})
    if not room_data:
        return
    
    for participant_id in room_data.get('participants', []):
        if participant_id != str(staff_id):
            await create_notification(
                recipient_id=participant_id,
                chat_room_id=chat_room_id,
                notification_type='staff_change',
                content=f'{staff_name} has {action_type} the chat'
            )

@receiver(m2m_changed, sender=chat_rooms.hospital_staff.through)
async def notify_staff_changes(sender, instance, action, pk_set, **kwargs):
    if action == "post_add":
        for staff_id in pk_set:
            await notify_staff_change(instance._id, staff_id, 'joined')
            # Notify patient about new staff member
            ChatNotification.objects.create(
                chat_room=instance,
                recipient=instance.patient.user,
                notification_type=ChatNotification.NotificationType.STAFF_JOINED,
                metadata={'staff_name': staff.get_full_name() or staff.username}
            )

@receiver(post_save, sender=ChatRoom)
def handle_chat_room_status(sender, instance, created, **kwargs):
    if created:
        # Notify all staff members about new chat room
        for staff in instance.hospital_staff.all():
            ChatNotification.objects.create(
                chat_room=instance,
                recipient=staff,
                notification_type=ChatNotification.NotificationType.PATIENT_JOINED,
                metadata={
                    'patient_name': instance.patient.full_name,
                    'patient_id': instance.patient.id,
                }
            )
    elif not instance.is_active and instance.tracker.has_changed('is_active'):
        # Notify all participants about chat closure
        recipients = list(instance.hospital_staff.all())
        recipients.append(instance.patient.user)
        
        for recipient in recipients:
            ChatNotification.objects.create(
                chat_room=instance,
                recipient=recipient,
                notification_type=ChatNotification.NotificationType.CHAT_CLOSED,
                metadata={'closed_at': timezone.now().isoformat()}
            )
