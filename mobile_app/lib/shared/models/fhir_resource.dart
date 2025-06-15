import 'package:fhir/r4.dart';

abstract class FhirResourceModel {
  final Resource resource;
  
  FhirResourceModel(this.resource);
  
  Map<String, dynamic> toJson();
  
  @override
  String toString() => resource.toJson().toString();
}

class PatientModel extends FhirResourceModel {
  PatientModel(Patient patient) : super(patient);
  
  String? get id => (resource as Patient).fhirId;
  String? get firstName => (resource as Patient).name?.isNotEmpty == true ? 
      (resource as Patient).name?.first.given?.firstOrNull : null;
  String? get lastName => (resource as Patient).name?.isNotEmpty == true ? 
      (resource as Patient).name?.first.family : null;
  DateTime? get birthDate => (resource as Patient).birthDate != null ? 
      DateTime.parse((resource as Patient).birthDate.toString()) : null;
  String? get gender => (resource as Patient).gender?.toString();
  
  @override
  Map<String, dynamic> toJson() => (resource as Patient).toJson();
}

class ObservationModel extends FhirResourceModel {
  ObservationModel(Observation observation) : super(observation);
  
  String? get id => (resource as Observation).fhirId;
  String? get code => (resource as Observation).code.coding?.firstOrNull?.code?.toString();
  String? get value => (resource as Observation).valueQuantity?.value?.toString();
  String? get unit => (resource as Observation).valueQuantity?.unit?.toString();
  DateTime? get effectiveDateTime => (resource as Observation).effectiveDateTime != null ?
      DateTime.parse((resource as Observation).effectiveDateTime.toString()) : null;
  
  @override
  Map<String, dynamic> toJson() => (resource as Observation).toJson();
}
