import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'dart:developer' as developer;
import 'api_constants.dart';
import '../network/api_client.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  late ApiClient _apiClient;
  String? _authToken;
  
  ApiService._internal() {
    _apiClient = ApiClient();
    developer.log('ApiService: Initialized');
  }
  
  // Initialize with a base URL and optional auth token
  Future<void> init({String? baseUrl, String? authToken}) async {
    if (baseUrl != null && baseUrl.isNotEmpty) {
      _apiClient.updateBaseUrl(baseUrl);
    }
    
    if (authToken != null) {
      setAuthToken(authToken);
    }
    
    developer.log('ApiService: Initialized with baseUrl: ${_apiClient.baseUrl}');
  }
  
  void setAuthToken(String token) {
    _authToken = token;
    _apiClient.setAuthToken(token);
    developer.log('ApiService: Auth token set');
  }
  
  void clearAuthToken() {
    _authToken = null;
    _apiClient.removeAuthToken();
    developer.log('ApiService: Auth token cleared');
  }
  
  // AUTHENTICATION METHODS
  
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      developer.log('ApiService: Attempting login for $email');
      final response = await _apiClient.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      );
      
      return response.data;
    } catch (e) {
      developer.log('ApiService: Login failed - $e');
      rethrow;
    }
  }
  
  Future<void> logout() async {
    try {
      await _apiClient.post(ApiConstants.logout);
      clearAuthToken();
      developer.log('ApiService: User logged out');
    } catch (e) {
      developer.log('ApiService: Logout failed - $e');
      rethrow;
    }
  }
  
  // PATIENT METHODS
  
  Future<List<dynamic>> getPatients({String? hospitalName}) async {
    try {
      final endpoint = hospitalName != null 
          ? ApiConstants.hospitalEndpoint(hospitalName, 'admin/patients')
          : ApiConstants.patients;
          
      final response = await _apiClient.get(endpoint);
      return response.data['patients'] ?? [];
    } catch (e) {
      developer.log('ApiService: Failed to get patients - $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> getPatientDetails(String patientId, {String? hospitalName}) async {
    try {
      final endpoint = hospitalName != null 
          ? ApiConstants.adminPatientDetails(hospitalName, patientId)
          : ApiConstants.patientDetails(patientId);
          
      final response = await _apiClient.get(endpoint);
      return response.data['patient'] ?? {};
    } catch (e) {
      developer.log('ApiService: Failed to get patient details - $e');
      rethrow;
    }
  }
  
  // APPOINTMENT METHODS
  
  Future<List<dynamic>> getAppointments() async {
    try {
      final response = await _apiClient.get(ApiConstants.appointments);
      return response.data['appointments'] ?? [];
    } catch (e) {
      developer.log('ApiService: Failed to get appointments - $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> getAppointmentDetails(String appointmentId) async {
    try {
      final response = await _apiClient.get(
        ApiConstants.appointmentDetails(appointmentId)
      );
      return response.data['appointment'] ?? {};
    } catch (e) {
      developer.log('ApiService: Failed to get appointment details - $e');
      rethrow;
    }
  }
  
  // HEALTH CHECK
  
  Future<bool> checkConnection() async {
    try {
      final response = await _apiClient.get(ApiConstants.healthCheck);
      return response.statusCode == 200;
    } catch (e) {
      developer.log('ApiService: Health check failed - $e');
      return false;
    }
  }
}
