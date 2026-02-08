import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/api_constants.dart';
import 'auth_interceptor.dart';
import 'error_interceptor.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.addAll([
    AuthInterceptor(ref),
    ErrorInterceptor(),
    LogInterceptor(requestBody: true, responseBody: true),
  ]);

  return dio;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(dioProvider));
});

/// Thin wrapper around Dio for typed API calls.
class ApiClient {
  final Dio _dio;

  ApiClient(this._dio);

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    final response = await _dio.get(path, queryParameters: queryParameters);
    final data = response.data['data'] ?? response.data;
    return fromJson != null ? fromJson(data) : data as T;
  }

  Future<T> post<T>(
    String path, {
    dynamic body,
    T Function(dynamic)? fromJson,
  }) async {
    final response = await _dio.post(path, data: body);
    final data = response.data['data'] ?? response.data;
    return fromJson != null ? fromJson(data) : data as T;
  }

  Future<T> patch<T>(
    String path, {
    dynamic body,
    T Function(dynamic)? fromJson,
  }) async {
    final response = await _dio.patch(path, data: body);
    final data = response.data['data'] ?? response.data;
    return fromJson != null ? fromJson(data) : data as T;
  }
}
