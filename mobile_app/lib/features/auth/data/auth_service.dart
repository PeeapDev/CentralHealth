import 'dart:convert';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../../../core/storage/secure_storage.dart';
import 'models/auth_models.dart';
import 'dart:developer' as developer;

class AuthService {
  final ApiClient _apiClient;
  final SharedPreferences _prefs;
  final SecureStorage _secureStorage = SecureStorage();
  static const String _roleKey = 'selected_role';
  
  // Token refresh settings
  Timer? _tokenRefreshTimer;
  static const int _tokenRefreshMinutes = 15; // Refresh token 15 minutes before expiry

  AuthService(this._apiClient, this._prefs);

  // This is now a patient-only app, always return 'patient' role
  Future<void> setSelectedRole(String role) async {
    // Always store 'patient' regardless of input
    await _prefs.setString(_roleKey, 'patient');
  }

  String getSelectedRole() {
    // Always return 'patient' for this patient-only app
    return 'patient';
  }

  Future<AuthUser> login(LoginRequest request) async {
    try {
      developer.log('AuthService: Attempting login with email: ${request.email}');
      developer.log('AuthService: Using endpoint: ${ApiConstants.mobileLogin}');
      developer.log('AuthService: Sending data: ${request.toJson()}');
      
      // API endpoint for authentication using mobile-specific endpoint
      final response = await _apiClient.post(
        ApiConstants.mobileLogin, // Use mobile-specific endpoint
        data: request.toJson(), // Must use named parameter for ApiClient
      );
      
      developer.log('AuthService: Received response: ${response.statusCode}');
      developer.log('AuthService: Response data: ${response.data}');

      // Ensure response.data is a Map<String, dynamic>
      Map<String, dynamic> userData;
      if (response.data is String) {
        // Parse the JSON string into a map
        userData = json.decode(response.data);
      } else if (response.data is Map<String, dynamic>) {
        // Already a map, use directly
        userData = response.data;
      } else {
        throw FormatException('Unexpected response format: ${response.data.runtimeType}');
      }

      final user = AuthUser.fromJson(userData);
      
      // Set token in API client for future requests
      _apiClient.setAuthToken(user.accessToken);
      ApiService().setAuthToken(user.accessToken);
      
      // Parse expiry from token if available and store in secure storage
      final tokenExpiry = _getTokenExpiry(user.accessToken);
      if (tokenExpiry != null) {
        await _secureStorage.storeTokenExpiry(tokenExpiry);
        _scheduleTokenRefresh(tokenExpiry);
      }
      
      // Save user data in secure storage
      await _saveAuthData(user);
      
      developer.log('AuthService: Login successful for user: ${user.email}');
      return user;
    } catch (e) {
      developer.log('AuthService: Login failed: ${e.toString()}');
      throw _handleError(e);
    }
  }
  
  /// Parse JWT token and extract expiration timestamp
  DateTime? _getTokenExpiry(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) {
        developer.log('AuthService: Invalid JWT token format');
        return null;
      }
      
      // Decode the payload (second part)
      String payload = parts[1];
      // Add padding if needed
      while (payload.length % 4 != 0) {
        payload += '=';
      }
      
      // Base64 decode and parse JSON
      final normalized = payload.replaceAll('-', '+').replaceAll('_', '/');
      final decoded = utf8.decode(base64Url.decode(normalized));
      final payloadMap = json.decode(decoded) as Map<String, dynamic>;
      
      // Get expiry timestamp (exp claim) if present
      if (payloadMap.containsKey('exp')) {
        final exp = payloadMap['exp'];
        if (exp is int) {
          return DateTime.fromMillisecondsSinceEpoch(exp * 1000);
        }
      }
      
