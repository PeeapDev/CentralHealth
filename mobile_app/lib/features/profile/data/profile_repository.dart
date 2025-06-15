import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import 'dart:convert';
import '../../../core/services/api_service.dart';
import '../../../core/api/api_constants.dart';
import 'models/user_profile_model.dart';

class ProfileRepository {
  final ApiService _apiService;
  static const String _tag = 'ProfileRepository';
  
  ProfileRepository(this._apiService);
  
  ApiService get apiService => _apiService;

  Future<UserProfile> getUserProfile({required String email}) async {
    try {
      developer.log('$_tag: Fetching user profile for email: $email', level: 1000);
      
      final queryParams = {'email': email};
      developer.log('$_tag: Request to ${ApiConstants.userProfile} with params: $queryParams', level: 1000);
      developer.log('$_tag: Full API URL: ${ApiConstants.baseUrl}${ApiConstants.userProfile}', level: 1000);
      
      final response = await _apiService.get(
        ApiConstants.userProfile,
        queryParameters: queryParams
      );
      
      developer.log('$_tag: Profile API response received: ${response != null ? 'Data received' : 'NULL RESPONSE'}', level: 1000);
      
      if (response == null) {
        developer.log('$_tag: Received null response from API', level: 1000);
        throw Exception('Profile data is null');
      }
      
      developer.log('$_tag: Response content: ${response.toString().substring(0, response.toString().length > 100 ? 100 : response.toString().length)}...', level: 1000);
      
      try {
        final profile = UserProfile.fromJson(response);
        developer.log('$_tag: Profile fetched and parsed successfully: ${profile.id}', level: 1000);
        developer.log('$_tag: Profile medical ID: ${profile.patientId ?? 'Not available'}', level: 1000);
        developer.log('$_tag: Profile name: ${profile.fullName}', level: 1000);
        developer.log('$_tag: Profile image URL: ${profile.profileImageUrl ?? 'No image'}', level: 1000);
        
        return profile;
      } catch (parseError) {
        developer.log('$_tag: Error parsing profile data', error: parseError, level: 1000);
        developer.log('$_tag: Available keys in JSON: ${response is Map ? response.keys.toString() : 'Not a map'}', level: 1000);
        throw Exception('Failed to parse profile data: $parseError');
      }
    } catch (e) {
      developer.log('$_tag: Error fetching user profile', error: e, level: 1000);
      
      if (e is DioException) {
        final dioError = e;
        developer.log(
          '$_tag: DioError: ${dioError.message}, Status: ${dioError.response?.statusCode}', 
          error: e, 
          level: 1000
        );
        
        if (dioError.response != null) {
          developer.log('$_tag: Response data: ${dioError.response!.data.toString().substring(0, dioError.response!.data.toString().length > 100 ? 100 : dioError.response!.data.toString().length)}...', level: 1000);
        }
        
        if (dioError.response?.statusCode == 404) {
          throw Exception('The requested resource was not found. Check if the API endpoint is correct.');
        } else if (dioError.response?.statusCode == 401) {
          throw Exception('Unauthorized access. Please login again.');
        } else if (dioError.response?.statusCode == 500) {
          throw Exception('Server error. Please try again later or contact support.');
        } else if (dioError.type == DioExceptionType.connectionTimeout) {
          throw Exception('Connection timeout. Please check your internet connection.');
        } else {
          throw Exception('Network error: ${dioError.message}');
        }
      }
      
      throw Exception('Failed to load profile: $e');
    }
  }

