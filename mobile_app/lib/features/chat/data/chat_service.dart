import 'package:dio/dio.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../core/config/api_config.dart';
import '../models/chat_message.dart';
import 'package:google_generative_ai/google_generative_ai.dart';

class ChatService {
  final Dio _dio;
  final String _geminiApiKey;
  WebSocketChannel? _channel;
  final void Function(ChatMessage)? onMessageReceived;
  final void Function()? onStaffOnline;
  final void Function()? onStaffOffline;

  ChatService(
    this._dio,
    this._geminiApiKey, {
    this.onMessageReceived,
    this.onStaffOnline,
    this.onStaffOffline,
  });

  Future<void> connectWebSocket(String userId) async {
    final wsUrl = '${ApiConfig.wsBaseUrl}/ws/chat/$userId/';
    _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

    _channel?.stream.listen(
      (message) {
        final data = jsonDecode(message);
        if (data['type'] == 'staff_status') {
          if (data['online']) {
            onStaffOnline?.call();
          } else {
            onStaffOffline?.call();
          }
        } else if (data['type'] == 'message') {
          onMessageReceived?.call(ChatMessage.fromJson(data['message']));
        }
      },
      onError: (error) {
        print('WebSocket Error: $error');
      },
      onDone: () {
        print('WebSocket connection closed');
      },
    );
  }

  void disconnectWebSocket() {
    _channel?.sink.close();
    _channel = null;
  }

  Future<void> sendMessage(ChatMessage message) async {
    if (_channel != null) {
      _channel?.sink.add(jsonEncode({
        'type': 'message',
        'message': message.toJson(),
      }));
    }
  }

  Future<ChatMessage> getAIResponse(String userMessage) async {
    try {
      final model = GenerativeModel(
        model: 'gemini-pro',
        apiKey: _geminiApiKey,
      );

      final prompt = '''
      You are a helpful medical assistant. Please provide a professional and 
      accurate response to the following patient query. If the query requires 
      immediate medical attention, please advise the patient to seek emergency care:
      
      $userMessage
      ''';

      final response = await model.generateContent(prompt);
      final aiMessage = response.text;

      return ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        senderId: 'AI_ASSISTANT',
        content: aiMessage,
        timestamp: DateTime.now(),
        isAI: true,
      );
    } catch (e) {
      return ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        senderId: 'AI_ASSISTANT',
        content: 'I apologize, but I\'m having trouble processing your request. Please try again later or contact the hospital directly for assistance.',
        timestamp: DateTime.now(),
        isAI: true,
      );
    }
  }

  Future<List<ChatMessage>> getChatHistory(String userId) async {
    try {
      final response = await _dio.get('/api/chat/history/$userId/');
      return (response.data['messages'] as List)
          .map((m) => ChatMessage.fromJson(m))
          .toList();
    } catch (e) {
      throw Exception('Failed to load chat history');
    }
  }
}
