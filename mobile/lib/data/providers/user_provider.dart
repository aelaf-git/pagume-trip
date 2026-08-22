import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserState {
  final String name;
  final String email;
  final bool isAuthenticated;

  const UserState({
    this.name = 'Traveler',
    this.email = 'traveler@email.com',
    this.isAuthenticated = true,
  });

  UserState copyWith({
    String? name,
    String? email,
    bool? isAuthenticated,
  }) {
    return UserState(
      name: name ?? this.name,
      email: email ?? this.email,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class UserNotifier extends Notifier<UserState> {
  @override
  UserState build() {
    return const UserState();
  }

  void logout() {
    state = state.copyWith(
      isAuthenticated: false,
    );
  }
}

final userProvider =
    NotifierProvider<UserNotifier, UserState>(
  UserNotifier.new,
);