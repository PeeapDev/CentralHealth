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
  
  String? get id => (resource as Patient).id?.value;
  String? get firstName => (resource as Patient).name?.first.given?.first.value;
  String? get lastName => (resource as Patient).name?.first.family?.value;
  DateTime? get birthDate => (resource as Patient).birthDate?.value;
  String? get gender => (resource as Patient).gender?.value.toString();
  
  @override
  Map<String, dynamic> toJson() => (resource as Patient).toJson();
}

class ObservationModel extends FhirResourceModel {
  ObservationModel(Observation observation) : super(observation);
  
  String? get id => (resource as Observation).id?.value;
  String? get code => (resource as Observation).code.coding?.first.code?.value;
  String? get value => (resource as Observation).valueQuantity?.value?.value.toString();
  String? get unit => (resource as Observation).valueQuantity?.unit?.value;
  DateTime? get effectiveDateTime => (resource as Observation).effectiveDateTime?.value;
  
  @override
  Map<String, dynamic> toJson() => (resource as Observation).toJson();
}
