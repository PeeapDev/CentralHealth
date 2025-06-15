import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import 'features/auth/bloc/auth_bloc.dart';
import 'features/auth/data/auth_service.dart';
import 'features/auth/data/auth_debug.dart';
// Patient-only app, no role selection needed
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/auth/presentation/screens/register_screen.dart';
import 'features/patient/presentation/screens/patient_home_screen.dart';
// Onboarding and setup screens
import 'features/onboarding/presentation/screens/onboarding_screen.dart';
import 'features/setup/presentation/screens/setup_wizard_screen.dart';
import 'features/profile/presentation/screens/profile_setup_wizard.dart';
import 'features/setup/data/config_provider.dart';
import 'features/patients/provider/patients_provider.dart';
import 'features/appointments/provider/appointments_provider.dart';
import 'features/profile/provider/profile_provider.dart';
import 'features/profile/data/profile_repository.dart';
import 'core/services/api_service.dart';
import 'core/network/api_client.dart';
import 'core/storage/secure_storage.dart';
import 'core/constants/app_constants.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:developer' as developer;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  
  // Get stored configuration
  final serverUrl = prefs.getString('server_url');
  final apiVersion = prefs.getString('api_version');
  
  // Create ConfigProvider and wait for it to init
  final configProvider = ConfigProvider();
  await configProvider.init();
  
  // Initialize secure storage for authentication tokens
  final secureStorage = SecureStorage();
  
  // Initialize debug tools
  final authDebugTools = AuthDebugTools(secureStorage, prefs);
  
  // Set up test environment for debugging
  await authDebugTools.initTestEnvironment();
  
  // Create API client with the saved URL if available
  final apiClient = ApiClient();
  if (serverUrl != null && serverUrl.isNotEmpty) {
    developer.log('Main: Setting API client base URL to: $serverUrl');
    apiClient.updateBaseUrl(serverUrl);
  }
  
  // Initialize authentication service
  final authService = AuthService(apiClient, prefs);
  
  // Restore authentication token if available
  final accessToken = await secureStorage.getAccessToken();
  if (accessToken != null) {
    developer.log('Main: Restoring authentication token');
    apiClient.setAuthToken(accessToken);
  }
  
  runApp(
    MultiProvider(
      providers: [
        // Core providers
        ChangeNotifierProvider<ConfigProvider>(
          create: (_) => configProvider,
        ),
        Provider<AuthService>(
          create: (_) => authService,
        ),
        BlocProvider(
          create: (_) => AuthBloc(authService)..add(CheckAuthStatus()),
        ),
        // Core services
        Provider(
          create: (_) => ApiService(apiClient),
        ),
        // Feature repositories
        Provider(
          create: (context) => ProfileRepository(context.read<ApiService>()),
        ),
        // Feature providers
        ChangeNotifierProvider(
          create: (_) => PatientsProvider(),
        ),
        ChangeNotifierProvider(
          create: (_) => AppointmentsProvider(),
        ),
        ChangeNotifierProvider(
          create: (context) => ProfileProvider(repository: context.read<ProfileRepository>()),
        ),
      ],
      child: MyApp(
        authService: authService,
        configProvider: configProvider,
      ),
    ),
  );
}

class MyApp extends StatelessWidget {
  final AuthService authService;
  final ConfigProvider configProvider;

  const MyApp({
    Key? key,
    required this.authService,
    required this.configProvider,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<ConfigProvider>(
      builder: (context, config, child) {
        return MaterialApp(
          title: 'Central Health App',
          theme: ThemeData(
            primarySwatch: Colors.blue,
            visualDensity: VisualDensity.adaptivePlatformDensity,
            appBarTheme: const AppBarTheme(
              elevation: 0,
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
            ),
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: ElevatedButton.styleFrom(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
          initialRoute: '/',
          routes: {
            '/': (context) => FutureBuilder<SharedPreferences>(
              future: SharedPreferences.getInstance(),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return const Scaffold(
                    body: Center(child: CircularProgressIndicator()),
                  );
                }
                
                final prefs = snapshot.data!;
                final bool onboardingComplete = prefs.getBool(AppConstants.onboardingCompleteKey) ?? false;
                
                // If onboarding is not complete, show onboarding screen
                if (!onboardingComplete) {
                  return const OnboardingScreen();
                }
                
                // Otherwise, determine if user is authenticated
                return BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    if (state is Authenticated) {
                      // Check if setup wizard is complete
                      final bool setupWizardComplete = prefs.getBool(AppConstants.setupWizardCompleteKey) ?? false;
                      final profileProvider = Provider.of<ProfileProvider>(context, listen: false);
                      
                      if (!setupWizardComplete) {
                        // Setup wizard not complete, show ProfileSetupWizard
                        return const ProfileSetupWizard();
                      } else {
                        // Setup complete, show home screen
                        return const PatientHomeScreen();
                      }
                    } else if (state is AuthLoading) {
                      return const Scaffold(
                        body: Center(child: CircularProgressIndicator()),
                      );
                    } else {
                      // Not authenticated, go to login screen
                      return const LoginScreen();
                    }
                  },
                );
              },
            ),
            '/setup': (context) => const SetupWizardScreen(),
            '/onboarding': (context) => const OnboardingScreen(),
            '/profile_setup': (context) => const ProfileSetupWizard(),
            '/login': (context) => const LoginScreen(),
            '/register': (context) => const RegisterScreen(),
            '/patient_home': (context) => const PatientHomeScreen(),
          },
        );
      },
    );
  }
}