      developer.log('AuthService: No expiration found in token');
      return null;
    } catch (e) {
      developer.log('AuthService: Error parsing token: $e');
      return null;
    }
  }

  Future<AuthUser> register(RegisterRequest request) async {
    try {
      developer.log('AuthService: Registering new user with email: ${request.email}');
      
      final response = await _apiClient.post(
        ApiConstants.mobileRegister, // Use mobile-specific endpoint
        data: request.toJson(), // Must use named parameter for ApiClient
      );

      // Ensure response.data is a Map<String, dynamic>
      Map<String, dynamic> userData;
      if (response.data is String) {
        // Parse the JSON string into a map
        userData = json.decode(response.data);
      } else if (response.data is Map<String, dynamic>) {
        // Already a map, use directly
        userData = response.data;
      } else {
        throw FormatException('Unexpected response format: ${response.data.runtimeType}');
      }

      final user = AuthUser.fromJson(userData);
      
      // Set token in API client for future requests
      _apiClient.setAuthToken(user.accessToken);
      ApiService().setAuthToken(user.accessToken);
      
      // Save user data
      await _saveAuthData(user);
      
      developer.log('AuthService: Registration successful for user: ${user.email}');
      return user;
    } catch (e) {
      developer.log('AuthService: Registration failed: ${e.toString()}');
      throw _handleError(e);
    }
  }

  Future<void> logout() async {
    try {
      // Use the centralized logout endpoint
      await _apiClient.post(ApiConstants.logout, data: {});
      
      // Remove token from all API clients
      _apiClient.removeAuthToken();
      ApiService().removeAuthToken();
      
      // Cancel token refresh timer if active
      _tokenRefreshTimer?.cancel();
      _tokenRefreshTimer = null;
      
      // Clear secure storage
      await _secureStorage.clearAuthData();
      
      // Clear role from preferences
      await _prefs.remove(_roleKey);
      
      developer.log('AuthService: Logout completed, user data cleared');
    } catch (e) {
      developer.log('AuthService: Error during logout: ${e.toString()}');
      // Still clear local data even if API call fails
      _apiClient.removeAuthToken();
      ApiService().removeAuthToken();
      
      await Future.wait([
        _prefs.remove(_roleKey),
      ]);
    }
  }

  // Save authentication data to secure storage
  Future<void> _saveAuthData(AuthUser user) async {
    await Future.wait([
      _secureStorage.storeAccessToken(user.accessToken),
      _secureStorage.storeRefreshToken(user.refreshToken),
      _secureStorage.storeUserData(jsonEncode(user.toJson())),
      _secureStorage.setString('user_email', user.email),
      _prefs.setString('user_email', user.email),
    ]);
  }

  // Load user data from secure storage
  Future<bool> isAuthenticated() async {
    final token = await _secureStorage.getAccessToken();
    return token != null && token.isNotEmpty;
  }
  
  /// Get the currently logged in user's email
  Future<String?> getCurrentUserEmail() async {
    try {
      // Try to get email from secure storage
      final userEmail = await _secureStorage.getString('user_email');
      if (userEmail != null && userEmail.isNotEmpty) {
        return userEmail;
      }
      
      // If not available in secure storage, try shared preferences
      final email = _prefs.getString('user_email');
      return email;
    } catch (e) {
      developer.log('AuthService: Error getting current user email: ${e.toString()}');
      return null;
    }
  }

  Future<AuthUser?> getCurrentUser() async {
    final userJson = await _secureStorage.getUserData();
    
    if (userJson == null) return null;
    
    try {
      final user = AuthUser.fromJson(jsonDecode(userJson));
      return user;
    } catch (e) {
      developer.log('AuthService: Error parsing user data: ${e.toString()}');
      return null;
    }
  }

  Exception _handleError(dynamic error) {
    if (error is DioException) {
      if (error.response != null) {
        if (error.response!.statusCode == 401) {
          return Exception('Invalid email or password');
        }
        
        final responseData = error.response!.data;
        if (responseData is Map && responseData.containsKey('message')) {
          return Exception(responseData['message']);
        }
        return Exception('Server error: ${error.response!.statusCode}');
      }
    }
    
    // Default error handling
    final message = error.toString();
    developer.log('AuthService: General error: $message');
    return Exception(message);
  }
  
  // Verify token with the Next.js backend
  Future<bool> verifyToken(String token) async {
    try {
      final response = await _apiClient.post(
        '/api/auth/verify-token',
        data: {'token': token},
      );
      return response.statusCode == 200;
    } catch (e) {
      developer.log('AuthService: Token verification failed: ${e.toString()}');
      return false;
    }
  }
  
  // Check if the user has certain role
  Future<bool> hasRole(String requiredRole) async {
    final user = await getCurrentUser();
    if (user == null) {
      return false;
    }
    
    return user.role == requiredRole;
  }
  
  // Check connection to the Next.js backend
  Future<bool> checkBackendConnection() async {
    try {
      final response = await _apiClient.get(ApiConstants.healthCheck);
      return response.statusCode == 200;
    } catch (e) {
      developer.log('AuthService: Backend connection check failed: ${e.toString()}');
      return false;
    }
  }
  
  // Schedule token refresh before it expires
  void _scheduleTokenRefresh(DateTime expiryTime) {
    // Cancel existing timer if any
    _tokenRefreshTimer?.cancel();
    
    // Calculate time to refresh (expiry time minus buffer minutes)
    final now = DateTime.now();
    final refreshTime = expiryTime.subtract(Duration(minutes: _tokenRefreshMinutes));
    
    // If refresh time is already passed, refresh immediately
    Duration timeToRefresh;
    if (refreshTime.isBefore(now)) {
      timeToRefresh = Duration.zero;
    } else {
      timeToRefresh = refreshTime.difference(now);
    }
    
    developer.log('AuthService: Token refresh scheduled in ${timeToRefresh.inMinutes} minutes');
    
    // Set timer to refresh token
    _tokenRefreshTimer = Timer(timeToRefresh, _refreshToken);
  }
  
  // Refresh the authentication token
  Future<void> _refreshToken() async {
    try {
      // Get refresh token from secure storage
      final refreshToken = await _secureStorage.getRefreshToken();
      if (refreshToken == null) {
        developer.log('AuthService: No refresh token available');
        return;
      }
      
      developer.log('AuthService: Refreshing token');
      // Use standard token refresh endpoint instead of mobile-specific
      final response = await _apiClient.post(
        '/api/auth/refresh-token',
        data: {'refreshToken': refreshToken}, // Must use named parameter for ApiClient
      );
      
      // Properly parse the response data based on its type
      Map<String, dynamic> responseData;
      if (response.data is String) {
        // Parse the JSON string into a map
        responseData = json.decode(response.data);
      } else if (response.data is Map<String, dynamic>) {
        // Already a map, use directly
        responseData = response.data;
      } else {
        throw FormatException('Unexpected token refresh response format: ${response.data.runtimeType}');
      }
      
      // Check if the parsed data contains the expected fields
      if (responseData.containsKey('accessToken')) {
        final newAccessToken = responseData['accessToken'];
        final newRefreshToken = responseData['refreshToken'];
        
        // Update tokens in storage
        await _secureStorage.storeAccessToken(newAccessToken);
        if (newRefreshToken != null) {
          await _secureStorage.storeRefreshToken(newRefreshToken);
        }
        
        // Update API client
        _apiClient.setAuthToken(newAccessToken);
        ApiService().setAuthToken(newAccessToken);
        
        // Schedule next refresh if token has expiry
        final newExpiry = _getTokenExpiry(newAccessToken);
        if (newExpiry != null) {
          await _secureStorage.storeTokenExpiry(newExpiry);
          _scheduleTokenRefresh(newExpiry);
        }
        
        developer.log('AuthService: Token refresh successful');
      } else {
        developer.log('AuthService: Token refresh failed - invalid response');
      }
    } catch (e) {
      developer.log('AuthService: Error refreshing token: ${e.toString()}');
      // If refresh fails, user will need to login again
    }
  }
}
