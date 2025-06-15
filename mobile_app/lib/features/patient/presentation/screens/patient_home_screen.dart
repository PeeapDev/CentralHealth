import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart'; // Add DateFormat for date formatting
import '../../../debug/debug_view.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import 'package:hospital_fhir_mobile/features/auth/bloc/auth_bloc.dart';
import 'package:hospital_fhir_mobile/features/auth/data/auth_service.dart';
import 'package:hospital_fhir_mobile/features/profile/data/profile_repository.dart';
import 'package:hospital_fhir_mobile/features/profile/provider/profile_provider.dart';
import 'package:hospital_fhir_mobile/features/profile/data/models/user_profile_model.dart';
// Use the local screen implementations
import 'medical_records_screen.dart';
import 'chat_screen.dart';
import '../../../profile/presentation/screens/profile_screen.dart';

class PatientHomeScreen extends StatefulWidget {
  const PatientHomeScreen({Key? key}) : super(key: key);

  @override
  State<PatientHomeScreen> createState() => _PatientHomeScreenState();

}

class _PatientHomeScreenState extends State<PatientHomeScreen> {
  int _selectedIndex = 0;
  UserProfile? _userProfile;
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    // Get provider instances
    final profileProvider = Provider.of<ProfileProvider>(context, listen: false);
    final authState = context.read<AuthBloc>().state;
    final authService = Provider.of<AuthService>(context, listen: false);
    
    if (authState is Authenticated) {
      try {
        // Set context on the provider
        profileProvider.setContext(context);
        
        // Get the current user's email
        final userEmail = await authService.getCurrentUserEmail();
        
        if (userEmail != null && userEmail.isNotEmpty) {
          print('Loading profile for user: $userEmail');
          // Load profile with explicit email
          final profile = await profileProvider.loadUserProfile(userEmail);
          if (mounted) {
            setState(() {
              _userProfile = profileProvider.userProfile;
              _isLoading = false;
            });
          }
        } else {
          print('Error: Could not retrieve user email');
          if (mounted) {
            setState(() {
              _isLoading = false;
            });
          }
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
        print('Error loading profile: $e');
      }
    }
  }
  
