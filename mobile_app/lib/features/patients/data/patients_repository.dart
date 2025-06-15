import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import '../../../core/api/api_constants.dart';
import '../../../core/services/api_service.dart';
import 'models/patient_model.dart';

class PatientsRepository {
  final ApiService _apiService = ApiService();
  
  /// Fetch patients with optional filters
  Future<Map<String, dynamic>> getPatients({
    int page = 1,
    int limit = 10,
    String? searchTerm,
    String? sortBy,
    String? sortOrder,
    String? status,
    String? hospitalId,
  }) async {
    try {
      // Build query parameters
      final queryParams = <String, dynamic>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      
      // Add optional parameters if provided
      if (searchTerm != null && searchTerm.isNotEmpty) {
        queryParams['search'] = searchTerm;
      }
      
      if (sortBy != null && sortBy.isNotEmpty) {
        queryParams['sortBy'] = sortBy;
      }
      
      if (sortOrder != null && sortOrder.isNotEmpty) {
        queryParams['sortOrder'] = sortOrder;
      }
      
      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }
      
      if (hospitalId != null && hospitalId.isNotEmpty) {
        queryParams['hospitalId'] = hospitalId;
      }
      
      // Use the centralized patient API endpoint
      const endpoint = '/api/patients';
      
      // Call the API
      final response = await _apiService.get(endpoint, queryParameters: queryParams);
      
      // Parse response data
      final patients = (response['patients'] as List)
          .map((json) => Patient.fromJson(json))
          .toList();
      
      final meta = response['meta'] ?? {
        'total': patients.length,
        'page': page,
        'limit': limit,
        'pages': (patients.length / limit).ceil(),
      };
      
      return {
        'patients': patients,
        'meta': meta,
      };
    } catch (e) {
      developer.log('PatientsRepository: Error fetching patients - $e');
      rethrow;
    }
  }
  
  /// Get a specific patient by ID
  Future<Patient> getPatientById(String id) async {
    try {
      final response = await _apiService.get('/api/patients/$id');
      return Patient.fromJson(response['patient']);
    } catch (e) {
      developer.log('PatientsRepository: Error fetching patient - $e');
      rethrow;
    }
  }
  
  /// Create a new patient
  Future<Patient> createPatient(Map<String, dynamic> patientData) async {
    try {
      final response = await _apiService.post('/api/patients', patientData);
      return Patient.fromJson(response['patient']);
    } catch (e) {
      developer.log('PatientsRepository: Error creating patient - $e');
      rethrow;
    }
  }
  
  /// Update an existing patient
  Future<Patient> updatePatient(String id, Map<String, dynamic> patientData) async {
    try {
      final response = await _apiService.put('/api/patients/$id', patientData);
      return Patient.fromJson(response['patient']);
    } catch (e) {
      developer.log('PatientsRepository: Error updating patient - $e');
      rethrow;
    }
  }
  
  /// Delete a patient (admin only)
  Future<void> deletePatient(String id) async {
    try {
      await _apiService.delete('/api/patients/$id');
    } catch (e) {
      developer.log('PatientsRepository: Error deleting patient - $e');
      rethrow;
    }
  }
}
