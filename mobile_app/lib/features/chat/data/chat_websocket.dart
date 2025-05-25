import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../core/config/api_config.dart';

class ChatWebSocket {
  WebSocketChannel? _channel;
  final StreamController<Map<String, dynamic>> _messageController = StreamController.broadcast();
  
  Stream<Map<String, dynamic>> get messages => _messageController.stream;
  
  void connect(int roomId, String token) {
    final wsUrl = ApiConfig.chatWebSocket(roomId);
    final uri = Uri.parse(wsUrl);
    
    _channel = WebSocketChannel.connect(
      uri,
      protocols: ['Bearer $token'],
    );
    
    _channel!.stream.listen(
      (message) {
        final data = jsonDecode(message as String);
        _messageController.add(data);
      },
      onError: (error) {
        print('WebSocket Error: $error');
        reconnect(roomId, token);
      },
      onDone: () {
        print('WebSocket connection closed');
        reconnect(roomId, token);
      },
    );
  }
  
  void sendMessage(String message, int userId) {
    if (_channel != null) {
      final data = {
        'message': message,
        'user_id': userId,
      };
      _channel!.sink.add(jsonEncode(data));
    }
  }
  
  void reconnect(int roomId, String token) {
    Future.delayed(const Duration(seconds: 5), () {
      connect(roomId, token);
    });
  }
  
  void dispose() {
    _channel?.sink.close();
    _messageController.close();
  }
}
