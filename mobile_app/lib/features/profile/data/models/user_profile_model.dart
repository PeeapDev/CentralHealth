import 'dart:convert';

class UserProfile {
  final String id;
  final String email;
  final Map<String, dynamic> name;
  final String role;
  final String? profileImageUrl;
  final String? phoneNumber;
  final String? department;
  final Map<String, dynamic>? settings;
  final DateTime? lastLogin;
  
  // Patient specific identifiers
  final String? patientId;      // Medical ID
  final String? hospitalCode;   // Hospital code
  
  // Health information
  final String? height;
  final String? weight;
  final String? bloodType;
  final String? dob;
  final String? gender;
  final List<Map<String, dynamic>>? allergies;
  final List<Map<String, dynamic>>? conditions;
  final List<Map<String, dynamic>>? medications;
  
  UserProfile({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.profileImageUrl,
    this.phoneNumber,
    this.department,
    this.settings,
    this.lastLogin,
    this.patientId,
    this.hospitalCode,
    this.height,
    this.weight,
    this.bloodType,
    this.dob,
    this.gender,
    this.allergies,
    this.conditions,
    this.medications,
  });
  
  // Helper getters for name
  String get firstName => name['firstName'] ?? '';
  String get lastName => name['lastName'] ?? '';
  String get fullName => [firstName, lastName].where((n) => n.isNotEmpty).join(' ');
  
  factory UserProfile.fromJson(Map<String, dynamic> json) {
    // Handle allergies - convert to List<Map<String, dynamic>>
    List<Map<String, dynamic>>? allergiesList;
    if (json['allergies'] != null) {
      allergiesList = List<Map<String, dynamic>>.from(
        (json['allergies'] as List).map((item) => 
          item is Map<String, dynamic> ? item : {'name': item.toString(), 'severity': 'Unknown'}
        )
      );
    }
    
    // Handle conditions - convert to List<Map<String, dynamic>>
    List<Map<String, dynamic>>? conditionsList;
    if (json['conditions'] != null) {
      conditionsList = List<Map<String, dynamic>>.from(
        (json['conditions'] as List).map((item) => 
          item is Map<String, dynamic> ? item : {'name': item.toString()}
        )
      );
    }
    
    // Handle medications - convert to List<Map<String, dynamic>>
    List<Map<String, dynamic>>? medicationsList;
    if (json['medications'] != null) {
      medicationsList = List<Map<String, dynamic>>.from(
        (json['medications'] as List).map((item) => 
          item is Map<String, dynamic> ? item : {'name': item.toString()}
        )
      );
    }
    
    return UserProfile(
      id: json['id'],
      email: json['email'],
      name: json['name'] is String 
          ? {'firstName': json['name'], 'lastName': ''} 
          : json['name'] ?? {'firstName': '', 'lastName': ''},
      role: json['role'] ?? 'user',
      profileImageUrl: json['profileImageUrl'],
      phoneNumber: json['phoneNumber'],
      department: json['department'],
      settings: json['settings'],
      lastLogin: json['lastLogin'] != null 
          ? DateTime.parse(json['lastLogin']) 
          : null,
      // Patient specific identifiers
      patientId: json['patientId'] ?? json['medicalNumber'],  // Support both field names
      hospitalCode: json['hospitalCode'],
      // Health information
      height: json['height']?.toString(),
      weight: json['weight']?.toString(),
      bloodType: json['bloodType']?.toString(),
      dob: json['dob']?.toString(),
      gender: json['gender']?.toString(),
      allergies: allergiesList,
      conditions: conditionsList,
      medications: medicationsList,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'profileImageUrl': profileImageUrl,
      'phoneNumber': phoneNumber,
      'department': department,
      'settings': settings,
      'lastLogin': lastLogin?.toIso8601String(),
      'patientId': patientId,
      'hospitalCode': hospitalCode,
      'height': height,
      'weight': weight,
      'bloodType': bloodType,
      'dob': dob,
      'gender': gender,
      'allergies': allergies,
      'conditions': conditions,
      'medications': medications,
    };
  }
  
  UserProfile copyWith({
    String? id,
    String? email,
    Map<String, dynamic>? name,
    String? role,
    String? profileImageUrl,
    String? phoneNumber,
    String? department,
    Map<String, dynamic>? settings,
    DateTime? lastLogin,
    String? patientId,
    String? hospitalCode,
    String? height,
    String? weight,
    String? bloodType,
    String? dob,
    String? gender,
    List<Map<String, dynamic>>? allergies,
    List<Map<String, dynamic>>? conditions,
    List<Map<String, dynamic>>? medications,
  }) {
    return UserProfile(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      department: department ?? this.department,
      settings: settings ?? this.settings,
      lastLogin: lastLogin ?? this.lastLogin,
      patientId: patientId ?? this.patientId,
      hospitalCode: hospitalCode ?? this.hospitalCode,
      height: height ?? this.height,
      weight: weight ?? this.weight,
      bloodType: bloodType ?? this.bloodType,
      dob: dob ?? this.dob,
      gender: gender ?? this.gender,
      allergies: allergies ?? this.allergies,
      conditions: conditions ?? this.conditions,
      medications: medications ?? this.medications,
    );
  }
  
  @override
  String toString() {
    return 'UserProfile(id: $id, email: $email, name: $name, role: $role)';
  }
}
