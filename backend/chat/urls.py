from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatRoomViewSet, MessageViewSet, ChatNotificationViewSet

router = DefaultRouter()
router.register(r'chat-rooms', ChatRoomViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'notifications', ChatNotificationViewSet, basename='chat-notifications')

urlpatterns = [
    path('', include(router.urls)),
]
