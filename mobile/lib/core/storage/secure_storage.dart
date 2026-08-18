import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static const String _tokenKey = 'auth_token';
  static const String _userIdKey = 'user_id';
  static const String _userNameKey = 'user_name';
  static const String _userEmailKey = 'user_email';
  static const String _isVerifiedKey = 'is_verified';

  // Token
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  static Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // User Data
  static Future<void> saveUserId(String userId) async {
    await _storage.write(key: _userIdKey, value: userId);
  }

  static Future<String?> getUserId() async {
    return await _storage.read(key: _userIdKey);
  }

  static Future<void> saveUserName(String name) async {
    await _storage.write(key: _userNameKey, value: name);
  }

  static Future<String?> getUserName() async {
    return await _storage.read(key: _userNameKey);
  }

  static Future<void> saveUserEmail(String email) async {
    await _storage.write(key: _userEmailKey, value: email);
  }

  static Future<String?> getUserEmail() async {
    return await _storage.read(key: _userEmailKey);
  }

  static Future<void> saveIsVerified(bool isVerified) async {
    await _storage.write(key: _isVerifiedKey, value: isVerified.toString());
  }

  static Future<bool> getIsVerified() async {
    final value = await _storage.read(key: _isVerifiedKey);
    return value == 'true';
  }

  // Complete User Data
  static Future<void> saveUserData({
    required String token,
    required String userId,
    required String name,
    required String email,
    bool isVerified = false,
  }) async {
    await saveToken(token);
    await saveUserId(userId);
    await saveUserName(name);
    await saveUserEmail(email);
    await saveIsVerified(isVerified);
  }

  static Future<Map<String, dynamic>> getUserData() async {
    return {
      'token': await getToken(),
      'userId': await getUserId(),
      'name': await getUserName(),
      'email': await getUserEmail(),
      'isVerified': await getIsVerified(),
    };
  }

  // Auth Status
  static Future<bool> isAuthenticated() async {
    return await hasToken();
  }

  // Logout / Clear
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  static Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
  }
}