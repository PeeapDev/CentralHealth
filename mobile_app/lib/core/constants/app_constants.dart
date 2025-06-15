class AppConstants {
  // Shared Preferences Keys
  static const String authTokenKey = 'auth_token';
  static const String userEmailKey = 'user_email';
  static const String userIdKey = 'user_id';
  static const String userRoleKey = 'user_role';
  static const String onboardingCompleteKey = 'onboarding_complete';
  static const String setupWizardCompleteKey = 'setup_wizard_complete';

  // App Settings
  static const String appName = 'CentralHealth';
  static const String appVersion = '1.0.0';
  
  // Timeout durations
  static const int apiTimeoutSeconds = 30;
  static const int chatTimeoutSeconds = 60;
  
  // Default values
  static const String defaultUserEmail = 'patient@example.com';
  static const String defaultUserPassword = 'Password123!';
}
