import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../core/api_client.dart';
import '../core/env.dart';
import '../models/json_utils.dart';
import 'storage_service.dart';

class AuthResult {
  final Map<String, dynamic> user;
  final Map<String, dynamic>? restaurant;
  final Map<String, dynamic>? deliveryProfile;
  final bool isNewUser;
  AuthResult(this.user, this.restaurant, this.deliveryProfile, this.isNewUser);
}

class AuthService {
  final ApiClient _api = ApiClient.instance;

  Future<AuthResult> _handle(dynamic data) async {
    final m = toMap(data);
    await StorageService.instance.saveTokens(toStr(m['accessToken']), toStr(m['refreshToken']));
    return AuthResult(toMap(m['user']), m['restaurant'] == null ? null : toMap(m['restaurant']),
        m['deliveryProfile'] == null ? null : toMap(m['deliveryProfile']), toBool(m['isNewUser']));
  }

  Future<AuthResult> login(String identifier, String password) async =>
      _handle(await _api.post('/auth/login', data: {'identifier': identifier, 'password': password, 'role': Env.role}));

  Future<AuthResult> register({required String name, String? email, String? phone, required String password, String? referralCode, String? language}) async =>
      _handle(await _api.post('/auth/register', data: {
        'name': name,
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'password': password,
        'role': Env.role,
        if (referralCode != null && referralCode.isNotEmpty) 'referralCode': referralCode,
        if (language != null) 'language': language,
      }));

  Future<Map<String, dynamic>> sendOtp(String phone) async => toMap(await _api.post('/auth/send-otp', data: {'phone': phone, 'role': Env.role}));

  Future<AuthResult> verifyOtp(String phone, String otp, {String? name, String? referralCode}) async => _handle(await _api.post('/auth/verify-otp', data: {
        'phone': phone,
        'otp': otp,
        if (name != null) 'name': name,
        if (referralCode != null && referralCode.isNotEmpty) 'referralCode': referralCode,
      }));

  Future<Map<String, dynamic>> forgotPassword(String identifier) async => toMap(await _api.post('/auth/forgot-password', data: {'identifier': identifier}));

  Future<void> resetPassword(String identifier, String code, String password) =>
      _api.post('/auth/reset-password', data: {'identifier': identifier, 'code': code, 'password': password});

  Future<AuthResult?> googleSignIn() async {
    final google = GoogleSignIn(scopes: ['email'], serverClientId: Env.googleServerClientId.isEmpty ? null : Env.googleServerClientId);
    final account = await google.signIn();
    if (account == null) return null;
    final auth = await account.authentication;
    return _handle(await _api.post('/auth/google-signin', data: {'idToken': auth.idToken, 'role': Env.role}));
  }

  Future<AuthResult?> appleSignIn() async {
    final cred = await SignInWithApple.getAppleIDCredential(scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName]);
    final name = [cred.givenName, cred.familyName].whereType<String>().join(' ');
    return _handle(await _api.post('/auth/apple-signin', data: {'identityToken': cred.identityToken, 'name': name, 'role': Env.role}));
  }

  Future<Map<String, dynamic>> me() async => toMap(await _api.get('/auth/me'));

  Future<void> logout({String? fcmToken}) async {
    try {
      await _api.post('/auth/logout', data: {'refreshToken': StorageService.instance.refreshToken, if (fcmToken != null) 'fcmToken': fcmToken});
    } catch (_) {}
    await StorageService.instance.clearTokens();
  }
}
