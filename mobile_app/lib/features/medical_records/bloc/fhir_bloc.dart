import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:fhir/r4.dart';
import '../data/fhir_service.dart';
import '../../../shared/models/fhir_resource.dart';

// Events
abstract class FHIREvent extends Equatable {
  const FHIREvent();
  
  @override
  List<Object?> get props => [];
}

class CreatePatient extends FHIREvent {
  final Patient patient;
  
  const CreatePatient(this.patient);
  
  @override
  List<Object?> get props => [patient];
}

class CreateObservation extends FHIREvent {
  final Observation observation;
  final String patientId;
  
  const CreateObservation(this.observation, this.patientId);
  
  @override
  List<Object?> get props => [observation, patientId];
}

class FetchPatientObservations extends FHIREvent {
  final String patientId;
  
  const FetchPatientObservations(this.patientId);
  
  @override
  List<Object?> get props => [patientId];
}

// States
abstract class FHIRState extends Equatable {
  const FHIRState();
  
  @override
  List<Object?> get props => [];
}

class FHIRInitial extends FHIRState {}

class FHIRLoading extends FHIRState {}

class PatientCreated extends FHIRState {
  final PatientModel patient;
  
  const PatientCreated(this.patient);
  
  @override
  List<Object?> get props => [patient];
}

class ObservationCreated extends FHIRState {
  final ObservationModel observation;
  
  const ObservationCreated(this.observation);
  
  @override
  List<Object?> get props => [observation];
}

class ObservationsLoaded extends FHIRState {
  final List<ObservationModel> observations;
  
  const ObservationsLoaded(this.observations);
  
  @override
  List<Object?> get props => [observations];
}

class FHIRError extends FHIRState {
  final String message;
  
  const FHIRError(this.message);
  
  @override
  List<Object?> get props => [message];
}

// BLoC
class FHIRBloc extends Bloc<FHIREvent, FHIRState> {
  final FHIRService _fhirService;
  
  FHIRBloc(this._fhirService) : super(FHIRInitial()) {
    on<CreatePatient>(_onCreatePatient);
    on<CreateObservation>(_onCreateObservation);
    on<FetchPatientObservations>(_onFetchPatientObservations);
  }
  
  Future<void> _onCreatePatient(CreatePatient event, Emitter<FHIRState> emit) async {
    try {
      emit(FHIRLoading());
      final patient = await _fhirService.createPatient(event.patient);
      emit(PatientCreated(patient));
    } catch (e) {
      emit(FHIRError(e.toString()));
    }
  }
  
  Future<void> _onCreateObservation(CreateObservation event, Emitter<FHIRState> emit) async {
    try {
      emit(FHIRLoading());
      final observation = await _fhirService.createObservation(
        event.observation,
        event.patientId,
      );
      emit(ObservationCreated(observation));
    } catch (e) {
      emit(FHIRError(e.toString()));
    }
  }
  
  Future<void> _onFetchPatientObservations(FetchPatientObservations event, Emitter<FHIRState> emit) async {
    try {
      emit(FHIRLoading());
      final observations = await _fhirService.getPatientObservations(event.patientId);
      emit(ObservationsLoaded(observations));
    } catch (e) {
      emit(FHIRError(e.toString()));
    }
  }
}
