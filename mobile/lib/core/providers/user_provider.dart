import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage.dart';

class User {
  final String id;
  final String name;
  final String email;
  final bool isVerified;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.isVerified = false,
  });

  User copyWith({
    String? id,
    String? name,
    String? email,
    bool? isVerified,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
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
  }) {
    return UserState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error ?? this.error,
    );
  }
}

final userProvider = StateNotifierProvider<UserNotifier, UserState>((ref) {
  return UserNotifier();
});

class UserNotifier extends StateNotifier<UserState> {
  UserNotifier() : super(UserState()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    final isAuthenticated = await SecureStorage.isAuthenticated();
    if (isAuthenticated) {
      final userData = await SecureStorage.getUserData();
      final user = User(
        id: userData['userId'] ?? '',
        name: userData['name'] ?? 'Traveler',
        email: userData['email'] ?? '',
        isVerified: userData['isVerified'] ?? false,
      );
      state = state.copyWith(
        user: user,
        isAuthenticated: true,
        isLoading: false,
      );
    } else {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> login({
    required String token,
    required String userId,
    required String name,
    required String email,
    bool isVerified = false,
  }) async {
    state = state.copyWith(isLoading: true);

    try {
      await SecureStorage.saveUserData(
        token: token,
        userId: userId,
        name: name,
        email: email,
        isVerified: isVerified,
      );

      final user = User(
        id: userId,
        name: name,
        email: email,
        isVerified: isVerified,
      );

      state = state.copyWith(
        user: user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Login failed: $e',
      );
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);

    try {
      await SecureStorage.clearAll();
      state = state.copyWith(
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
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
        error: null,
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
    state = state.copyWith(error: null);
  }
}