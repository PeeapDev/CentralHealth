import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../data/chat_service.dart';
import '../models/chat_message.dart';

// Events
abstract class ChatEvent extends Equatable {
  const ChatEvent();

  @override
  List<Object?> get props => [];
}

class InitializeChat extends ChatEvent {
  final String userId;

  const InitializeChat(this.userId);

  @override
  List<Object?> get props => [userId];
}

class SendMessage extends ChatEvent {
  final String content;
  final String senderId;

  const SendMessage({
    required this.content,
    required this.senderId,
  });

  @override
  List<Object?> get props => [content, senderId];
}

class MessageReceived extends ChatEvent {
  final ChatMessage message;

  const MessageReceived(this.message);

  @override
  List<Object?> get props => [message];
}

class StaffStatusChanged extends ChatEvent {
  final bool isOnline;

  const StaffStatusChanged(this.isOnline);

  @override
  List<Object?> get props => [isOnline];
}

// States
abstract class ChatState extends Equatable {
  const ChatState();

  @override
  List<Object?> get props => [];
}

class ChatInitial extends ChatState {}

class ChatLoading extends ChatState {}

class ChatActive extends ChatState {
  final List<ChatMessage> messages;
  final bool isStaffOnline;
  final bool isTyping;

  const ChatActive({
    required this.messages,
    this.isStaffOnline = false,
    this.isTyping = false,
  });

  @override
  List<Object?> get props => [messages, isStaffOnline, isTyping];

  ChatActive copyWith({
    List<ChatMessage>? messages,
    bool? isStaffOnline,
    bool? isTyping,
  }) {
    return ChatActive(
      messages: messages ?? this.messages,
      isStaffOnline: isStaffOnline ?? this.isStaffOnline,
      isTyping: isTyping ?? this.isTyping,
    );
  }
}

class ChatError extends ChatState {
  final String message;

  const ChatError(this.message);

  @override
  List<Object?> get props => [message];
}

// BLoC
class ChatBloc extends Bloc<ChatEvent, ChatState> {
  final ChatService _chatService;

  ChatBloc(this._chatService) : super(ChatInitial()) {
    on<InitializeChat>(_onInitializeChat);
    on<SendMessage>(_onSendMessage);
    on<MessageReceived>(_onMessageReceived);
    on<StaffStatusChanged>(_onStaffStatusChanged);
  }

  Future<void> _onInitializeChat(
    InitializeChat event,
    Emitter<ChatState> emit,
  ) async {
    try {
      emit(ChatLoading());

      // Connect to WebSocket
      await _chatService.connectWebSocket(event.userId);

      // Load chat history
      final messages = await _chatService.getChatHistory(event.userId);
      emit(ChatActive(messages: messages));
    } catch (e) {
      emit(ChatError(e.toString()));
    }
  }

  Future<void> _onSendMessage(
    SendMessage event,
    Emitter<ChatState> emit,
  ) async {
    if (state is ChatActive) {
      final currentState = state as ChatActive;
      final message = ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        senderId: event.senderId,
        content: event.content,
        timestamp: DateTime.now(),
      );

      // Add message to the list
      final updatedMessages = List<ChatMessage>.from(currentState.messages)
        ..add(message);
      emit(currentState.copyWith(messages: updatedMessages));

      // Send message through WebSocket
      await _chatService.sendMessage(message);

      // If no staff is online, get AI response
      if (!currentState.isStaffOnline) {
        emit(currentState.copyWith(isTyping: true));
        final aiResponse = await _chatService.getAIResponse(event.content);
        final updatedMessagesWithAI = List<ChatMessage>.from(updatedMessages)
          ..add(aiResponse);
        emit(currentState.copyWith(
          messages: updatedMessagesWithAI,
          isTyping: false,
        ));
      }
    }
  }

  void _onMessageReceived(
    MessageReceived event,
    Emitter<ChatState> emit,
  ) {
    if (state is ChatActive) {
      final currentState = state as ChatActive;
      final updatedMessages = List<ChatMessage>.from(currentState.messages)
        ..add(event.message);
      emit(currentState.copyWith(messages: updatedMessages));
    }
  }

  void _onStaffStatusChanged(
    StaffStatusChanged event,
    Emitter<ChatState> emit,
  ) {
    if (state is ChatActive) {
      final currentState = state as ChatActive;
      emit(currentState.copyWith(isStaffOnline: event.isOnline));
    }
  }

  @override
  Future<void> close() {
    _chatService.disconnectWebSocket();
    return super.close();
  }
}
