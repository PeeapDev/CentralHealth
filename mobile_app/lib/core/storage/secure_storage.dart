import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:developer' as developer;

class SecureStorage {
  static final SecureStorage _instance = SecureStorage._internal();
  final FlutterSecureStorage _storage;

  factory SecureStorage() {
    return _instance;
  }

  SecureStorage._internal() : _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );

  // Storage keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userDataKey = 'user_data';
  static const String _tokenExpiryKey = 'token_expiry';

  // Store access token
  Future<void> storeAccessToken(String token) async {
    try {
      await _storage.write(key: _accessTokenKey, value: token);
      developer.log('SecureStorage: Access token stored');
    } catch (e) {
      developer.log('SecureStorage: Error storing access token - $e');
      rethrow;
    }
  }

  // Get access token
  Future<String?> getAccessToken() async {
    try {
      return await _storage.read(key: _accessTokenKey);
    } catch (e) {
      developer.log('SecureStorage: Error retrieving access token - $e');
      return null;
    }
  }

  // Store refresh token
  Future<void> storeRefreshToken(String token) async {
    try {
      await _storage.write(key: _refreshTokenKey, value: token);
      developer.log('SecureStorage: Refresh token stored');
    } catch (e) {
      developer.log('SecureStorage: Error storing refresh token - $e');
      rethrow;
    }
  }

  // Get refresh token
  Future<String?> getRefreshToken() async {
    try {
      return await _storage.read(key: _refreshTokenKey);
    } catch (e) {
      developer.log('SecureStorage: Error retrieving refresh token - $e');
      return null;
    }
  }

  // Store token expiry timestamp
  Future<void> storeTokenExpiry(DateTime expiry) async {
    try {
      await _storage.write(
          key: _tokenExpiryKey, value: expiry.millisecondsSinceEpoch.toString());
      developer.log('SecureStorage: Token expiry stored - $expiry');
    } catch (e) {
      developer.log('SecureStorage: Error storing token expiry - $e');
      rethrow;
    }
  }

  // Get token expiry timestamp
  Future<DateTime?> getTokenExpiry() async {
    try {
      final expiryStr = await _storage.read(key: _tokenExpiryKey);
      if (expiryStr == null) return null;
      
      final expiryMs = int.tryParse(expiryStr);
      if (expiryMs == null) return null;
      
      return DateTime.fromMillisecondsSinceEpoch(expiryMs);
    } catch (e) {
      developer.log('SecureStorage: Error retrieving token expiry - $e');
      return null;
    }
  }

  // Generic method to retrieve any string by key
  Future<String?> getString(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      developer.log('SecureStorage: Error retrieving value for key $key - $e');
      return null;
    }
  }
  
  // Generic method to store any string by key
  Future<void> setString(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e) {
      developer.log('SecureStorage: Error storing value for key $key - $e');
      rethrow;
    }
  }
  
  // Store user data as JSON string
  Future<void> storeUserData(String userDataJson) async {
    try {
      await _storage.write(key: _userDataKey, value: userDataJson);
      developer.log('SecureStorage: User data stored');
    } catch (e) {
      developer.log('SecureStorage: Error storing user data - $e');
      rethrow;
    }
  }

  // Get user data JSON string
  Future<String?> getUserData() async {
    try {
      return await _storage.read(key: _userDataKey);
    } catch (e) {
      developer.log('SecureStorage: Error retrieving user data - $e');
      return null;
    }
  }

  // Check if user is authenticated (has valid tokens)
  Future<bool> isAuthenticated() async {
    try {
      final accessToken = await getAccessToken();
      final tokenExpiry = await getTokenExpiry();
      
      if (accessToken == null) return false;
      if (tokenExpiry == null) return true; // Can't verify expiry, assume valid
      
      // Check if token is expired (with 1-minute buffer)
      final now = DateTime.now();
      return now.isBefore(tokenExpiry.subtract(const Duration(minutes: 1)));
    } catch (e) {
      developer.log('SecureStorage: Error checking authentication status - $e');
      return false;
    }
  }

  // Clear all authentication data
  Future<void> clearAuthData() async {
    try {
      await Future.wait([
        _storage.delete(key: _accessTokenKey),
        _storage.delete(key: _refreshTokenKey),
        _storage.delete(key: _userDataKey),
        _storage.delete(key: _tokenExpiryKey),
      ]);
      developer.log('SecureStorage: All auth data cleared');
    } catch (e) {
      developer.log('SecureStorage: Error clearing auth data - $e');
      rethrow;
    }
  }
}
