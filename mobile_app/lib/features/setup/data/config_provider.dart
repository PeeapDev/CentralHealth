import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/config/api_config.dart';
import 'package:dio/dio.dart';
import 'dart:io' as io;
import 'dart:developer' as developer;

class ConfigProvider extends ChangeNotifier {
  String _baseUrl = '';
  String _apiVersion = 'v1';
  bool _isConfigured = false;
  bool _isInitialized = false;

  String get baseUrl => _baseUrl;
  String get serverUrl => _baseUrl; // Added serverUrl getter that returns baseUrl
  String get apiVersion => _apiVersion;
  String get baseApiUrl => '$_baseUrl/api/$_apiVersion';
  bool get isConfigured => _isConfigured;
  bool get isInitialized => _isInitialized;

  ConfigProvider() {
    // Do not automatically load in constructor, use init() instead
  }

  Future<void> init() async {
    if (!_isInitialized) {
      // Always use the production backend URL in a production app
      // Don't prompt users to configure backend details
      // For iOS simulator, use localhost (for Android emulator, we'd use 10.0.2.2)
      const bool isSimulator = true; // Set to false for physical devices
      final String productionUrl = isSimulator 
        ? io.Platform.isAndroid
            ? 'http://10.0.2.2:3000' // Android emulator to access host machine
            : 'http://localhost:3000' // iOS simulator can use localhost
        : 'http://192.168.1.100:3000'; // Replace with your actual backend IP
      
      // Set the backend URL and mark as configured
      _baseUrl = productionUrl;
      _apiVersion = 'v1';
      _isConfigured = true;
      
      // Update ApiClient base URL
      final apiClient = ApiClient();
      apiClient.updateBaseUrl(productionUrl);
      
      // Save these settings
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('server_url', productionUrl);
      await prefs.setString('api_version', _apiVersion);
      await prefs.setBool('is_configured', true);
      
      developer.log('ConfigProvider: Production URL configured: $_baseUrl');
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> _loadSavedConfig() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final serverUrl = prefs.getString('server_url');
      final apiVersion = prefs.getString('api_version');
      final isConfigured = prefs.getBool('is_configured');
      
      developer.log('ConfigProvider: Loading saved config. isConfigured=$isConfigured, serverUrl=$serverUrl, apiVersion=$apiVersion');

      if (serverUrl != null && serverUrl.isNotEmpty) {
        _baseUrl = serverUrl;
      }

      if (apiVersion != null && apiVersion.isNotEmpty) {
        _apiVersion = apiVersion;
      }

      _isConfigured = isConfigured ?? false;
      developer.log('ConfigProvider: Configuration loaded. isConfigured=$_isConfigured');
      notifyListeners();
    } catch (e) {
      developer.log('ConfigProvider: Error loading configuration: $e');
      // If there's an error, use default values
      _baseUrl = '';
      _apiVersion = 'v1';
      _isConfigured = false;
    }
  }

  Future<void> saveConfiguration(String serverUrl, String apiVersion) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('server_url', serverUrl);
      await prefs.setString('api_version', apiVersion);
      await prefs.setBool('is_configured', true);
      
      _baseUrl = serverUrl;
      _apiVersion = apiVersion;
      _isConfigured = true;
      
      // Update ApiClient base URL
      final apiClient = ApiClient();
      apiClient.updateBaseUrl(serverUrl);
      
      developer.log('ConfigProvider: Configuration saved. baseUrl=$_baseUrl, apiVersion=$_apiVersion');
      notifyListeners();
    } catch (e) {
      developer.log('ConfigProvider: Error saving configuration: $e');
      rethrow;
    }
  }

  Future<bool> testConnection(String url) async {
    try {
      developer.log('ConfigProvider: Testing connection to $url');
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
      ));
      
      // Try to connect to the Next.js health check endpoint
      final response = await dio.get('$url/api/health-check');
      
      if (response.statusCode == 200) {
        developer.log('ConfigProvider: Connection test successful');
        return true;
      } else {
        developer.log('ConfigProvider: Connection test failed with status code ${response.statusCode}');
        return false;
      }
    } catch (e) {
      developer.log('ConfigProvider: Connection test failed with error: $e');
      return false;
    }
  }

  Future<void> resetConfiguration() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('server_url');
      await prefs.remove('api_version');
      await prefs.remove('is_configured');
      
      _baseUrl = '';
      _apiVersion = 'v1';
      _isConfigured = false;
      
      developer.log('ConfigProvider: Configuration reset');
      notifyListeners();
    } catch (e) {
      developer.log('ConfigProvider: Error resetting configuration: $e');
      rethrow;
    }
  }
}
