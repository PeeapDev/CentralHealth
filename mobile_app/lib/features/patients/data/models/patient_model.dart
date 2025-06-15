import 'package:intl/intl.dart';

class Patient {
  final String id;
  final dynamic name; // Store as dynamic since it comes as JSON from backend
  final String? email;
  final String? phone;
  final DateTime? birthDate; // Changed from dateOfBirth to birthDate to match Prisma schema
  final String? gender;
  final String? medicalNumber;
  final DateTime createdAt;
  final Hospital? hospital;
  final List<MedicalRecord>? records; // Changed from medicalRecords to records to match Prisma schema
  final List<Appointment>? appointments;

  Patient({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.birthDate,
    this.gender,
    this.medicalNumber,
    required this.createdAt,
    this.hospital,
    this.records,
    this.appointments,
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

  // Format date of birth for display
  String get formattedDateOfBirth {
    if (birthDate == null) return 'Not provided';
    return DateFormat('MMM d, yyyy').format(birthDate!);
  }

  // Calculate age based on date of birth
  String get age {
    if (birthDate == null) return 'Unknown';
    final now = DateTime.now();
    int years = now.year - birthDate!.year;
    if (now.month < birthDate!.month || 
        (now.month == birthDate!.month && now.day < birthDate!.day)) {
      years--;
    }
    return '$years years';
  }

  // Factory constructor to create a Patient from JSON
  factory Patient.fromJson(Map<String, dynamic> json) {
    List<MedicalRecord>? records;
    if (json['records'] != null) {
      records = List<MedicalRecord>.from(
        json['records'].map((record) => MedicalRecord.fromJson(record))
      );
    }
    
    List<Appointment>? appointments;
    if (json['appointments'] != null) {
      appointments = List<Appointment>.from(
        json['appointments'].map((appointment) => Appointment.fromJson(appointment))
      );
    }

    return Patient(
      id: json['id'],
      name: json['name'], // This can be a JSON object
      email: json['email'],
      phone: json['phone'],
      birthDate: json['birthDate'] != null ? DateTime.parse(json['birthDate']) : null,
      gender: json['gender'],
      medicalNumber: json['medicalNumber'],
      createdAt: DateTime.parse(json['createdAt']),
      hospital: json['hospital'] != null ? Hospital.fromJson(json['hospital']) : null,
      records: records,
      appointments: appointments,
    );
  }

  // Convert Patient to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name, // This will preserve the JSON structure
      'email': email,
      'phone': phone,
      'birthDate': birthDate?.toIso8601String(),
      'gender': gender,
      'medicalNumber': medicalNumber,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class Hospital {
  final String id;
  final String name;
  final String? subdomain;

  Hospital({
    required this.id,
    required this.name,
    this.subdomain,
  });

  factory Hospital.fromJson(Map<String, dynamic> json) {
    return Hospital(
      id: json['id'],
      name: json['name'],
      subdomain: json['subdomain'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'subdomain': subdomain,
    };
  }
}

class MedicalRecord {
  final String id;
  final String patientId;
  final String title;
  final String description;
  final DateTime date;
  final String providerId;
  final String? providerName;

  MedicalRecord({
    required this.id,
    required this.patientId,
    required this.title,
    required this.description,
    required this.date,
    required this.providerId,
    this.providerName,
  });

  String get formattedDate => DateFormat('MMM d, yyyy').format(date);

  factory MedicalRecord.fromJson(Map<String, dynamic> json) {
    return MedicalRecord(
      id: json['id'],
      patientId: json['patientId'],
      title: json['title'],
      description: json['description'],
      date: DateTime.parse(json['date']),
      providerId: json['providerId'],
      providerName: json['provider']?['name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'title': title,
      'description': description,
      'date': date.toIso8601String(),
      'providerId': providerId,
    };
  }
}

class Appointment {
  final String id;
  final String patientId;
  final String providerId;
  final DateTime scheduledDate;
  final String status;
  final String? notes;
  final Provider? provider;

  Appointment({
    required this.id,
    required this.patientId,
    required this.providerId,
    required this.scheduledDate,
    required this.status,
    this.notes,
    this.provider,
  });

  String get formattedDate => DateFormat('MMM d, yyyy - h:mm a').format(scheduledDate);

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'],
      patientId: json['patientId'],
      providerId: json['providerId'],
      scheduledDate: DateTime.parse(json['scheduledDate']),
      status: json['status'],
      notes: json['notes'],
      provider: json['provider'] != null ? Provider.fromJson(json['provider']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'providerId': providerId,
      'scheduledDate': scheduledDate.toIso8601String(),
      'status': status,
      'notes': notes,
    };
  }
}

class Provider {
  final String id;
  final String name;
  final String? speciality;
  final String? imageUrl;

  Provider({
    required this.id,
    required this.name,
    this.speciality,
    this.imageUrl,
  });

  factory Provider.fromJson(Map<String, dynamic> json) {
    return Provider(
      id: json['id'],
      name: json['name'],
      speciality: json['speciality'],
      imageUrl: json['imageUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'speciality': speciality,
      'imageUrl': imageUrl,
    };
  }
}