  // Handle navigation
  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    
    // Handle navigation based on selected index
    switch (index) {
      case 0: // Dashboard - already on this screen
        break;
      case 1: // Appointments
        _navigateToBookAppointment(context);
        break;
      case 2: // Records
        _navigateToMedicalRecords(context);
        break;
      case 3: // Messages
        _navigateToChat(context);
        break;
      case 4: // Profile
        _navigateToProfile(context);
        break;
    }
  }
  
  // Navigation methods are implemented below
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.exit_to_app),
            onPressed: () {
              context.read<AuthBloc>().add(LogoutRequested());
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: _buildPatientDashboard(),
            ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(
                color: Colors.blue,
              ),
              child: Text(
                'Patient App',
                style: TextStyle(color: Colors.white, fontSize: 24),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('Profile'),
              onTap: () {
                Navigator.pop(context);
                _navigateToProfile(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('Settings'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Add settings navigation
              },
            ),
            const Divider(),
            // Debug option - only show in development
            ListTile(
              leading: const Icon(Icons.bug_report),
              title: const Text('Debug View'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const DebugViewScreen(),
                  ),
                );
              },
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed, // Required for more than 3 items
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month),
            label: 'Appointments',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.medical_services),
            label: 'Records',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat),
            label: 'Messages',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildPatientDashboard() {
    if (_userProfile == null) {
      // Error state when profile couldn't be loaded
      return _buildErrorState();
    }
    
    return RefreshIndicator(
      onRefresh: _loadUserProfile,
      child: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Patient ID Card
          _buildPatientIdCard(),
          
          const SizedBox(height: 24.0),
          
          // Quick Actions
          _buildQuickActions(),
          
          const SizedBox(height: 24.0),
          
          // Upcoming Appointments
          _buildUpcomingAppointments(),
          
          const SizedBox(height: 24.0),
          
          // Recent Medical Records
          _buildRecentMedicalRecords(),
        ],
      ),
    );
  }
  
  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            color: Colors.red,
            size: 60,
          ),
          const SizedBox(height: 16),
          Text(
            'Oops! Something went wrong.',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Failed to load your profile data.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadUserProfile,
            icon: const Icon(Icons.refresh),
            label: const Text('Try Again'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPatientIdCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Patient Photo
                GestureDetector(
                  onTap: () {
                    if (_userProfile?.profileImageUrl != null && _userProfile!.profileImageUrl!.isNotEmpty) {
                      _showFullScreenImage(context, _userProfile!.profileImageUrl!);
                    }
                  },
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.grey.shade200,
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _userProfile?.profileImageUrl != null && _userProfile!.profileImageUrl!.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: _userProfile!.profileImageUrl!,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => const Center(
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            errorWidget: (context, url, error) => const Icon(
                              Icons.person,
                              size: 50,
                              color: Colors.grey,
                            ),
                          )
                        : const Icon(Icons.person, size: 50, color: Colors.grey),
                  ),
                ),
                const SizedBox(width: 16),
                // Patient Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _userProfile?.fullName ?? 'Patient Name',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 22,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildInfoRow(
                        Icons.local_hospital,
                        'Medical ID:',
                        _userProfile?.patientId ?? 'Not assigned',
                      ),
                      const SizedBox(height: 4),
                      _buildInfoRow(
                        Icons.business,
                        'Hospital:',
                        _userProfile?.hospitalCode ?? 'Central Hospital',
                      ),
                      const SizedBox(height: 4),
                      _buildInfoRow(
                        Icons.bloodtype,
                        'Blood Type:',
                        _userProfile?.bloodType ?? 'Unknown',
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildActionButton(Icons.qr_code, 'Show ID', () {
                  _showMedicalIdDialog(context);
                }),
                _buildActionButton(Icons.edit, 'Update', () {
                  _navigateToProfile(context);
                }),
                _buildActionButton(Icons.share, 'Share', () {
                  // TODO: Implement share functionality
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.blue),
        const SizedBox(width: 4),
        Text(
          '$label ',
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        Text(value),
      ],
    );
  }
  
  Widget _buildActionButton(IconData icon, String label, VoidCallback onPressed) {
    return InkWell(
      onTap: onPressed,
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            Icon(icon, color: Colors.blue),
            const SizedBox(height: 4),
            Text(label),
          ],
        ),
      ),
    );
  }
  
  void _showFullScreenImage(BuildContext context, String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Align(
              alignment: Alignment.topRight,
              child: IconButton(
                icon: const Icon(
                  Icons.close,
                  color: Colors.white,
                  size: 30,
                ),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            Hero(
              tag: imageUrl,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: CachedNetworkImage(
                  imageUrl: imageUrl,
                  fit: BoxFit.contain,
                  placeholder: (context, url) => Container(
                    color: Colors.black12,
                    child: const Center(
                      child: CircularProgressIndicator(),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: Colors.black12,
                    child: const Center(
                      child: Icon(Icons.error_outline, size: 50),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showMedicalIdDialog(BuildContext context) {
    final medicalId = _userProfile?.patientId ?? 'ID Not Available';
    final patientName = _userProfile?.fullName ?? 'Unknown';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Medical ID', textAlign: TextAlign.center),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Real QR code using qr_flutter package
              Container(
                width: 220,
                height: 220,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.3),
                      spreadRadius: 1,
                      blurRadius: 5,
                    ),
                  ],
                ),
                child: QrImageView(
                  data: 'PATIENT:$medicalId,NAME:$patientName',
                  version: QrVersions.auto,
                  size: 200,
                  backgroundColor: Colors.white,
                  padding: const EdgeInsets.all(10),
                ),
              ),
              const SizedBox(height: 20),
              // Medical ID displayed prominently below QR code
              Container(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade100),
                ),
                child: Column(
                  children: [
                    const Text(
                      'Medical ID',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.blue,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      medicalId,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Patient: $patientName',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              if (_userProfile?.dob != null)
                Text('DOB: ${_userProfile!.dob}'),
              if (_userProfile?.bloodType != null)
                Text('Blood Type: ${_userProfile!.bloodType}'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 3,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            _buildQuickActionCard('Book Appointment', Icons.calendar_today, () {
              _navigateToBookAppointment(context);
            }),
            _buildQuickActionCard('Medical Records', Icons.folder_open, () {
              _navigateToMedicalRecords(context);
            }),
            _buildQuickActionCard('Message Doctor', Icons.chat_bubble, () {
              _navigateToChat(context);
            }),
            _buildQuickActionCard('Lab Results', Icons.science, () {
              // TODO: Implement navigation to lab results
            }),
            _buildQuickActionCard('Prescriptions', Icons.medication, () {
              // TODO: Implement navigation to prescriptions
            }),
            _buildQuickActionCard('Emergency', Icons.emergency, () {
              // TODO: Implement emergency contact functionality
            }),
          ],
        ),
      ],
    );
  }
  
  Widget _buildQuickActionCard(String title, IconData icon, VoidCallback onTap) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: Colors.blue),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
  
  // First implementation of _buildAppointmentCard removed to prevent duplication
  
  Widget _buildRecentMedicalRecords() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Medical Records',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            TextButton(
              onPressed: () {
                _navigateToMedicalRecords(context);
              },
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // Placeholder for recent records
        Card(
          child: ListTile(
            leading: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Icon(Icons.description, color: Colors.green),
              ),
            ),
            title: const Text('Annual Physical Examination'),
            subtitle: const Text('Dr. Robert Chen • June 10, 2023'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // TODO: Navigate to record details
            },
          ),
        ),
      ],
    );
  }

  Widget _buildWelcomeHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_isLoading)
          const CircularProgressIndicator()
        else
          Text(
            'Hello, ${_userProfile?.firstName ?? 'Patient'}',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.blue.shade800,
            ),
          ),
        const SizedBox(height: 8),
        Text(
          'Welcome to your health dashboard',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActionsGrid(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 16.0,
          crossAxisSpacing: 16.0,
          childAspectRatio: 1.5,
          children: [
            _buildActionCard(
              context,
              'Book Appointment',
              Icons.calendar_today,
              Colors.blue,
              () => _navigateToBookAppointment(context),
            ),
            _buildActionCard(
              context,
              'Medical Records',
              Icons.folder_outlined,
              Colors.green,
              () => _navigateToMedicalRecords(context),
            ),
            _buildActionCard(
              context,
              'Medications',
              Icons.medication_outlined,
              Colors.orange,
              () => _navigateToMedications(context),
            ),
            _buildActionCard(
              context,
              'Chat with Doctor',
              Icons.chat_bubble_outline,
              Colors.purple,
              () => _navigateToChat(context),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 32,
              color: color,
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingAppointments() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Upcoming Appointments',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () {},
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        _buildAppointmentCard(
          'Dr. Sarah Johnson',
          'Cardiologist',
          DateTime.now().add(const Duration(days: 3)),
          '10:00 AM',
        ),
        const SizedBox(height: 8),
        _buildAppointmentCard(
          'Dr. Michael Chen',
          'Neurologist',
          DateTime.now().add(const Duration(days: 7)),
          '2:30 PM',
        ),
      ],
    );
  }

  Widget _buildAppointmentCard(
    String doctorName,
    String specialty,
    DateTime date,
    String time,
  ) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.blue.shade800.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.person,
                size: 24,
                color: Colors.blue,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doctorName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    specialty,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 14,
                        color: Colors.grey.shade700,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${date.day}/${date.month}/${date.year}',
                        style: TextStyle(
                          color: Colors.grey.shade700,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Icon(
                        Icons.access_time,
                        size: 14,
                        color: Colors.grey.shade700,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        time,
                        style: TextStyle(
                          color: Colors.grey.shade700,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.more_vert),
              onPressed: () {},
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentMedications() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Medications',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () {},
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        _buildMedicationCard(
          'Lisinopril',
          '10mg',
          'Once daily',
          Colors.blue.shade100,
        ),
        const SizedBox(height: 8),
        _buildMedicationCard(
          'Metformin',
          '500mg',
          'Twice daily with meals',
          Colors.green.shade100,
        ),
        const SizedBox(height: 8),
        _buildMedicationCard(
          'Atorvastatin',
          '20mg',
          'Once daily at bedtime',
          Colors.orange.shade100,
        ),
      ],
    );
  }

  Widget _buildMedicationCard(
    String name,
    String dosage,
    String instructions,
    Color color,
  ) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.medication,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    dosage,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    instructions,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () {},
              tooltip: 'Set reminder',
            ),
          ],
        ),
      ),
    );
  }
  
  // Navigation methods
  void _navigateToBookAppointment(BuildContext context) {
    // TODO: Implement navigation to appointment booking
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Book appointment feature coming soon')),
    );
  }

  void _navigateToMedicalRecords(BuildContext context) {
    // Check if user profile is loaded
    if (_userProfile != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => MedicalRecordsScreen(
            patientId: _userProfile!.id ?? 'unknown',
            patientName: _userProfile!.fullName.isNotEmpty ? _userProfile!.fullName : 'Patient',
          ),
        ),
      );
    } else {
      // Show error if profile not loaded
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please wait while your profile loads')),
      );
    }
  }

  void _navigateToMedications(BuildContext context) {
    // TODO: Implement navigation to medications
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Medications feature coming soon')),
    );
  }

  void _navigateToChat(BuildContext context) {
    // Check if user profile is loaded
    if (_userProfile != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => ChatScreen(
            userId: _userProfile!.id,
          ),
        ),
      );
    } else {
      // Show error if profile not loaded
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please wait while your profile loads')),
      );
    }
  }
  
  void _navigateToProfile(BuildContext context) {
    // Check if user profile is loaded
    if (_userProfile != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => ProfileScreen(
            userId: _userProfile!.id,
          ),
        ),
      );
    } else {
      // Show error if profile not loaded
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please wait while your profile loads')),
      );
    }
  }
}

