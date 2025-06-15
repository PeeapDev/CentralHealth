import 'package:flutter/material.dart';

class MedicalRecordsScreen extends StatefulWidget {
  final String? patientId;
  final String? patientName;

  const MedicalRecordsScreen({
    Key? key,
    this.patientId,
    this.patientName,
  }) : super(key: key);

  @override
  State<MedicalRecordsScreen> createState() => _MedicalRecordsScreenState();
}

class _MedicalRecordsScreenState extends State<MedicalRecordsScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _records = [];

  @override
  void initState() {
    super.initState();
    _fetchMedicalRecords();
  }

  Future<void> _fetchMedicalRecords() async {
    // In a real app, we would fetch medical records from the API
    // For now, we'll simulate a network delay and use mock data
    await Future.delayed(const Duration(seconds: 1));
    
    if (mounted) {
      setState(() {
        _isLoading = false;
        _records = [
          {
            'id': '001',
            'type': 'Lab Test',
            'name': 'Complete Blood Count',
            'date': DateTime.now().subtract(const Duration(days: 7)),
            'provider': 'Dr. Sarah Johnson',
            'results': 'Normal'
          },
          {
            'id': '002',
            'type': 'Imaging',
            'name': 'Chest X-Ray',
            'date': DateTime.now().subtract(const Duration(days: 14)),
            'provider': 'Dr. Michael Chen',
            'results': 'No significant findings'
          },
          {
            'id': '003',
            'type': 'Prescription',
            'name': 'Lisinopril 10mg',
            'date': DateTime.now().subtract(const Duration(days: 21)),
            'provider': 'Dr. Sarah Johnson',
            'results': 'Refill x3'
          }
        ];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Medical Records${widget.patientName != null ? " - ${widget.patientName}" : ""}'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _records.isEmpty
              ? const Center(child: Text('No medical records found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: _records.length,
                  itemBuilder: (context, index) {
                    final record = _records[index];
                    return Card(
                      elevation: 2,
                      margin: const EdgeInsets.only(bottom: 16.0),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Chip(
                                  backgroundColor: _getTypeColor(record['type']!),
                                  label: Text(
                                    record['type']!,
                                    style: TextStyle(
                                      color: _getTypeColor(record['type']!).computeLuminance() > 0.5 ? Colors.black : Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                Text(
                                  '${record['date'].day}/${record['date'].month}/${record['date'].year}',
                                  style: const TextStyle(color: Colors.grey),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              record['name']!,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text('Provider: ${record['provider']}'),
                            const SizedBox(height: 8),
                            const Divider(),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Results: ${record['results']}',
                                  style: const TextStyle(fontWeight: FontWeight.w500),
                                ),
                                TextButton.icon(
                                  icon: const Icon(Icons.visibility),
                                  label: const Text('View Details'),
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Viewing details for ${record['name']}')),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        child: const Icon(Icons.refresh),
        onPressed: () {
          setState(() => _isLoading = true);
          _fetchMedicalRecords();
        },
      ),
    );
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'Lab Test':
        return Colors.blue.shade200;
      case 'Imaging':
        return Colors.purple.shade200;
      case 'Prescription':
        return Colors.green.shade200;
      default:
        return Colors.grey.shade300;
    }
  }
}
