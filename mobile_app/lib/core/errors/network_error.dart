import 'package:dio/dio.dart';

class NetworkError implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;
  
  NetworkError({
    required this.message,
    this.statusCode,
    this.data,
  });
  
  factory NetworkError.fromDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
        return NetworkError(
          message: 'Connection timeout. Please check your internet connection.',
          statusCode: error.response?.statusCode,
        );
      case DioExceptionType.sendTimeout:
        return NetworkError(
          message: 'Send timeout. Please try again.',
          statusCode: error.response?.statusCode,
        );
      case DioExceptionType.receiveTimeout:
        return NetworkError(
          message: 'Receive timeout. Please try again.',
          statusCode: error.response?.statusCode,
        );
      case DioExceptionType.badResponse:
        return NetworkError(
          message: error.response?.data?['message'] ?? 'Server error occurred.',
          statusCode: error.response?.statusCode,
          data: error.response?.data,
        );
      case DioExceptionType.cancel:
        return NetworkError(
          message: 'Request cancelled.',
          statusCode: error.response?.statusCode,
        );
      default:
        return NetworkError(
          message: 'Network error occurred. Please check your connection.',
          statusCode: error.response?.statusCode,
        );
    }
  }
  
  @override
  String toString() => message;
}
