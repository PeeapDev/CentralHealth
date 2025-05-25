class ApiConfig {
  static const String baseUrl = 'http://localhost:8000';
  static const String apiVersion = 'v1';
  static const String baseApiUrl = '$baseUrl/api/$apiVersion';
  static const String wsUrl = 'ws://localhost:8000/ws';
  
  // Auth endpoints
  static const String login = '/api/token/';
  static const String refreshToken = '/api/token/refresh/';
  
  // Patient endpoints
  static const String patients = '/patients';
  static const String medicalRecords = '/medical-records';
  static const String appointments = '/appointments';
  
  // Chat endpoints
  static const String chatRooms = '/chat-rooms';
  static const String messages = '/messages';
  
  // FHIR endpoints
  static const String fhirPatients = '/fhir/patients';
  static const String fhirObservations = '/fhir/observations';
  
  // Websocket endpoints
  static String chatWebSocket(int roomId) => '$wsUrl/chat/$roomId/';
}
