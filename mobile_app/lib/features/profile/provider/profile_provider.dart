import 'package:flutter/foundation.dart';
import 'dart:io';
import 'package:flutter/widgets.dart';
import 'package:provider/provider.dart';
import '../data/profile_repository.dart';
import '../data/models/user_profile_model.dart';
import '../../../features/auth/data/auth_service.dart';
import 'dart:developer' as developer;

enum ProfileStatus {
  initial,
  loading,
  loaded,
  error,
  updating,
  updateSuccess,
  updateError,
}

class ProfileProvider extends ChangeNotifier {
  final ProfileRepository _repository;
  
  // Constructor to accept ProfileRepository through dependency injection
  ProfileProvider({required ProfileRepository repository}) : _repository = repository;
  
  ProfileStatus _status = ProfileStatus.initial;
  UserProfile? _userProfile;
  String? _errorMessage;
  bool _passwordChangeInProgress = false;
  String? _passwordChangeError;
  bool _imageUploadInProgress = false;
  String? _imageUploadError;
  
  // Getters
  ProfileStatus get status => _status;
  UserProfile? get userProfile => _userProfile;
  String? get errorMessage => _errorMessage;
  bool get passwordChangeInProgress => _passwordChangeInProgress;
  String? get passwordChangeError => _passwordChangeError;
  bool get imageUploadInProgress => _imageUploadInProgress;
  String? get imageUploadError => _imageUploadError;
  bool get isLoading => _status == ProfileStatus.loading;
  bool get isUpdating => _status == ProfileStatus.updating;
  
  // The BuildContext for getting dependencies
  BuildContext? _context;
  
  // Method to set context (call this from initState in StatefulWidget)
  void setContext(BuildContext context) {
    _context = context;
  }
  
  // Load user profile
  Future<UserProfile?> loadUserProfile([String? emailOverride]) async {
    // Use microtask to schedule state updates after the current build phase
    Future.microtask(() {
      _status = ProfileStatus.loading;
      _errorMessage = null;
      notifyListeners();
    });
    
    try {
      String? userEmail = emailOverride;
      
      // If no email provided and we have a context, try to get email from AuthService
      if (userEmail == null && _context != null) {
        final authService = Provider.of<AuthService>(_context!, listen: false);
        userEmail = await authService.getCurrentUserEmail();
      }
      
      // If still no email, use a test email
      userEmail = userEmail ?? 'patient@example.com'; // Fallback for testing
      
      developer.log('ProfileProvider: Loading profile for email: $userEmail');
      final profile = await _repository.getUserProfile(email: userEmail);
      _userProfile = profile;
      _status = ProfileStatus.loaded;
      developer.log('ProfileProvider: Profile loaded successfully: ${profile.email}');
    } catch (e) {
      _status = ProfileStatus.error;
      _errorMessage = e.toString();
      developer.log('ProfileProvider: Error loading profile', error: e);
    }
    
    // Schedule UI update after build phase
    Future.microtask(() => notifyListeners());
    return _userProfile; // Return the loaded user profile
  }
  
  // Update user profile
  Future<void> updateProfile(Map<String, dynamic> data) async {
    if (_userProfile == null) {
      _errorMessage = 'Cannot update profile: Profile not loaded';
      Future.microtask(() => notifyListeners());
      return;
    }
    
    // Schedule state updates after current build phase
    Future.microtask(() {
      _status = ProfileStatus.updating;
      _errorMessage = null;
      notifyListeners();
    });
    
    try {
      final updatedProfile = await _repository.updateProfile(_userProfile!.id, data);
      _userProfile = updatedProfile;
      // Update state safely after build phase
      Future.microtask(() {
        _status = ProfileStatus.updateSuccess;
        notifyListeners();
      });
      developer.log('ProfileProvider: Profile updated successfully');
    } catch (e) {
      // Update error state safely after build phase
      Future.microtask(() {
        _status = ProfileStatus.updateError;
        _errorMessage = e.toString();
        notifyListeners();
      });
      developer.log('ProfileProvider: Error updating profile', error: e);
    }
  }
  
  // Upload profile image
  Future<String?> uploadProfileImage(String filePath) async {
    if (_userProfile == null) {
      Future.microtask(() {
        _imageUploadError = 'Cannot upload image: Profile not loaded';
        notifyListeners();
      });
      return null;
    }
    
    Future.microtask(() {
      _imageUploadInProgress = true;
      _imageUploadError = null;
      notifyListeners();
    });
    
    try {
      final imageUrl = await _repository.uploadProfileImage(
        _userProfile!.id, 
        filePath
      );
      
      if (imageUrl != null) {
        // Update the profile with the new image URL
        _userProfile = _userProfile!.copyWith(profileImageUrl: imageUrl);
      }
      
      Future.microtask(() {
        _imageUploadInProgress = false;
        _imageUploadError = null;
        notifyListeners();
      });
      
      developer.log('ProfileProvider: Profile image uploaded successfully');
      return imageUrl;
    } catch (e) {
      Future.microtask(() {
        _imageUploadInProgress = false;
        _imageUploadError = e.toString();
        notifyListeners();
      });
      
      developer.log('ProfileProvider: Error uploading profile image', error: e);
      return null;
    }
  }
  
  // Change password
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    if (_userProfile == null) {
      Future.microtask(() {
        _passwordChangeError = 'Cannot change password: Profile not loaded';
        notifyListeners();
      });
      return false;
    }
    
    Future.microtask(() {
      _passwordChangeInProgress = true;
      _passwordChangeError = null;
      notifyListeners();
    });
    
    try {
      await _repository.changePassword(
        _userProfile!.id, 
        currentPassword, 
        newPassword
      );
      
      Future.microtask(() {
        _passwordChangeInProgress = false;
        _passwordChangeError = null;
        notifyListeners();
      });
      developer.log('ProfileProvider: Password changed successfully');
      return true;
    } catch (e) {
      Future.microtask(() {
        _passwordChangeInProgress = false;
        _passwordChangeError = e.toString();
        notifyListeners();
      });
      developer.log('ProfileProvider: Error changing password', error: e);
      return false;
    }
  }
  
  // Reset update status
  void resetUpdateStatus() {
    if (_status == ProfileStatus.updateSuccess || _status == ProfileStatus.updateError) {
      _status = ProfileStatus.loaded;
      notifyListeners();
    }
  }
  
  // Reset password change status
  void resetPasswordChangeStatus() {
    _passwordChangeError = null;
    notifyListeners();
  }
  
  // Reset image upload status
  void resetImageUploadStatus() {
    _imageUploadError = null;
    notifyListeners();
  }
  
  // Clear profile data (for logout)
  void clearProfile() {
    _userProfile = null;
    _status = ProfileStatus.initial;
    _errorMessage = null;
    _passwordChangeInProgress = false;
    _passwordChangeError = null;
    _imageUploadInProgress = false;
    _imageUploadError = null;
    notifyListeners();
  }
}
