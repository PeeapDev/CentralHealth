import 'package:dio/dio.dart';
import 'dart:convert';
import 'dart:developer' as developer;
import '../config/api_config.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  
  late Dio _dio;
  String _baseUrl = '';
  
  ApiClient._internal() {
    _baseUrl = ApiConfig.baseUrl;
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    
    // Add logging interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          developer.log('API Request: ${options.method} ${options.uri}');
          developer.log('API Request Headers: ${options.headers}');
          if (options.data != null) {
            developer.log('API Request Body: ${options.data}');
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          developer.log('API Response: ${response.statusCode} from ${response.requestOptions.uri}');
          developer.log('API Response Headers: ${response.headers}');
          developer.log('API Response Body: ${response.data}');
          return handler.next(response);
        },
        onError: (error, handler) {
          developer.log('API Error: ${error.message} for ${error.requestOptions.uri}');
          if (error.response != null) {
            developer.log('API Error Response: ${error.response?.statusCode} ${error.response?.data}');
          }
          return handler.next(error);
        },
      ),
    );
  }
  
  void updateBaseUrl(String url) {
    if (url.isEmpty) return;
    
    // Ensure URL ends with a slash for proper path concatenation
    _baseUrl = url.endsWith('/') ? url : '$url/';
    _dio.options.baseUrl = _baseUrl;
    developer.log('ApiClient: Base URL updated to $_baseUrl');
  }
  
  String get baseUrl => _baseUrl;
  
  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
    developer.log('ApiClient: Auth token set in headers');
  }
  
  void removeAuthToken() {
    _dio.options.headers.remove('Authorization');
    developer.log('ApiClient: Auth token removed from headers');
  }
  
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    developer.log('ApiClient: GET request to $path');
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
      );
      return response;
    } catch (e) {
      developer.log('ApiClient: GET request failed: $e');
      rethrow;
    }
  }
  
  Future<Response> post(String path, {dynamic data}) async {
    developer.log('ApiClient: POST request to $path');
    try {
      final response = await _dio.post(
        path,
        data: data,
      );
      return response;
    } catch (e) {
      developer.log('ApiClient: POST request failed: $e');
      rethrow;
    }
  }
  
  Future<Response> put(String path, {dynamic data}) async {
    developer.log('ApiClient: PUT request to $path');
    try {
      final response = await _dio.put(
        path,
        data: data,
      );
      return response;
    } catch (e) {
      developer.log('ApiClient: PUT request failed: $e');
      rethrow;
    }
  }
  
  Future<Response> delete(String path, {dynamic data}) async {
    developer.log('ApiClient: DELETE request to $path');
    try {
      final response = await _dio.delete(
        path,
        data: data,
      );
      return response;
    } catch (e) {
      developer.log('ApiClient: DELETE request failed: $e');
      rethrow;
    }
  }
  
  /// Handle API response and standardize the output
  Map<String, dynamic> _handleResponse(Response response) {
    // For successful API calls, we return the response data
    if (response.statusCode! >= 200 && response.statusCode! < 300) {
      if (response.data is Map<String, dynamic>) {
        return response.data;
      } else if (response.data is List) {
        return {'data': response.data};
      } else if (response.data is String) {
        try {
          // Try to decode the string as JSON
          return jsonDecode(response.data);
        } catch (_) {
          // If decoding fails, wrap it in a map
          return {'data': response.data};
        }
      } else if (response.data == null) {
        return {'success': true};
      } else {
        return {'data': response.data};
      }
    } else {
      // For error responses, we throw an exception
      String message = response.data is Map ? response.data['message'] ?? 'Unknown error' : 'Unknown error';
      throw Exception('Request failed with status: ${response.statusCode}. Message: $message');
    }
  }
}
