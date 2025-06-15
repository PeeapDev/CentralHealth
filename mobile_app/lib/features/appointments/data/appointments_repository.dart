import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import 'models/appointment_model.dart';
import 'package:flutter/foundation.dart';

class AppointmentsRepository {
  final ApiService _apiService = ApiService();
  final String _baseUrl = '/api/mobile/appointments';

  /// Fetches appointments with filters and pagination
  Future<Map<String, dynamic>> getAppointments({
    String? patientId,
    String? doctorId,
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = {
        if (patientId != null) 'patientId': patientId,
        if (doctorId != null) 'doctorId': doctorId,
        if (status != null) 'status': status,
        'page': page.toString(),
        'limit': limit.toString(),
      };

      final response = await _apiService.get(
        _baseUrl,
        queryParameters: queryParams,
      );

      final List<Appointment> appointments = (response['appointments'] as List)
          .map((appointmentJson) => Appointment.fromJson(appointmentJson))
          .toList();

      final meta = response['meta'];

      return {
        'appointments': appointments,
        'meta': meta,
      };
    } on DioException catch (e) {
      if (kDebugMode) {
        print('Error fetching appointments: ${e.message}');
        if (e.response != null) {
          print('Response data: ${e.response!.data}');
          print('Response status: ${e.response!.statusCode}');
        }
      }
      rethrow;
    } catch (e) {
      if (kDebugMode) {
        print('Unexpected error fetching appointments: $e');
      }
      rethrow;
    }
  }

  /// Get a specific appointment by ID
  Future<Appointment> getAppointmentById(String id) async {
    try {
      final response = await _apiService.get('$_baseUrl/$id');
      return Appointment.fromJson(response['appointment']);
    } on DioException catch (e) {
      if (kDebugMode) {
        print('Error fetching appointment: ${e.message}');
        if (e.response != null) {
          print('Response data: ${e.response!.data}');
          print('Response status: ${e.response!.statusCode}');
        }
      }
      rethrow;
    } catch (e) {
      if (kDebugMode) {
        print('Unexpected error fetching appointment: $e');
      }
      rethrow;
    }
  }

  /// Create a new appointment
  Future<Appointment> createAppointment({
    required String patientId,
    required String doctorId,
    String status = 'scheduled',
    String? notes,
  }) async {
    try {
      final data = {
        'patientId': patientId,
        'doctorId': doctorId,
        'status': status,
        'notes': notes,
      };

      final response = await _apiService.post(_baseUrl, data);
      return Appointment.fromJson(response['appointment']);
    } on DioException catch (e) {
      if (kDebugMode) {
        print('Error creating appointment: ${e.message}');
        if (e.response != null) {
          print('Response data: ${e.response!.data}');
          print('Response status: ${e.response!.statusCode}');
        }
      }
      rethrow;
    } catch (e) {
      if (kDebugMode) {
        print('Unexpected error creating appointment: $e');
      }
      rethrow;
    }
  }

  /// Update an appointment's status or notes
  Future<Appointment> updateAppointment({
    required String id,
    String? status,
    String? notes,
  }) async {
    try {
      final data = {
        if (status != null) 'status': status,
        if (notes != null) 'notes': notes,
      };

      final response = await _apiService.put('$_baseUrl/$id', data);
      return Appointment.fromJson(response['appointment']);
    } on DioException catch (e) {
      if (kDebugMode) {
        print('Error updating appointment: ${e.message}');
        if (e.response != null) {
          print('Response data: ${e.response!.data}');
          print('Response status: ${e.response!.statusCode}');
        }
      }
      rethrow;
    } catch (e) {
      if (kDebugMode) {
        print('Unexpected error updating appointment: $e');
      }
      rethrow;
    }
  }

  /// Cancel an appointment
  Future<Appointment> cancelAppointment(String id, {String? reason}) async {
    try {
      final data = {
        'status': 'cancelled',
        if (reason != null) 'notes': reason,
      };

      final response = await _apiService.put('$_baseUrl/$id', data);
      return Appointment.fromJson(response['appointment']);
    } on DioException catch (e) {
      if (kDebugMode) {
        print('Error cancelling appointment: ${e.message}');
        if (e.response != null) {
          print('Response data: ${e.response!.data}');
          print('Response status: ${e.response!.statusCode}');
        }
      }
      rethrow;
    } catch (e) {
      if (kDebugMode) {
        print('Unexpected error cancelling appointment: $e');
      }
      rethrow;
    }
  }

  /// Delete an appointment (admin only)
  Future<void> deleteAppointment(String id) async {
    try {
      await _apiService.delete('$_baseUrl/$id');
    } on DioException catch (e) {
      if (kDebugMode) {
        print('Error deleting appointment: ${e.message}');
        if (e.response != null) {
          print('Response data: ${e.response!.data}');
          print('Response status: ${e.response!.statusCode}');
        }
      }
      rethrow;
    } catch (e) {
      if (kDebugMode) {
        print('Unexpected error deleting appointment: $e');
      }
      rethrow;
    }
  }
}
