import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/storage/secure_storage.dart';
import 'dart:developer' as developer;

class AuthDebugTools {
  final SecureStorage _secureStorage;
  final SharedPreferences _prefs;

  AuthDebugTools(this._secureStorage, this._prefs);
  
  /// Set a test email for debugging purposes
  /// This sets the email in both secure storage and shared preferences
  Future<void> setTestEmail(String email) async {
    try {
      await _secureStorage.setString('user_email', email);
      await _prefs.setString('user_email', email);
      developer.log('AuthDebugTools: Set test email to $email');
    } catch (e) {
      developer.log('AuthDebugTools: Failed to set test email', error: e);
    }
  }
  
  /// Sets a basic test token for debugging purposes
  Future<void> setTestToken() async {
    const testToken = 'test_debug_token_12345';
    try {
      await _secureStorage.storeAccessToken(testToken);
      developer.log('AuthDebugTools: Set test access token');
    } catch (e) {
      developer.log('AuthDebugTools: Failed to set test token', error: e);
    }
  }
  
  /// Initialize test environment with demo patient account
  Future<void> initTestEnvironment() async {
    const testEmail = 'patient@example.com';
    await setTestEmail(testEmail);
    await setTestToken();
    developer.log('AuthDebugTools: Test environment initialized with email $testEmail');
  }
}
