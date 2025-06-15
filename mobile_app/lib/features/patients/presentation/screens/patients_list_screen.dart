import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../provider/patients_provider.dart';
import '../widgets/patient_list_item.dart';
import '../../../../core/widgets/app_error_widget.dart';
import '../../../../core/widgets/app_loading_widget.dart';
import '../../../../core/widgets/search_bar_widget.dart';
import '../widgets/empty_list_widget.dart';
import 'patient_details_screen.dart';

class PatientsListScreen extends StatefulWidget {
  const PatientsListScreen({Key? key}) : super(key: key);

  @override
  State<PatientsListScreen> createState() => _PatientsListScreenState();
}

class _PatientsListScreenState extends State<PatientsListScreen> {
  final ScrollController _scrollController = ScrollController();
  String _searchQuery = '';
  
  @override
  void initState() {
    super.initState();
    // Load patients when the screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadPatients();
    });
    
    // Add scroll listener for pagination
    _scrollController.addListener(_scrollListener);
  }
  
  @override
  void dispose() {
    _scrollController.removeListener(_scrollListener);
    _scrollController.dispose();
    super.dispose();
  }
  
  // Scroll listener for pagination
  void _scrollListener() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent - 200) {
      _loadMorePatients();
    }
  }
  
  // Load initial patients list
  Future<void> _loadPatients() async {
    final patientsProvider = Provider.of<PatientsProvider>(context, listen: false);
    await patientsProvider.fetchPatients(
      search: _searchQuery.isEmpty ? null : _searchQuery,
    );
  }
  
  // Load more patients for pagination
  Future<void> _loadMorePatients() async {
    final patientsProvider = Provider.of<PatientsProvider>(context, listen: false);
    if (!patientsProvider.isLoading) {
      await patientsProvider.loadMorePatients(
        search: _searchQuery.isEmpty ? null : _searchQuery,
      );
    }
  }
  
  // Handle search query changes
  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
    
    // Debounce search queries
    Future.delayed(const Duration(milliseconds: 500), () {
      if (query == _searchQuery) {
        _loadPatients();
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patients'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadPatients,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SearchBarWidget(
              hintText: 'Search by name, email, or medical ID',
              onChanged: _onSearchChanged,
            ),
          ),
          
          // Patient list with loading/error states
          Expanded(
            child: Consumer<PatientsProvider>(
              builder: (context, patientsProvider, child) {
                if (patientsProvider.isLoading && patientsProvider.patients.isEmpty) {
                  return const AppLoadingWidget();
                }
                
                if (patientsProvider.error != null && patientsProvider.patients.isEmpty) {
                  return AppErrorWidget(
                    error: patientsProvider.error!,
                    onRetry: _loadPatients,
                  );
                }
                
                final patients = patientsProvider.patients;
                
                if (patients.isEmpty) {
                  return EmptyListWidget(
                    message: _searchQuery.isEmpty
                        ? 'No patients found'
                        : 'No patients match your search',
                    icon: Icons.person_off,
                  );
                }
                
                return Stack(
                  children: [
                    // Main patient list
                    RefreshIndicator(
                      onRefresh: _loadPatients,
                      child: ListView.builder(
                        controller: _scrollController,
                        itemCount: patients.length + 1, // +1 for loading indicator
                        itemBuilder: (context, index) {
                          if (index == patients.length) {
                            // Show bottom loader for pagination
                            if (patientsProvider.isLoading) {
                              return const Padding(
                                padding: EdgeInsets.all(8.0),
                                child: Center(child: CircularProgressIndicator()),
                              );
                            } else {
                              return const SizedBox.shrink();
                            }
                          }
                          
                          final patient = patients[index];
                          return PatientListItem(
                            patient: patient,
                            onTap: () => _navigateToPatientDetails(patient.id),
                          );
                        },
                      ),
                    ),
                    
                    // Error snackbar for loading more
                    if (patientsProvider.error != null && patients.isNotEmpty)
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        child: Container(
                          color: Colors.red,
                          padding: const EdgeInsets.symmetric(
                            vertical: 8.0,
                            horizontal: 16.0,
                          ),
                          child: Text(
                            patientsProvider.error!,
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to add patient screen
          // Implementation depends on your navigation setup
        },
        child: const Icon(Icons.add),
      ),
    );
  }
  
  void _navigateToPatientDetails(String patientId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PatientDetailsScreen(patientId: patientId),
      ),
    );
  }
}
