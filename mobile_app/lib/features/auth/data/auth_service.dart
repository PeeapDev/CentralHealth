import 'package:shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/config/api_config.dart';
import 'models/auth_models.dart';

class AuthService {
  final ApiClient _apiClient;
  final SharedPreferences _prefs;
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'auth_user';

  AuthService(this._apiClient, this._prefs);

  Future<AuthUser> login(LoginRequest request) async {
    try {
      final response = await _apiClient.post(
        ApiConfig.login,
        data: request.toJson(),
      );

      final user = AuthUser.fromJson(response.data);
      await _saveAuthData(user);
      return user;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<AuthUser> register(RegisterRequest request) async {
    try {
      final response = await _apiClient.post(
        '/api/register/',
        data: request.toJson(),
      );

      final user = AuthUser.fromJson(response.data);
      await _saveAuthData(user);
      return user;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> logout() async {
    await Future.wait([
      _prefs.remove(_tokenKey),
      _prefs.remove(_userKey),
    ]);
  }

  Future<String?> getToken() async {
    return _prefs.getString(_tokenKey);
  }

  Future<AuthUser?> getCurrentUser() async {
    final userJson = _prefs.getString(_userKey);
    if (userJson == null) return null;

    try {
      final userData = Map<String, dynamic>.from(
        await jsonDecode(userJson) as Map,
      );
      return AuthUser.fromJson(userData);
    } catch (e) {
      await logout();
      return null;
    }
  }

  Future<void> _saveAuthData(AuthUser user) async {
    await Future.wait([
      _prefs.setString(_tokenKey, user.accessToken),
      _prefs.setString(_userKey, jsonEncode(user.toJson())),
    ]);
  }

  Exception _handleError(dynamic error) {
    if (error is DioException) {
      final data = error.response?.data;
      final message = data?['error'] ?? 'Authentication failed';
      return Exception(message);
    }
    return Exception('An unexpected error occurred');
  }
}
