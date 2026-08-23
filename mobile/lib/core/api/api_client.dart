import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';
import 'api_config.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._();

  late final Dio _dio;
  final _uuid = const Uuid();

  Dio get dio => _dio;

  String newIdempotencyKey() => _uuid.v4();

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic data)? parser,
  }) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      if (parser != null) return parser(response.data);
      return response.data as T;
    } on DioException catch (e) {
      throw mapError(e);
    }
  }

  Future<T> post<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Map<String, dynamic>? headers,
    T Function(dynamic data)? parser,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: headers != null ? Options(headers: headers) : null,
      );
      if (parser != null) return parser(response.data);
      return response.data as T;
    } on DioException catch (e) {
      throw mapError(e);
    }
  }

  void setAuthToken(String? token) {
    if (token == null || token.isEmpty) {
      _dio.options.headers.remove('Authorization');
    } else {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }

  ApiException mapError(DioException e) {
    final status = e.response?.statusCode;
    final data = e.response?.data;
    String message = e.message ?? 'Network error';

    if (data is Map) {
      final detail = data['detail'];
      if (detail is String) {
        message = detail;
      } else if (detail is List && detail.isNotEmpty) {
        final first = detail.first;
        if (first is Map && first['msg'] != null) {
          message = first['msg'].toString();
        } else {
          message = detail.toString();
        }
      } else if (detail != null) {
        message = detail.toString();
      }
    }

    if (status == 400 && message.toLowerCase().contains('incorrect')) {
      message = 'Incorrect email or password';
    } else if (status == 409) {
      message = message.isNotEmpty
          ? message
          : 'Those dates are no longer available. Please pick different dates.';
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      message = 'Connection timed out. Is the API running on ${ApiConfig.baseUrl}?';
    } else if (e.type == DioExceptionType.connectionError) {
      message = 'Cannot reach API at ${ApiConfig.baseUrl}. Check that the server is running.';
    }

    return ApiException(message, statusCode: status);
  }
}
