import 'package:dio/dio.dart';

import 'api_client.dart';

class AuthUser {
  final String id;
  final String email;
  final String fullName;
  final String role;
  final bool isActive;
  final bool isVerified;

  const AuthUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.isActive,
    required this.isVerified,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'].toString(),
      email: (json['email'] ?? '') as String,
      fullName: (json['full_name'] as String?)?.trim().isNotEmpty == true
          ? json['full_name'] as String
          : 'Traveler',
      role: (json['role'] ?? 'TRAVELER') as String,
      isActive: json['is_active'] as bool? ?? true,
      isVerified: json['is_verified'] as bool? ?? false,
    );
  }
}

class AuthSession {
  final String token;
  final AuthUser user;

  const AuthSession({required this.token, required this.user});
}

/// Portal auth against `/api/v1/auth/*` (bcrypt passwords + JWT).
class AuthApi {
  AuthApi({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

  final Dio _dio;

  static const _authPrefix = '/api/v1/auth';

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '$_authPrefix/login',
        data: {
          'username': email.trim(),
          'password': password,
        },
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
          headers: {'Accept': 'application/json'},
        ),
      );
      final token = response.data['access_token'] as String?;
      if (token == null || token.isEmpty) {
        throw ApiException('Login succeeded but no access token was returned.');
      }
      final user = await me(token);
      return AuthSession(token: token, user: user);
    } on DioException catch (e) {
      throw ApiClient.instance.mapError(e);
    }
  }

  Future<AuthUser> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    if (password.length < 8) {
      throw ApiException('Password must be at least 8 characters.');
    }
    if (fullName.trim().length < 2) {
      throw ApiException('Please enter your full name.');
    }
    try {
      final response = await _dio.post(
        '$_authPrefix/register',
        data: {
          'email': email.trim(),
          'password': password,
          'full_name': fullName.trim(),
          'role': 'TRAVELER',
        },
      );
      return AuthUser.fromJson(Map<String, dynamic>.from(response.data as Map));
    } on DioException catch (e) {
      throw ApiClient.instance.mapError(e);
    }
  }

  /// Register a traveler, then log in so the app stores a real JWT.
  Future<AuthSession> registerAndLogin({
    required String email,
    required String password,
    required String fullName,
  }) async {
    await register(email: email, password: password, fullName: fullName);
    return login(email: email, password: password);
  }

  Future<AuthUser> me(String token) async {
    try {
      final response = await _dio.get(
        '$_authPrefix/me',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
      return AuthUser.fromJson(Map<String, dynamic>.from(response.data as Map));
    } on DioException catch (e) {
      throw ApiClient.instance.mapError(e);
    }
  }
}
