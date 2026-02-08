import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/auth_state.dart';

// ─── Secure Storage ─────────────────────────────────────────────────────────
final _storage = const FlutterSecureStorage();

// ─── Access Token (in memory) ───────────────────────────────────────────────
final accessTokenProvider = StateProvider<String?>((ref) => null);

// ─── Auth State ─────────────────────────────────────────────────────────────
final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, AuthUser?>(AuthNotifier.new);

class AuthNotifier extends AsyncNotifier<AuthUser?> {
  @override
  Future<AuthUser?> build() async {
    // Try to restore session from stored refresh token
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) return null;

    try {
      final api = ref.read(apiClientProvider);
      final data = await api.post<Map<String, dynamic>>(
        ApiConstants.refresh,
        body: {'refreshToken': refreshToken},
      );
      final authResponse = AuthResponse.fromJson(data);
      ref.read(accessTokenProvider.notifier).state = authResponse.accessToken;
      await _storage.write(
          key: 'refresh_token', value: authResponse.refreshToken);
      return authResponse.user;
    } catch (_) {
      await _storage.delete(key: 'refresh_token');
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiClientProvider);
      final data = await api.post<Map<String, dynamic>>(
        ApiConstants.login,
        body: {'email': email, 'password': password},
      );
      final authResponse = AuthResponse.fromJson(data);
      ref.read(accessTokenProvider.notifier).state = authResponse.accessToken;
      await _storage.write(
          key: 'refresh_token', value: authResponse.refreshToken);
      return authResponse.user;
    });
  }

  Future<void> register(String email, String password, String name) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiClientProvider);
      final data = await api.post<Map<String, dynamic>>(
        ApiConstants.register,
        body: {'email': email, 'password': password, 'name': name},
      );
      final authResponse = AuthResponse.fromJson(data);
      ref.read(accessTokenProvider.notifier).state = authResponse.accessToken;
      await _storage.write(
          key: 'refresh_token', value: authResponse.refreshToken);
      return authResponse.user;
    });
  }

  Future<void> logout() async {
    ref.read(accessTokenProvider.notifier).state = null;
    await _storage.delete(key: 'refresh_token');
    state = const AsyncData(null);
  }
}
