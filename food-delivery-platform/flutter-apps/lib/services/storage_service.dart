import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Tokens go to secure storage; preferences and caches go to SharedPreferences.
class StorageService {
  StorageService._();
  static final StorageService instance = StorageService._();

  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';
  static const _configCacheKey = 'config_cache';
  static const _languageKey = 'language';
  static const _themeModeKey = 'theme_mode';
  static const _onboardingKey = 'onboarding_done';

  final FlutterSecureStorage _secure = const FlutterSecureStorage();
  late SharedPreferences _prefs;

  String? _accessToken;
  String? _refreshToken;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _accessToken = await _secure.read(key: _accessKey);
    _refreshToken = await _secure.read(key: _refreshKey);
  }

  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  bool get hasSession => _accessToken != null && _accessToken!.isNotEmpty;

  Future<void> saveTokens(String access, String refresh) async {
    _accessToken = access;
    _refreshToken = refresh;
    await _secure.write(key: _accessKey, value: access);
    await _secure.write(key: _refreshKey, value: refresh);
  }

  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    await _secure.delete(key: _accessKey);
    await _secure.delete(key: _refreshKey);
  }

  Map<String, dynamic>? get cachedConfig {
    final raw = _prefs.getString(_configCacheKey);
    if (raw == null) return null;
    try {
      return Map<String, dynamic>.from(jsonDecode(raw) as Map);
    } catch (_) {
      return null;
    }
  }

  Future<void> cacheConfig(Map<String, dynamic> json) => _prefs.setString(_configCacheKey, jsonEncode(json));

  Map<String, String>? cachedTranslations(String lang) {
    final raw = _prefs.getString('tr_$lang');
    if (raw == null) return null;
    try {
      return Map<String, String>.from(jsonDecode(raw) as Map);
    } catch (_) {
      return null;
    }
  }

  Future<void> cacheTranslations(String lang, Map<String, String> strings) => _prefs.setString('tr_$lang', jsonEncode(strings));

  String? get language => _prefs.getString(_languageKey);
  Future<void> setLanguage(String code) => _prefs.setString(_languageKey, code);

  /// 'system' | 'light' | 'dark' | null (null => use config.theme.darkModeDefault)
  String? get themeMode => _prefs.getString(_themeModeKey);
  Future<void> setThemeMode(String mode) => _prefs.setString(_themeModeKey, mode);

  bool get onboardingDone => _prefs.getBool(_onboardingKey) ?? false;
  Future<void> setOnboardingDone() => _prefs.setBool(_onboardingKey, true);
}
