import 'package:dio/dio.dart';
import 'package:fhir/r4.dart';
import '../../../core/network/api_client.dart';
import '../../../core/config/api_config.dart';
import '../../../shared/models/fhir_resource.dart';

class FHIRService {
  final ApiClient _apiClient;
  
  FHIRService(this._apiClient);
  
  Future<PatientModel> createPatient(Patient patient) async {
    try {
      final response = await _apiClient.post(
        ApiConfig.fhirPatients,
        data: patient.toJson(),
      );
      
      final patientResource = Patient.fromJson(response.data['fhir_resource']);
      return PatientModel(patientResource);
    } catch (e) {
      throw _handleError(e);
    }
  }
  
  Future<ObservationModel> createObservation(Observation observation, String patientId) async {
    try {
      final response = await _apiClient.post(
        ApiConfig.fhirObservations,
        data: {
          ...observation.toJson(),
          'patient_id': patientId,
        },
      );
      
      final observationResource = Observation.fromJson(response.data['fhir_resource']);
      return ObservationModel(observationResource);
    } catch (e) {
      throw _handleError(e);
    }
  }
  
  Future<List<ObservationModel>> getPatientObservations(String patientId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConfig.fhirPatients}/$patientId/observations',
      );
      
      return (response.data as List).map((data) {
        final observation = Observation.fromJson(data['fhir_resource']);
        return ObservationModel(observation);
      }).toList();
    } catch (e) {
      throw _handleError(e);
    }
  }
  
  Exception _handleError(dynamic error) {
    if (error is DioException) {
      final data = error.response?.data;
      final message = data?['error'] ?? 'An error occurred';
      return Exception(message);
    }
    return Exception('An unexpected error occurred');
  }
}
