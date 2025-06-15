import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';

import '../../provider/profile_provider.dart';
import '../../data/models/user_profile_model.dart';
import '../widgets/profile_section.dart';
import '../widgets/profile_avatar.dart';
import '../widgets/change_password_dialog.dart';
import '../../../../core/widgets/loading_overlay.dart';
import '../../../../core/widgets/error_widget.dart';

class ProfileScreen extends StatefulWidget {
  final String? userId;
  
  const ProfileScreen({Key? key, this.userId}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ImagePicker _picker = ImagePicker();
  
  @override
  void initState() {
    super.initState();
    // Set context and load profile data when screen is initialized
    Future.microtask(() {
      final profileProvider = Provider.of<ProfileProvider>(context, listen: false);
      profileProvider.setContext(context);
      profileProvider.loadUserProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              Provider.of<ProfileProvider>(context, listen: false).loadUserProfile();
            },
          ),
        ],
      ),
      body: Consumer<ProfileProvider>(
        builder: (context, profileProvider, child) {
          if (profileProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          
          if (profileProvider.status == ProfileStatus.error) {
            return AppErrorWidget(
              errorMessage: profileProvider.errorMessage ?? 'Failed to load profile',
              onRetry: () => profileProvider.loadUserProfile(),
            );
          }
          
          final profile = profileProvider.userProfile;
          if (profile == null) {
            return const Center(child: Text('Profile not available'));
          }
          
          return Stack(
            children: [
              RefreshIndicator(
                onRefresh: () => profileProvider.loadUserProfile(),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        _buildProfileHeader(profile, profileProvider),
                        const SizedBox(height: 24),
                        _buildProfileDetails(profile, profileProvider),
                      ],
                    ),
                  ),
                ),
              ),
              if (profileProvider.isUpdating)
                const LoadingOverlay(message: 'Updating profile...'),
            ],
          );
        },
      ),
    );
  }
  
  Widget _buildProfileHeader(UserProfile profile, ProfileProvider provider) {
    return Column(
      children: [
        ProfileAvatar(
          imageUrl: profile.profileImageUrl,
          name: profile.fullName,
          size: 100,
          onTap: () => _pickImage(provider),
          isUploading: provider.imageUploadInProgress,
        ),
        const SizedBox(height: 8),
        if (provider.imageUploadError != null)
          Text(
            provider.imageUploadError!,
            style: const TextStyle(color: Colors.red, fontSize: 12),
          ),
        const SizedBox(height: 8),
        Text(
          profile.fullName,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        Text(
          profile.role.toUpperCase(),
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Colors.grey[600],
          ),
        ),
        if (profile.department != null) 
          Text(
            profile.department!,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
      ],
    );
  }
  
  Widget _buildProfileDetails(UserProfile profile, ProfileProvider provider) {
    return Column(
      children: [
        ProfileSection(
          title: 'Personal Information',
          children: [
            ListTile(
              leading: const Icon(Icons.email),
              title: const Text('Email'),
              subtitle: Text(profile.email),
              dense: true,
            ),
            if (profile.phoneNumber != null)
              ListTile(
                leading: const Icon(Icons.phone),
                title: const Text('Phone'),
                subtitle: Text(profile.phoneNumber!),
                dense: true,
                trailing: IconButton(
                  icon: const Icon(Icons.edit, size: 20),
                  onPressed: () => _showEditDialog(
                    'Phone Number',
                    profile.phoneNumber ?? '',
                    (value) => provider.updateProfile({'phoneNumber': value}),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        ProfileSection(
          title: 'Account Security',
          children: [
            ListTile(
              leading: const Icon(Icons.lock),
              title: const Text('Password'),
              subtitle: const Text('Change your password'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _showChangePasswordDialog(provider),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (profile.lastLogin != null)
          Text(
            'Last login: ${_formatDateTime(profile.lastLogin!)}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        const SizedBox(height: 32),
      ],
    );
  }
  
  Future<void> _pickImage(ProfileProvider provider) async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 80,
    );
    
    if (image != null) {
      provider.uploadProfileImage(image.path);
    }
  }
  
  Future<void> _showEditDialog(
    String title, 
    String initialValue, 
    Function(String) onSave
  ) async {
    final controller = TextEditingController(text: initialValue);
    
    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Edit $title'),
        content: TextField(
          controller: controller,
          decoration: InputDecoration(
            labelText: title,
            border: const OutlineInputBorder(),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () {
              onSave(controller.text);
              Navigator.of(context).pop();
            },
            child: const Text('SAVE'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _showChangePasswordDialog(ProfileProvider provider) async {
    return showDialog(
      context: context,
      builder: (context) => ChangePasswordDialog(
        onSubmit: (currentPassword, newPassword) async {
          final success = await provider.changePassword(
            currentPassword, 
            newPassword
          );
          
          if (success && mounted) {
            Navigator.of(context).pop();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Password changed successfully')),
            );
          }
          
          return success ?? false; // Ensure a boolean value is returned
        },
        errorMessage: provider.passwordChangeError,
        isLoading: provider.passwordChangeInProgress,
      ),
    );
  }
  
  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}