  Future<UserProfile> updateProfile(String userId, Map<String, dynamic> data) async {
    try {
      developer.log('$_tag: Updating user profile for user $userId', level: 1000);
      developer.log('$_tag: Update data: ${data.keys.toList()}', level: 1000);
      
      _validateProfileData(data);
      
      if (data['role'] == 'patient' && data['patientId'] == null && data['medicalNumber'] == null) {
        developer.log('$_tag: Generating medical ID for patient', level: 1000);
        data['medicalNumber'] = 'PT-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      }
      
      String endpoint = '${ApiConstants.updateUserProfile}?userId=$userId';
      final response = await _apiService.post(
        endpoint,
        data
      );
      
      if (response == null) {
        throw Exception('Received null response after profile update');
      }
      
      developer.log('$_tag: Profile updated successfully. Response received.', level: 1000);
      
      if (response is Map<String, dynamic>) {
        final updatedKeys = response.keys.toList();
        developer.log('$_tag: Updated fields: $updatedKeys', level: 1000);
      }
      
      return UserProfile.fromJson(response);
    } on DioException catch (e) {
      developer.log('$_tag: DioException updating profile - ${e.message}', error: e, level: 1000);
      
      if (e.response != null) {
        developer.log(
          '$_tag: Server response: Status ${e.response!.statusCode}, ' 
          'Data: ${e.response!.data.toString().substring(0, e.response!.data.toString().length > 100 ? 100 : e.response!.data.toString().length)}...', 
          level: 1000
        );
      }
      
      throw _handleDioError(e);
    } catch (e) {
      developer.log('$_tag: Unexpected error updating profile', error: e, level: 1000);
      throw Exception('Failed to update profile: $e');
    }
  }
  
  void _validateProfileData(Map<String, dynamic> data) {
    if (data.containsKey('role') && data['role'] == 'patient') {
      final requiredFields = ['name', 'email'];
      final missingFields = requiredFields.where((field) => !data.containsKey(field)).toList();
      
      if (missingFields.isNotEmpty) {
        developer.log('$_tag: Missing required patient fields: $missingFields', level: 1000);
      }
      
      if (data.containsKey('allergies') && data['allergies'] is String) {
        data['allergies'] = data['allergies']
          .split(',')
          .map((a) => {'name': a.trim(), 'severity': 'Unknown'})
          .toList();
      }
    }
  }

  Future<String?> uploadProfileImage(String userId, String filePath) async {
    try {
      developer.log('$_tag: Uploading profile image');
      
      // Extract filename from path
      final filename = filePath.split('/').last;
      
      // Create form data with proper MultipartFile including filename
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          filePath,
          filename: filename,
        ),
        'userId': userId,
      });
      
      final response = await _apiService.post(
        '${ApiConstants.userProfile}/$userId/image',
        formData
      );
      
      if (response == null || response['imageUrl'] == null) {
        throw Exception('Failed to get image URL from response');
      }
      
      final imageUrl = response['imageUrl'] as String;
      developer.log('$_tag: Profile image uploaded successfully: $imageUrl');
      return imageUrl;
    } on DioException catch (e) {
      developer.log('$_tag: Error uploading profile image - ${e.message}', error: e);
      throw _handleDioError(e);
    } catch (e) {
      developer.log('$_tag: Unexpected error uploading profile image', error: e);
      throw Exception('Failed to upload profile image: $e');
    }
  }

  Future<void> changePassword(String userId, String currentPassword, String newPassword) async {
    try {
      developer.log('$_tag: Changing user password');
      await _apiService.put(
        '${ApiConstants.userProfile}/$userId/password',
        {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
      
      developer.log('$_tag: Password changed successfully');
    } on DioException catch (e) {
      developer.log('$_tag: Error changing password - ${e.message}', error: e);
      throw _handleDioError(e);
    } catch (e) {
      developer.log('$_tag: Unexpected error changing password', error: e);
      throw Exception('Failed to change password: $e');
    }
  }

  Exception _handleDioError(DioException error) {
    if (error.response != null) {
      final statusCode = error.response!.statusCode;
      final responseData = error.response!.data;
      
      switch (statusCode) {
        case 401:
          return Exception('Authentication failed. Please login again.');
        case 403:
          return Exception('You do not have permission to access this resource.');
        case 404:
          return Exception('Profile not found.');
        case 422:
          if (responseData is Map && responseData.containsKey('message')) {
            return Exception(responseData['message']);
          }
          return Exception('Validation error. Please check your inputs.');
        default:
          if (responseData is Map && responseData.containsKey('message')) {
            return Exception(responseData['message']);
          }
      }
    }
    
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return Exception('Connection timeout. Please check your internet connection.');
    }
    
    return Exception('An error occurred. Please try again later.');
  }
}