import 'dart:developer' as developer;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../auth/data/auth_service.dart';
import '../auth/data/auth_debug.dart';
import '../profile/provider/profile_provider.dart';
import '../../core/storage/secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DebugViewScreen extends StatefulWidget {
  const DebugViewScreen({Key? key}) : super(key: key);

  @override
  State<DebugViewScreen> createState() => _DebugViewScreenState();
}

class _DebugViewScreenState extends State<DebugViewScreen> {
  final _emailController = TextEditingController();
  String _authStatus = 'Checking...';
  String _emailStatus = 'Checking...';
  String _tokenStatus = 'Checking...';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadDebugInfo();
  }

  Future<void> _loadDebugInfo() async {
    setState(() => _isLoading = true);
    
    final authService = Provider.of<AuthService>(context, listen: false);
    final secureStorage = SecureStorage();
    
    try {
      // Check authentication status
      final isAuth = await authService.isAuthenticated();
      _authStatus = isAuth ? 'Authenticated' : 'Not authenticated';
      
      // Check stored email
      final email = await authService.getCurrentUserEmail();
      _emailStatus = email != null ? 'Email: $email' : 'No email found';
      
      // Check token
      final token = await secureStorage.getAccessToken();
      _tokenStatus = token != null ? 'Token exists (${token.substring(0, 10)}...)' : 'No token found';
    } catch (e) {
      developer.log('Debug view error: $e');
    }
    
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _setTestEmail() async {
    if (_emailController.text.isEmpty) return;
    
    setState(() => _isLoading = true);
    
    final prefs = await SharedPreferences.getInstance();
    final secureStorage = SecureStorage();
    final authDebugTools = AuthDebugTools(secureStorage, prefs);
    
    try {
      await authDebugTools.setTestEmail(_emailController.text);
      await authDebugTools.setTestToken();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Test email set to: ${_emailController.text}')),
      );
    } catch (e) {
      developer.log('Error setting test email: $e');
    }
    
    await _loadDebugInfo();
  }

  Future<void> _forceReloadProfile() async {
    setState(() => _isLoading = true);
    
    try {
      final profileProvider = Provider.of<ProfileProvider>(context, listen: false);
      final authService = Provider.of<AuthService>(context, listen: false);
      
      // Set context on provider
      profileProvider.setContext(context);
      
      // Get current email
      final email = await authService.getCurrentUserEmail();
      if (email != null) {
        await profileProvider.loadUserProfile(email);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Profile reloaded for: $email')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No email found to reload profile')),
        );
      }
    } catch (e) {
      developer.log('Error forcing profile reload: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
    
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Debug View'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Auth Status: $_authStatus', 
                            style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text('Email Status: $_emailStatus'),
                          const SizedBox(height: 8),
                          Text('Token Status: $_tokenStatus'),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  const Text('Set Test Email', 
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _emailController,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      hintText: 'Enter email (e.g. patient@example.com)',
                    ),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: _setTestEmail,
                    child: const Text('Set Test Email & Token'),
                  ),
                  
                  const SizedBox(height: 24),
                  const Text('Profile Actions', 
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: _forceReloadProfile,
                    child: const Text('Force Reload Profile'),
                  ),
                  
                  const SizedBox(height: 24),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () {
                      _loadDebugInfo();
                    },
                    child: const Text('Refresh Debug Info'),
                  ),
                ],
              ),
            ),
    );
  }
}
