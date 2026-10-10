import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/formatters.dart';
import '../core/translation_manager.dart';
import '../models/app_config.dart';
import '../services/config_service.dart';
import '../services/socket_service.dart';
import '../services/storage_service.dart';

class ConfigState {
  final AppConfig config;
  final bool loaded;
  final String? error;
  final String language;
  final ThemeMode themeMode;
  final int translationsVersion;

  const ConfigState({
    required this.config,
    required this.loaded,
    this.error,
    required this.language,
    required this.themeMode,
    this.translationsVersion = 0,
  });

  ConfigState copyWith(
          {AppConfig? config, bool? loaded, String? error, bool clearError = false, String? language, ThemeMode? themeMode, int? translationsVersion}) =>
      ConfigState(
        config: config ?? this.config,
        loaded: loaded ?? this.loaded,
        error: clearError ? null : (error ?? this.error),
        language: language ?? this.language,
        themeMode: themeMode ?? this.themeMode,
        translationsVersion: translationsVersion ?? this.translationsVersion,
      );
}

/// Owns the remote configuration + active language. Reloads live on `config:updated`.
class ConfigNotifier extends StateNotifier<ConfigState> {
  ConfigNotifier() : super(ConfigState(config: AppConfig.empty(), loaded: false, language: '', themeMode: ThemeMode.system)) {
    _sub = SocketService.instance.on('config:updated').listen((_) => load(silent: true));
  }

  final _service = ConfigService();
  StreamSubscription? _sub;

  Future<void> load({bool silent = false}) async {
    try {
      final cfg = await _service.load();
      Fmt.attach(cfg.businessRules);
      final storage = StorageService.instance;
      var lang = storage.language ?? cfg.defaultLanguage;
      if (cfg.languages.isNotEmpty && !cfg.languages.contains(lang)) lang = cfg.defaultLanguage;
      final tr = await _service.loadTranslations(lang);
      TranslationManager.instance.load(tr.code, tr.strings, rtl: tr.rtl);
      state = state.copyWith(
        config: cfg,
        loaded: true,
        clearError: true,
        language: lang,
        themeMode: _themeModeFrom(storage.themeMode, cfg.theme.darkModeDefault),
        translationsVersion: state.translationsVersion + 1,
      );
    } catch (e) {
      if (!silent) state = state.copyWith(error: e.toString(), loaded: state.loaded);
    }
  }

  ThemeMode _themeModeFrom(String? stored, bool darkDefault) {
    switch (stored) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      case 'system':
        return ThemeMode.system;
      default:
        return darkDefault ? ThemeMode.dark : ThemeMode.light;
    }
  }

  Future<void> setLanguage(String code) async {
    await StorageService.instance.setLanguage(code);
    final tr = await _service.loadTranslations(code);
    TranslationManager.instance.load(tr.code, tr.strings, rtl: tr.rtl);
    state = state.copyWith(language: code, translationsVersion: state.translationsVersion + 1);
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    await StorageService.instance.setThemeMode(mode.name);
    state = state.copyWith(themeMode: mode);
  }

  void trackBanner(String id) => _service.trackBannerClick(id);

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}

final configProvider = StateNotifierProvider<ConfigNotifier, ConfigState>((ref) => ConfigNotifier());

/// Convenience selectors.
final appConfigProvider = Provider<AppConfig>((ref) => ref.watch(configProvider).config);
final featureProvider = Provider.family<bool, String>((ref, key) => ref.watch(appConfigProvider).feature(key));
final businessRulesProvider = Provider<BusinessRules>((ref) => ref.watch(appConfigProvider).businessRules);
