import 'package:flutter/material.dart';
import '../data/appointments_repository.dart';
import '../data/models/appointment_model.dart';

class AppointmentsProvider extends ChangeNotifier {
  final AppointmentsRepository _repository = AppointmentsRepository();
  
  List<Appointment> _appointments = [];
  Appointment? _selectedAppointment;
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 0;
  int _totalItems = 0;
  bool _hasMorePages = false;
  
  // Getters
  List<Appointment> get appointments => _appointments;
  Appointment? get selectedAppointment => _selectedAppointment;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  int get totalItems => _totalItems;
  bool get hasMorePages => _hasMorePages;

  // Fetch appointments with optional filters
  Future<void> fetchAppointments({
    String? patientId,
    String? doctorId, 
    String? status,
    bool reset = false,
    int limit = 20,
  }) async {
    try {
      // Reset state if needed
      if (reset) {
        _currentPage = 1;
        _appointments = [];
      }
      
      _isLoading = true;
      _error = null;
      notifyListeners();
      
      final result = await _repository.getAppointments(
        patientId: patientId,
        doctorId: doctorId,
        status: status,
        page: _currentPage,
        limit: limit,
      );
      
      final appointments = result['appointments'] as List<Appointment>;
      final meta = result['meta'] as Map<String, dynamic>;
      
      if (reset || _currentPage == 1) {
        _appointments = appointments;
      } else {
        _appointments.addAll(appointments);
      }
      
      _totalPages = meta['totalPages'] as int;
      _totalItems = meta['total'] as int;
      _hasMorePages = _currentPage < _totalPages;
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }
  
  // Load more appointments (pagination)
  Future<void> loadMoreAppointments({
    String? patientId,
    String? doctorId,
    String? status,
    int limit = 20,
  }) async {
    if (_isLoading || !_hasMorePages) return;
    
    _currentPage++;
    await fetchAppointments(
      patientId: patientId,
      doctorId: doctorId,
      status: status,
      reset: false,
      limit: limit,
    );
  }
  
  // Fetch appointment details
  Future<void> fetchAppointmentById(String id) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();
      
      final appointment = await _repository.getAppointmentById(id);
      _selectedAppointment = appointment;
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }
  
  // Create new appointment
  Future<Appointment?> createAppointment({
    required String patientId,
    required String doctorId,
    String status = 'scheduled',
    String? notes,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();
      
      final appointment = await _repository.createAppointment(
        patientId: patientId,
        doctorId: doctorId,
        status: status,
        notes: notes,
      );
      
      // Add to the beginning of the list
      _appointments.insert(0, appointment);
      _totalItems++;
      
      _isLoading = false;
      notifyListeners();
      
      return appointment;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }
  
  // Update appointment status or notes
  Future<bool> updateAppointment({
    required String id,
    String? status,
    String? notes,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();
      
      final updatedAppointment = await _repository.updateAppointment(
        id: id,
        status: status,
        notes: notes,
      );
      
      // Update the appointment in the list
      final index = _appointments.indexWhere((appointment) => appointment.id == id);
      if (index != -1) {
        _appointments[index] = updatedAppointment;
      }
      
      // Update selected appointment if it's the same one
      if (_selectedAppointment?.id == id) {
        _selectedAppointment = updatedAppointment;
      }
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  
  // Cancel an appointment
  Future<bool> cancelAppointment(String id, {String? reason}) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();
      
      final updatedAppointment = await _repository.cancelAppointment(id, reason: reason);
      
      // Update the appointment in the list
      final index = _appointments.indexWhere((appointment) => appointment.id == id);
      if (index != -1) {
        _appointments[index] = updatedAppointment;
      }
      
      // Update selected appointment if it's the same one
      if (_selectedAppointment?.id == id) {
        _selectedAppointment = updatedAppointment;
      }
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  
  // Delete an appointment (admin only)
  Future<bool> deleteAppointment(String id) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();
      
      await _repository.deleteAppointment(id);
      
      // Remove the appointment from the list
      _appointments.removeWhere((appointment) => appointment.id == id);
      _totalItems--;
      
      // Clear selected appointment if it's the same one
      if (_selectedAppointment?.id == id) {
        _selectedAppointment = null;
      }
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  
  // Filter appointments by status
  List<Appointment> getAppointmentsByStatus(String status) {
    return _appointments.where((appointment) => 
      appointment.status.toLowerCase() == status.toLowerCase()
    ).toList();
  }
  
  // Clear all state
  void clearState() {
    _appointments = [];
    _selectedAppointment = null;
    _isLoading = false;
    _error = null;
    _currentPage = 1;
    _totalPages = 0;
    _totalItems = 0;
    _hasMorePages = false;
    notifyListeners();
  }
}
