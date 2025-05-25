import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/fhir_bloc.dart';
import '../../../../shared/models/fhir_resource.dart';

class ObservationList extends StatelessWidget {
  final String patientId;

  const ObservationList({
    Key? key,
    required this.patientId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FHIRBloc, FHIRState>(
      builder: (context, state) {
        if (state is FHIRLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (state is FHIRError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  color: Colors.red,
                  size: 48,
                ),
                const SizedBox(height: 16),
                Text(
                  state.message,
                  style: const TextStyle(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    context.read<FHIRBloc>().add(
                      FetchPatientObservations(patientId),
                    );
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        if (state is ObservationsLoaded) {
          if (state.observations.isEmpty) {
            return const Center(
              child: Text('No observations found'),
            );
          }

          return ListView.builder(
            itemCount: state.observations.length,
            itemBuilder: (context, index) {
              final observation = state.observations[index];
              return ObservationCard(observation: observation);
            },
          );
        }

        return const SizedBox.shrink();
      },
    );
  }
}

class ObservationCard extends StatelessWidget {
  final ObservationModel observation;

  const ObservationCard({
    Key? key,
    required this.observation,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 8,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  observation.code ?? 'Unknown Code',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  _formatDate(observation.effectiveDateTime),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (observation.value != null) ...[
              Row(
                children: [
                  Text(
                    'Value: ',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  Text(
                    '${observation.value} ${observation.unit ?? ''}',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'No date';
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
