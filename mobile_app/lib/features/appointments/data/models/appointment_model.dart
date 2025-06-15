import 'package:intl/intl.dart';

class Appointment {
  final String id;
  final String patientId;
  final String doctorId;
  final String status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final PatientSummary? patient;
  final DoctorSummary? doctor;

  Appointment({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.patient,
    this.doctor,
  });

  // Format date for display
  String get formattedDate => DateFormat('MMM d, yyyy - h:mm a').format(createdAt);

  // Get status color based on appointment status
  String get statusColor {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'blue';
      case 'confirmed':
        return 'green';
      case 'completed':
        return 'teal';
      case 'cancelled':
        return 'red';
      case 'no-show':
        return 'amber';
      default:
        return 'grey';
    }
  }

  // Display status with proper formatting
  String get displayStatus {
    final statusLower = status.toLowerCase();
    if (statusLower.contains('-')) {
      // Convert no-show to No-Show
      List<String> parts = statusLower.split('-');
      return parts.map((part) => '${part[0].toUpperCase()}${part.substring(1)}').join('-');
    }
    // Convert scheduled to Scheduled
    return '${statusLower[0].toUpperCase()}${statusLower.substring(1)}';
  }

  // Factory constructor to create an Appointment from JSON
  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'],
      patientId: json['patientId'],
      doctorId: json['doctorId'],
      status: json['status'],
      notes: json['notes'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : DateTime.parse(json['createdAt']),
      patient: json['patient'] != null ? PatientSummary.fromJson(json['patient']) : null,
      doctor: json['doctor'] != null ? DoctorSummary.fromJson(json['doctor']) : null,
    );
  }

  // Convert Appointment to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'doctorId': doctorId,
      'status': status,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class PatientSummary {
  final String id;
  final dynamic name;
  final String? medicalNumber;

  PatientSummary({
    required this.id,
    required this.name,
    this.medicalNumber,
  });

  // Helper getter to extract first name from the name JSON structure
  String get firstName {
    if (name is Map<String, dynamic>) {
      return (name as Map<String, dynamic>)['firstName'] ?? '';
    }
    return '';
  }
  
  // Helper getter to extract last name from the name JSON structure
  String get lastName {
    if (name is Map<String, dynamic>) {
      return (name as Map<String, dynamic>)['lastName'] ?? '';
    }
    return '';
  }
  
  // Helper getter to get the full name
  String get fullName {
    final fName = firstName;
    final lName = lastName;
    if (fName.isEmpty && lName.isEmpty) return 'Unknown';
    return '$fName $lName'.trim();
  }

  factory PatientSummary.fromJson(Map<String, dynamic> json) {
    return PatientSummary(
      id: json['id'],
      name: json['name'],
      medicalNumber: json['medicalNumber'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'medicalNumber': medicalNumber,
    };
  }
}

class DoctorSummary {
  final String id;
  final String? name;
  final String? role;

  DoctorSummary({
    required this.id,
    this.name,
    this.role,
  });

  factory DoctorSummary.fromJson(Map<String, dynamic> json) {
    return DoctorSummary(
      id: json['id'],
      name: json['name'],
      role: json['role'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'role': role,
    };
  }
}
