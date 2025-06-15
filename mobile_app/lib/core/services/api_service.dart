import 'dart:convert';
import 'package:dio/dio.dart';
import '../network/api_client.dart';

/// API service class to handle all API requests with standardized error handling
class ApiService {
  static ApiClient? _apiClientInstance;
  
  // Getter for the API client
  ApiClient get _apiClient {
    _apiClientInstance ??= ApiClient();
    return _apiClientInstance!;
  }

  // Singleton instance
  static final ApiService _instance = ApiService._internal();
  
  // Factory constructor
  factory ApiService([ApiClient? apiClient]) {
    if (apiClient != null) {
      _apiClientInstance = apiClient;
    }
    return _instance;
  }
  
  // Private constructor
  ApiService._internal();
  
  /// Sets the authentication token in the API client
  void setAuthToken(String token) {
    _apiClient.setAuthToken(token);
  }
  
  /// Removes the authentication token from the API client
  void removeAuthToken() {
    _apiClient.removeAuthToken();
  }

  /// Executes a GET request with standardized error handling
  Future<Map<String, dynamic>> get(String endpoint, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _apiClient.get(endpoint, queryParameters: queryParameters);
      return _handleResponse(response);
    } on DioException catch (e) {
      throw _handleDioException(e);
    } catch (e) {
      throw Exception('An unexpected error occurred: ${e.toString()}');
    }
  }

  /// Executes a POST request with standardized error handling
  Future<Map<String, dynamic>> post(
    String endpoint,
    dynamic data, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _apiClient.post(endpoint, data: data);
      return _handleResponse(response);
    } on DioException catch (e) {
      throw _handleDioException(e);
    } catch (e) {
      throw Exception('An unexpected error occurred: ${e.toString()}');
    }
  }

  /// Executes a PUT request with standardized error handling
  Future<Map<String, dynamic>> put(
    String endpoint,
    dynamic data, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _apiClient.put(endpoint, data: data);
      return _handleResponse(response);
    } on DioException catch (e) {
      throw _handleDioException(e);
    } catch (e) {
      throw Exception('An unexpected error occurred: ${e.toString()}');
    }
  }

  /// Executes a PATCH request with standardized error handling
  Future<Map<String, dynamic>> patch(
    String endpoint,
    dynamic data, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      // Using put since patch isn't implemented in ApiClient
      final response = await _apiClient.put(endpoint, data: data);
      return _handleResponse(response);
    } on DioException catch (e) {
      throw _handleDioException(e);
    } catch (e) {
      throw Exception('An unexpected error occurred: ${e.toString()}');
    }
  }

  /// Executes a DELETE request with standardized error handling
  Future<Map<String, dynamic>> delete(
    String endpoint, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _apiClient.delete(endpoint, data: data);
      return _handleResponse(response);
    } on DioException catch (e) {
      throw _handleDioException(e);
    } catch (e) {
      throw Exception('An unexpected error occurred: ${e.toString()}');
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

  /// Handle Dio specific errors and transform them into standardized exceptions
  Exception _handleDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return Exception('Connection timed out. Please check your internet connection.');
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        String message = 'Unknown error occurred';
        
        if (e.response?.data is Map) {
          message = e.response?.data['message'] ?? message;
        }
        
        if (statusCode == 401) {
          return Exception('Unauthorized. Please log in again.');
        } else if (statusCode == 403) {
          return Exception('You do not have permission to access this resource.');
        } else if (statusCode == 404) {
          return Exception('The requested resource was not found.');
        } else if (statusCode == 500) {
          return Exception('Server error. Please try again later.');
        } else {
          return Exception('Error $statusCode: $message');
        }
      case DioExceptionType.cancel:
        return Exception('Request was cancelled');
      case DioExceptionType.connectionError:
        return Exception('No internet connection. Please check your network settings.');
      default:
        return Exception('An unknown error occurred: ${e.message}');
    }
  }
}
