import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api_client.dart';
import '../models/json_utils.dart';
import '../models/restaurant.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';
import '../services/socket_service.dart';
import '../services/storage_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final User? user;
  final Restaurant? restaurant;
  final Map<String, dynamic>? deliveryProfile;
  const AuthState({required this.status, this.user, this.restaurant, this.deliveryProfile});

  bool get isLoggedIn => status == AuthStatus.authenticated;
  String get deliveryStatus => toStr(deliveryProfile?['status']);
  bool get deliveryOnline => toBool(deliveryProfile?['isOnline']);
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState(status: AuthStatus.unknown)) {
    ApiClient.instance.onSessionExpired.listen((_) => _signedOut());
  }

  final AuthService _service = AuthService();
  AuthService get service => _service;

  Future<void> bootstrap() async {
    if (!StorageService.instance.hasSession) {
      state = const AuthState(status: AuthStatus.unauthenticated);
      return;
    }
    try {
      final data = await _service.me();
      _apply(toMap(data['user']), data['restaurant'], data['deliveryProfile']);
    } catch (_) {
      if (StorageService.instance.hasSession) {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    }
  }

  void _apply(Map<String, dynamic> user, dynamic restaurant, dynamic deliveryProfile) {
    state = AuthState(
      status: AuthStatus.authenticated,
      user: User.fromJson(user),
      restaurant: restaurant == null ? null : Restaurant.fromJson(toMap(restaurant)),
      deliveryProfile: deliveryProfile == null ? null : toMap(deliveryProfile),
    );
    SocketService.instance.reconnectWithAuth();
    NotificationService.instance.registerToken();
  }

  Future<void> handleResult(AuthResult r) async => _apply(r.user, r.restaurant, r.deliveryProfile);

  Future<void> refresh() => bootstrap();

  void updateUser(Map<String, dynamic> json) {
    state = AuthState(status: state.status, user: User.fromJson(json), restaurant: state.restaurant, deliveryProfile: state.deliveryProfile);
  }

  void updateRestaurant(Map<String, dynamic> json) {
    state = AuthState(status: state.status, user: state.user, restaurant: Restaurant.fromJson(json), deliveryProfile: state.deliveryProfile);
  }

  void updateDeliveryProfile(Map<String, dynamic> json) {
    state = AuthState(status: state.status, user: state.user, restaurant: state.restaurant, deliveryProfile: json);
  }

  Future<void> logout() async {
    await _service.logout(fcmToken: NotificationService.instance.token);
    _signedOut();
  }

  void _signedOut() {
    SocketService.instance.connect();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());
