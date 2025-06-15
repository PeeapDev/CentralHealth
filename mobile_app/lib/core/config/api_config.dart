class ApiConfig {
  // This should match your backend URL (port 8001)
  static String get baseUrl => const String.fromEnvironment('API_BASE_URL', 
      defaultValue: 'http://localhost:8001');
      
  // WebSocket URL (convert http to ws protocol)
  static String get wsBaseUrl {
    final url = baseUrl;
    return url.startsWith('https') 
        ? url.replaceFirst('https', 'wss')
        : url.replaceFirst('http', 'ws');
  }

  // API endpoints matching your Next.js routes
  static String get healthCheck => '/api/health-check';
  static String get login => '/api/auth/login';  
  static String get register => '/api/auth/register';
  static String get logout => '/api/auth/logout';
  
  // Patient endpoints
  static String get patients => '/api/patients';
  static String patientDetails(String id) => '/api/patients/$id';
  
  // Medical records
  static String patientMedicalRecords(String id) => '/api/patients/$id/medical-records';
  
  // Appointments
  static String get appointments => '/api/appointments';
  static String appointmentDetails(String id) => '/api/appointments/$id';
  
  // Hospital specific endpoints
  static String hospitalEndpoint(String hospitalName, String path) => 
      '/api/$hospitalName/$path';
      
  // Staff endpoints
  static String get staff => '/api/staff';
  static String staffDetails(String id) => '/api/staff/$id';
  
  // Admin endpoints
  static String adminDashboard(String hospitalName) => 
      '/api/$hospitalName/admin/dashboard';
  
  // Generate auth headers with token
  static Map<String, String> authHeaders(String token) => {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  };

  // API version information
  static const String apiVersion = 'v1';
  static String get baseApiUrl => '$baseUrl/api/$apiVersion';
  static String get wsUrl => 'ws://localhost:8000/ws';
  
  // Token refresh endpoint
  static const String tokenRefreshEndpoint = '/api/token/refresh/';
  
  // Legacy API endpoints (for reference)
  static const String legacyPatients = '/patients';
  static const String legacyMedicalRecords = '/medical-records';
  static const String legacyAppointments = '/appointments';
  
  // Chat endpoints
  static const String chatRooms = '/chat-rooms';
  static const String messages = '/messages';
  
  // FHIR endpoints
  static const String fhirPatients = '/fhir/patients';
  static const String fhirObservations = '/fhir/observations';
  
  // Websocket endpoints
  static String chatWebSocket(int roomId) => '$wsUrl/chat/$roomId/';
}
