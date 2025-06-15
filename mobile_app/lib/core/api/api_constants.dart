import 'dart:io' show Platform;

class ApiConstants {
  // Base URL for the backend API
  // Uses localhost:3000 for local development
  static String get baseUrl {
    // For development on simulator/emulator
    if (Platform.isAndroid) {
      // Android emulator needs 10.0.2.2 to access host machine
      return 'http://10.0.2.2:8001'; // Updated to port 8001 where server is running
    } else {
      // iOS simulator works more reliably with 127.0.0.1 than localhost
      return 'http://127.0.0.1:8001'; // Updated to port 8001 where server is running
    }
    
    // For production deployment, you'd use:
    // return 'https://api.centralhealthapp.com';
  }
  
  // Auth endpoints
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String logout = '/api/auth/logout';
  
  // Mobile-specific auth endpoints
  static const String mobileLogin = '/api/auth/mobile/login';
  static const String mobileRegister = '/api/auth/mobile/register';
  static const String mobileLogout = '/api/auth/mobile/logout';
  static const String refreshToken = '/api/auth/mobile/refresh-token';
  
  // Health check endpoint
  static const String healthCheck = '/api/health-check';
  
  // Patient endpoints
  static const String patients = '/api/patients';
  static const String userProfile = '/api/patients/profile';
  static String updateUserProfile = '/api/patients/profile/update';
  static String patientDetails(String id) => '/api/patients/$id';
  static String patientMedicalRecords(String id) => '/api/patients/$id/medical-records';
  
  // Hospital specific endpoints
  static String hospitalEndpoint(String hospitalName, String path) => 
      '/api/$hospitalName/$path';
  
  // Admin endpoints
  static String adminPatients(String hospitalName) => '/api/$hospitalName/admin/patients';
  static String adminPatientDetails(String hospitalName, String id) => 
      '/api/$hospitalName/admin/patients/$id';
  
  // Appointment endpoints
  static const String appointments = '/api/appointments';
  static String appointmentDetails(String id) => '/api/appointments/$id';
  
  // Profile image endpoints
  // Hospital-specific profile images
  static String userProfileImage(String hospitalName) => '/api/hospitals/$hospitalName/users/profile-image';
  static String removeUserProfileImage(String hospitalName) => '/api/hospitals/$hospitalName/users/profile-image/remove';
  
  // API Headers
  static Map<String, String> get defaultHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  static Map<String, String> authHeaders(String token) => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer $token',
  };
}
