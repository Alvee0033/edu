import 'package:dio/dio.dart';

/// Convert Dio errors to readable app exceptions.
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final message = _extractMessage(err);
    handler.next(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: message,
        message: message,
      ),
    );
  }

  String _extractMessage(DioException err) {
    try {
      final data = err.response?.data;
      if (data is Map && data.containsKey('message')) {
        final msg = data['message'];
        return msg is List ? msg.join(', ') : msg.toString();
      }
    } catch (_) {}
    return err.message ?? 'An unexpected error occurred';
  }
}
