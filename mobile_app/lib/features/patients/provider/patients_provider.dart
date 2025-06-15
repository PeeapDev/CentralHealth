import 'dart:developer';
import 'package:flutter/foundation.dart';
import '../data/models/patient_model.dart';
import '../data/patients_repository.dart';

class PatientsProvider extends ChangeNotifier {
  final PatientsRepository _patientsRepository = PatientsRepository();
  
  // State variables
  List<Patient> _patients = [];
  Patient? _selectedPatient;
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _paginationMeta;
  
  // Getters
  List<Patient> get patients => _patients;
  Patient? get selectedPatient => _selectedPatient;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get paginationMeta => _paginationMeta;
  
  // Initialize patients list
  Future<void> fetchPatients({
    String? search,
    String? hospitalId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      _setLoading(true);
      _error = null;
      
      final result = await _patientsRepository.getPatients(
        searchTerm: search,
        hospitalId: hospitalId,
        page: page,
        limit: limit,
      );
      
      _patients = result['patients'];
      _paginationMeta = result['meta'];
      
      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError('Failed to load patients: ${e.toString()}');
    }
  }
  
  // Load more patients (pagination)
  Future<void> loadMorePatients({
    String? search,
    String? hospitalId,
  }) async {
    if (_paginationMeta == null || 
        _paginationMeta!['page'] >= _paginationMeta!['totalPages']) {
      return;
    }
    
    try {
      final nextPage = _paginationMeta!['page'] + 1;
      
      final result = await _patientsRepository.getPatients(
        searchTerm: search,
        hospitalId: hospitalId,
        page: nextPage,
        limit: _paginationMeta!['limit'] ?? 20,
      );
      
      // Append new patients to the existing list
      _patients.addAll(result['patients']);
      _paginationMeta = result['meta'];
      
      notifyListeners();
    } catch (e) {
      log('Error loading more patients: ${e.toString()}');
      // Don't set error state here to preserve existing data
    }
  }
  
  // Get patient details
  Future<void> fetchPatientById(String patientId) async {
    try {
      _setLoading(true);
      _error = null;
      
      final patient = await _patientsRepository.getPatientById(patientId);
      _selectedPatient = patient;
      
      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError('Failed to load patient details: ${e.toString()}');
    }
  }
  
  // Create new patient
  Future<Patient?> createPatient(Map<String, dynamic> patientData) async {
    try {
      _setLoading(true);
      _error = null;
      
      final patient = await _patientsRepository.createPatient(patientData);
      
      // Refresh list if we already have patients loaded
      if (_patients.isNotEmpty) {
        await fetchPatients(page: 1);
      }
      
      _setLoading(false);
      notifyListeners();
      return patient;
    } catch (e) {
      _setError('Failed to create patient: ${e.toString()}');
      return null;
    }
  }
  
  // Update existing patient
  Future<Patient?> updatePatient(String patientId, Map<String, dynamic> updateData) async {
    try {
      _setLoading(true);
      _error = null;
      
      final patient = await _patientsRepository.updatePatient(patientId, updateData);
      
      // Update selected patient if it's the one we're updating
      if (_selectedPatient != null && _selectedPatient!.id == patientId) {
        _selectedPatient = patient;
      }
      
      // Update patient in the list if present
      final index = _patients.indexWhere((p) => p.id == patientId);
      if (index >= 0) {
        _patients[index] = patient;
      }
      
      _setLoading(false);
      notifyListeners();
      return patient;
    } catch (e) {
      _setError('Failed to update patient: ${e.toString()}');
      return null;
    }
  }
  
  // Delete patient
  Future<bool> deletePatient(String patientId) async {
    try {
      _setLoading(true);
      _error = null;
      
      // Repository method returns void, so just call it and assume success
      await _patientsRepository.deletePatient(patientId);
      
      // If no exception was thrown, proceed with UI updates
      // Remove patient from list
      _patients.removeWhere((p) => p.id == patientId);
      
      // Clear selected patient if it's the one we're deleting
      if (_selectedPatient != null && _selectedPatient!.id == patientId) {
        _selectedPatient = null;
      }
      
      _setLoading(false);
      notifyListeners();
      return true; // Return true since the operation completed without errors
    } catch (e) {
      _setError('Failed to delete patient: ${e.toString()}');
      return false;
    }
  }
  
  // Fetch medical records for a patient
  Future<List<dynamic>> fetchPatientMedicalRecords(String patientId) async {
    try {
      // Temporary placeholder until medical record model is implemented
      // return await _patientsRepository.getPatientMedicalRecords(patientId);
      _setError('Medical records feature not yet implemented');
      return [];
    } catch (e) {
      _setError('Failed to load medical records: ${e.toString()}');
      return [];
    }
  }
  
  // Fetch appointments for a patient
  Future<List<dynamic>> fetchPatientAppointments(String patientId) async {
    try {
      // Temporary placeholder until appointment integration is implemented
      // return await _patientsRepository.getPatientAppointments(patientId);
      _setError('Appointments feature not yet implemented');
      return [];
    } catch (e) {
      _setError('Failed to load appointments: ${e.toString()}');
      return [];
    }
  }
  
  // Search patients by name, email, or medical number
  Future<void> searchPatients(String query, {String? hospitalId}) async {
    if (query.isEmpty) {
      await fetchPatients(hospitalId: hospitalId);
      return;
    }
    
    await fetchPatients(
      search: query,
      hospitalId: hospitalId,
      page: 1,
    );
  }
  
  // Helper methods
  void _setLoading(bool isLoading) {
    _isLoading = isLoading;
    if (isLoading) {
      _error = null;
    }
    notifyListeners();
  }
  
  void _setError(String errorMessage) {
    _error = errorMessage;
    _isLoading = false;
    log('PatientsProvider Error: $errorMessage');
    notifyListeners();
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  // Reset state
  void resetState() {
    _patients = [];
    _selectedPatient = null;
    _isLoading = false;
    _error = null;
    _paginationMeta = null;
    notifyListeners();
  }
}
