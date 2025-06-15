import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/fhir_bloc.dart';
import '../widgets/observation_list.dart';
import 'package:fhir/r4.dart';

class MedicalRecordsScreen extends StatefulWidget {
  final String patientId;
  final String patientName;

  const MedicalRecordsScreen({
    Key? key,
    required this.patientId,
    required this.patientName,
  }) : super(key: key);

  @override
  State<MedicalRecordsScreen> createState() => _MedicalRecordsScreenState();
}

class _MedicalRecordsScreenState extends State<MedicalRecordsScreen> {
  @override
  void initState() {
    super.initState();
    _loadObservations();
  }

  void _loadObservations() {
    context.read<FHIRBloc>().add(
      FetchPatientObservations(widget.patientId),
    );
  }

  void _showAddObservationDialog() {
    showDialog(
      context: context,
      builder: (context) => AddObservationDialog(
        patientId: widget.patientId,
        onObservationAdded: _loadObservations,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Records: ${widget.patientName}'),
      ),
      body: ObservationList(patientId: widget.patientId),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddObservationDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}

class AddObservationDialog extends StatefulWidget {
  final String patientId;
  final VoidCallback onObservationAdded;

  const AddObservationDialog({
    Key? key,
    required this.patientId,
    required this.onObservationAdded,
  }) : super(key: key);

  @override
  State<AddObservationDialog> createState() => _AddObservationDialogState();
}

class _AddObservationDialogState extends State<AddObservationDialog> {
  final _formKey = GlobalKey<FormState>();
  String _code = '';
  String _value = '';
  String _unit = '';

  void _submitForm() {
    if (_formKey.currentState?.validate() ?? false) {
      _formKey.currentState?.save();

      final observation = Observation(
        status: FhirCode('final'),
        code: CodeableConcept(
          coding: [
            Coding(
              system: FhirUri('http://loinc.org'),
              code: FhirCode(_code),
              display: _code,
            ),
          ],
        ),
        valueQuantity: Quantity(
          value: FhirDecimal(double.parse(_value)),
          unit: _unit,
          system: FhirUri('http://unitsofmeasure.org'),
        ),
        effectiveDateTime: FhirDateTime(DateTime.now()),
      );

      context.read<FHIRBloc>().add(
        CreateObservation(observation, widget.patientId),
      );

      widget.onObservationAdded();
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add Observation'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              decoration: const InputDecoration(
                labelText: 'Code',
                hintText: 'e.g., blood-pressure',
              ),
              validator: (value) {
                if (value?.isEmpty ?? true) {
                  return 'Please enter a code';
                }
                return null;
              },
              onSaved: (value) => _code = value ?? '',
            ),
            TextFormField(
              decoration: const InputDecoration(
                labelText: 'Value',
                hintText: 'e.g., 120',
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value?.isEmpty ?? true) {
                  return 'Please enter a value';
                }
                if (double.tryParse(value!) == null) {
                  return 'Please enter a valid number';
                }
                return null;
              },
              onSaved: (value) => _value = value ?? '',
            ),
            TextFormField(
              decoration: const InputDecoration(
                labelText: 'Unit',
                hintText: 'e.g., mmHg',
              ),
              validator: (value) {
                if (value?.isEmpty ?? true) {
                  return 'Please enter a unit';
                }
                return null;
              },
              onSaved: (value) => _unit = value ?? '',
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _submitForm,
          child: const Text('Add'),
        ),
      ],
    );
  }
}
