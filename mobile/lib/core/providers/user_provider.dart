import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../storage/secure_storage.dart';

class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final bool isVerified;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.role = 'TRAVELER',
    this.isVerified = false,
  });

  User copyWith({
    String? id,
    String? name,
    String? email,
    String? role,
    bool? isVerified,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      isVerified: isVerified ?? this.isVerified,
    );
  }
}

class UserState {
  final User? user;
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;

  UserState({
    this.user,
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
  });

  UserState copyWith({
    User? user,
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
    bool clearError = false,
  }) {
    return UserState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final userProvider = StateNotifierProvider<UserNotifier, UserState>((ref) {
  return UserNotifier();
});

class UserNotifier extends StateNotifier<UserState> {
  UserNotifier({AuthApi? authApi})
      : _authApi = authApi ?? AuthApi(),
        super(UserState(isLoading: true)) {
    _checkAuthStatus();
  }

  final AuthApi _authApi;

  Future<void> _checkAuthStatus() async {
    final isAuthenticated = await SecureStorage.isAuthenticated();
    if (!isAuthenticated) {
      state = state.copyWith(isLoading: false, isAuthenticated: false);
      return;
    }

    final token = await SecureStorage.getToken();
    if (token == null || token.isEmpty) {
      state = state.copyWith(isLoading: false, isAuthenticated: false);
      return;
    }

    ApiClient.instance.setAuthToken(token);

    // Prefer a live profile so revoked/inactive accounts lose the session.
    try {
      final me = await _authApi.me(token);
      await SecureStorage.saveUserData(
        token: token,
        userId: me.id,
        name: me.fullName,
        email: me.email,
        isVerified: me.isVerified,
      );
      state = state.copyWith(
        user: User(
          id: me.id,
          name: me.fullName,
          email: me.email,
          role: me.role,
          isVerified: me.isVerified,
        ),
        isAuthenticated: true,
        isLoading: false,
        clearError: true,
      );
    } catch (_) {
      final userData = await SecureStorage.getUserData();
      state = state.copyWith(
        user: User(
          id: userData['userId'] ?? '',
          name: userData['name'] ?? 'Traveler',
          email: userData['email'] ?? '',
          isVerified: userData['isVerified'] ?? false,
        ),
        isAuthenticated: true,
        isLoading: false,
      );
    }
  }

  Future<void> login({
    required String token,
    required String userId,
    required String name,
    required String email,
    String role = 'TRAVELER',
    bool isVerified = false,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      await SecureStorage.saveUserData(
        token: token,
        userId: userId,
        name: name,
        email: email,
        isVerified: isVerified,
      );
      ApiClient.instance.setAuthToken(token);

      state = state.copyWith(
        user: User(
          id: userId,
          name: name,
          email: email,
          role: role,
          isVerified: isVerified,
        ),
        isAuthenticated: true,
        isLoading: false,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Login failed: $e',
      );
      rethrow;
    }
  }

  Future<void> loginWithPassword({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final session = await _authApi.login(email: email, password: password);
      await login(
        token: session.token,
        userId: session.user.id,
        name: session.user.fullName,
        email: session.user.email,
        role: session.user.role,
        isVerified: session.user.isVerified,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String fullName,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final session = await _authApi.registerAndLogin(
        email: email,
        password: password,
        fullName: fullName,
      );
      await login(
        token: session.token,
        userId: session.user.id,
        name: session.user.fullName,
        email: session.user.email,
        role: session.user.role,
        isVerified: session.user.isVerified,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);

    try {
      await SecureStorage.clearAll();
      ApiClient.instance.setAuthToken(null);
      state = state.copyWith(
        user: null,
        isAuthenticated: false,
        isLoading: false,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Logout failed: $e',
      );
    }
  }

  Future<void> updateUser(User updatedUser) async {
    state = state.copyWith(isLoading: true);

    try {
      await SecureStorage.saveUserName(updatedUser.name);
      await SecureStorage.saveUserEmail(updatedUser.email);
      await SecureStorage.saveIsVerified(updatedUser.isVerified);

      state = state.copyWith(
        user: updatedUser,
        isLoading: false,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Update failed: $e',
      );
    }
  }

  void setLoading(bool loading) {
    state = state.copyWith(isLoading: loading);
  }

  void setError(String error) {
    state = state.copyWith(error: error, isLoading: false);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}
