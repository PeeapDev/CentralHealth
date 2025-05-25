"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smartphone, Download, Code, Copy } from "lucide-react"
import { toast } from "sonner"

export default function MobileSdkPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const flutterSetup = `
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  shared_preferences: ^2.2.2
  provider: ^6.1.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
`

  const flutterModels = `
// lib/models/user.dart
class User {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String role;
  final Hospital? hospital;

  User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
    this.hospital,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      email: json['email'],
      role: json['role'],
      hospital: json['hospital'] != null ? Hospital.fromJson(json['hospital']) : null,
    );
  }
}

// lib/models/patient.dart
class Patient {
  final String id;
  final String patientId;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final DateTime? dateOfBirth;
  final String? gender;

  Patient({
    required this.id,
    required this.patientId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    this.dateOfBirth,
    this.gender,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'],
      patientId: json['patientId'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      email: json['email'],
      phone: json['phone'],
      dateOfBirth: json['dateOfBirth'] != null ? DateTime.parse(json['dateOfBirth']) : null,
      gender: json['gender'],
    );
  }
}
`

  const flutterProvider = `
// lib/providers/auth_provider.dart
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  String? _token;
  bool _isLoading = false;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null;

  final ApiService _apiService = ApiService();

  Future<void> login(String hospitalSlug, String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.login(hospitalSlug, email, password);
      _token = response['data']['token'];
      _user = User.fromJson(response['data']['user']);
      
      // Save token to local storage
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      
      notifyListeners();
    } catch (e) {
      throw e;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    
    notifyListeners();
  }

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    
    if (_token != null) {
      try {
        final response = await _apiService.getMe();
        _user = User.fromJson(response['data']);
      } catch (e) {
        await logout();
      }
    }
    
    notifyListeners();
  }
}
`

  const flutterScreens = `
// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _hospitalController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Hospital Login')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _hospitalController,
                decoration: InputDecoration(labelText: 'Hospital Slug'),
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(labelText: 'Email'),
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              SizedBox(height: 20),
              Consumer<AuthProvider>(
                builder: (context, auth, child) {
                  return ElevatedButton(
                    onPressed: auth.isLoading ? null : _login,
                    child: auth.isLoading 
                      ? CircularProgressIndicator() 
                      : Text('Login'),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _login() async {
    if (_formKey.currentState?.validate() ?? false) {
      try {
        await Provider.of<AuthProvider>(context, listen: false).login(
          _hospitalController.text,
          _emailController.text,
          _passwordController.text,
        );
        Navigator.pushReplacementNamed(context, '/dashboard');
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login failed: \$e')),
        );
      }
    }
  }
}
`

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="mb-4">
          <Smartphone className="w-3 h-3 mr-1" />
          Mobile SDK
        </Badge>
        <h1 className="text-4xl font-bold">Flutter Mobile SDK</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Complete Flutter SDK for building mobile applications with the Hospital Management System API. Includes
          authentication, data models, and UI components.
        </p>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="providers">State Management</TabsTrigger>
          <TabsTrigger value="screens">UI Screens</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Installation</CardTitle>
                <CardDescription>Add these dependencies to your Flutter project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">pubspec.yaml</h3>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(flutterSetup)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded text-sm overflow-auto">{flutterSetup}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>Get started with the Hospital Management Flutter SDK</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-semibold">1. Install Dependencies</h4>
                      <code className="bg-muted px-3 py-2 rounded block text-sm">flutter pub get</code>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">2. Configure API Base URL</h4>
                      <code className="bg-muted px-3 py-2 rounded block text-sm">lib/config/api_config.dart</code>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">3. Setup Providers</h4>
                      <code className="bg-muted px-3 py-2 rounded block text-sm">main.dart</code>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">4. Run Application</h4>
                      <code className="bg-muted px-3 py-2 rounded block text-sm">flutter run</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Data Models</CardTitle>
              <CardDescription>Flutter data models for API responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">User & Patient Models</h3>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(flutterModels)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">{flutterModels}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>State Management</CardTitle>
              <CardDescription>Provider pattern for managing authentication and app state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Authentication Provider</h3>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(flutterProvider)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">{flutterProvider}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screens">
          <Card>
            <CardHeader>
              <CardTitle>UI Screens</CardTitle>
              <CardDescription>Pre-built Flutter screens for common hospital management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Login Screen Example</h3>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(flutterScreens)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">{flutterScreens}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Download Complete SDK</CardTitle>
          <CardDescription>Get the full Flutter SDK with all components and examples</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download Flutter SDK
            </Button>
            <Button variant="outline">
              <Code className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
