import 'dart:io';

class ApiConfig {
  ApiConfig._();

  /// Inventory + booking API (`pagume-api`). Agents chat stays on :8100.
  static String get baseUrl {
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:8000';
      }
    } catch (_) {}
    return 'http://127.0.0.1:8000';
  }

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
