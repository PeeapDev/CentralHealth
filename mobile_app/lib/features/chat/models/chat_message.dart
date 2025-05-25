import 'package:equatable/equatable.dart';

class ChatMessage extends Equatable {
  final String id;
  final String senderId;
  final String content;
  final DateTime timestamp;
  final bool isAI;
  final String? senderName;
  final String? senderAvatar;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.content,
    required this.timestamp,
    this.isAI = false,
    this.senderName,
    this.senderAvatar,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      senderId: json['sender_id'],
      content: json['content'],
      timestamp: DateTime.parse(json['timestamp']),
      isAI: json['is_ai'] ?? false,
      senderName: json['sender_name'],
      senderAvatar: json['sender_avatar'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sender_id': senderId,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
      'is_ai': isAI,
      'sender_name': senderName,
      'sender_avatar': senderAvatar,
    };
  }

  @override
  List<Object?> get props => [
        id,
        senderId,
        content,
        timestamp,
        isAI,
        senderName,
        senderAvatar,
      ];

  ChatMessage copyWith({
    String? id,
    String? senderId,
    String? content,
    DateTime? timestamp,
    bool? isAI,
    String? senderName,
    String? senderAvatar,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      content: content ?? this.content,
      timestamp: timestamp ?? this.timestamp,
      isAI: isAI ?? this.isAI,
      senderName: senderName ?? this.senderName,
      senderAvatar: senderAvatar ?? this.senderAvatar,
    );
  }
}
