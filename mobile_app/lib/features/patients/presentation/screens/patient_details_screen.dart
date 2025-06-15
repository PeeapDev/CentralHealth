import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/models/patient_model.dart';
import '../../provider/patients_provider.dart';
import '../../../../core/widgets/app_error_widget.dart';
import '../../../../core/widgets/app_loading_widget.dart';

class PatientDetailsScreen extends StatefulWidget {
  final String patientId;

  const PatientDetailsScreen({
    Key? key,
    required this.patientId,
  }) : super(key: key);

  @override
  State<PatientDetailsScreen> createState() => _PatientDetailsScreenState();
}

class _PatientDetailsScreenState extends State<PatientDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    
    // Load patient details when the screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadPatientDetails();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadPatientDetails() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final patientsProvider = Provider.of<PatientsProvider>(context, listen: false);
      await patientsProvider.fetchPatientById(widget.patientId);
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // Navigate to edit patient screen - implementation depends on your navigation setup
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Medical Records'),
            Tab(text: 'Appointments'),
          ],
        ),
      ),
      body: Consumer<PatientsProvider>(
        builder: (context, patientsProvider, child) {
          if (_isLoading) {
            return const AppLoadingWidget();
          }

          if (patientsProvider.error != null) {
            return AppErrorWidget(
              error: patientsProvider.error!,
              onRetry: _loadPatientDetails,
            );
          }

          final patient = patientsProvider.selectedPatient;
          if (patient == null) {
            return const AppErrorWidget(
              error: 'Patient not found',
              onRetry: null,
            );
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _buildOverviewTab(patient),
              _buildMedicalRecordsTab(patient),
              _buildAppointmentsTab(patient),
            ],
          );
        },
      ),
    );
  }

  Widget _buildOverviewTab(Patient patient) {
    // Use helper methods to get first and last name
    String firstName = patient.firstName.isEmpty ? 'Unknown' : patient.firstName;
    String lastName = patient.lastName;

    return RefreshIndicator(
      onRefresh: _loadPatientDetails,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Patient avatar and basic info
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: Text(
                    firstName.isNotEmpty ? firstName[0].toUpperCase() : '?',
                    style: const TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$firstName $lastName',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      _buildInfoRow(Icons.local_hospital, 'Medical ID: ${patient.medicalNumber ?? 'N/A'}'),
                      const SizedBox(height: 4),
                      _buildInfoRow(
                        patient.gender?.toLowerCase() == 'female'
                            ? Icons.female
                            : (patient.gender?.toLowerCase() == 'male' ? Icons.male : Icons.person),
                        '${patient.gender?[0].toUpperCase()}${patient.gender?.substring(1).toLowerCase() ?? ''}',
                      ),
                      const SizedBox(height: 4),
                      _buildInfoRow(
                        Icons.cake,
                        'Born: ${patient.formattedDateOfBirth} (${patient.age})',
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const Divider(height: 32),

            // Contact information section
            _buildSectionHeader('Contact Information'),
            _buildInfoRow(Icons.email, patient.email ?? 'No email provided'),
            if (patient.phone != null && patient.phone!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildInfoRow(Icons.phone, patient.phone!),
            ],

            const Divider(height: 32),

            // Hospital information
            _buildSectionHeader('Hospital Information'),
            _buildInfoRow(
              Icons.business,
              patient.hospital?.name ?? 'Not assigned to a hospital',
            ),

            const Divider(height: 32),

            // Other patient details (customize based on your needs)
            _buildSectionHeader('Additional Information'),
            // Add more patient details as needed
          ],
        ),
      ),
    );
  }

  Widget _buildMedicalRecordsTab(Patient patient) {
    final medicalRecords = patient.medicalRecords;

    if (medicalRecords == null || medicalRecords.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notes, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No medical records available',
              style: TextStyle(fontSize: 18, color: Colors.grey[700]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: medicalRecords.length,
      itemBuilder: (context, index) {
        final record = medicalRecords[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ListTile(
            title: Text(record.title),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(record.formattedDate),
                const SizedBox(height: 4),
                Text(
                  record.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // Navigate to medical record details
            },
          ),
        );
      },
    );
  }

  Widget _buildAppointmentsTab(Patient patient) {
    final appointments = patient.appointments;

    if (appointments == null || appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.calendar_today, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No appointments scheduled',
              style: TextStyle(fontSize: 18, color: Colors.grey[700]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: appointments.length,
      itemBuilder: (context, index) {
        final appointment = appointments[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ListTile(
            title: Text(appointment.provider?.name ?? 'No provider specified'),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(appointment.formattedDate),
                const SizedBox(height: 4),
                _buildStatusBadge(appointment.status),
              ],
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // Navigate to appointment details
            },
          ),
        );
      },
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(fontSize: 14, color: Colors.grey[800]),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String displayStatus;

    switch (status.toLowerCase()) {
      case 'scheduled':
        color = Colors.blue;
        displayStatus = 'Scheduled';
        break;
      case 'confirmed':
        color = Colors.green;
        displayStatus = 'Confirmed';
        break;
      case 'completed':
        color = Colors.green[700]!;
        displayStatus = 'Completed';
        break;
      case 'cancelled':
        color = Colors.red;
        displayStatus = 'Cancelled';
        break;
      case 'no-show':
        color = Colors.orange;
        displayStatus = 'No-Show';
        break;
      default:
        color = Colors.grey;
        displayStatus = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        displayStatus,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }
}
