import 'package:flutter/widgets.dart';

/// Holds the active language's strings (downloaded from /api/config/translations/:lang).
/// No UI string is compiled into the app — only keys.
class TranslationManager {
  TranslationManager._();
  static final TranslationManager instance = TranslationManager._();

  Map<String, String> _strings = {};
  String _code = '';
  bool _rtl = false;

  String get code => _code;
  bool get isRtl => _rtl;
  TextDirection get direction => _rtl ? TextDirection.rtl : TextDirection.ltr;

  void load(String code, Map<String, String> strings, {bool rtl = false}) {
    _code = code;
    _strings = strings;
    _rtl = rtl;
  }

  bool has(String key) => _strings.containsKey(key) && _strings[key]!.isNotEmpty;

  /// Resolves [key] and interpolates `{var}` placeholders.
  /// Missing keys render as a humanised version of the key's last segment so
  /// the UI never shows blank text while translations are being completed.
  String tr(String key, [Map<String, Object?> vars = const {}]) {
    var value = _strings[key];
    if (value == null || value.isEmpty) value = _humanize(key);
    if (vars.isEmpty) return value;
    return value.replaceAllMapped(RegExp(r'\{(\w+)\}'), (m) => vars.containsKey(m[1]) ? '${vars[m[1]]}' : m[0]!);
  }

  String _humanize(String key) {
    final last = key.split('.').last;
    final spaced = last.replaceAllMapped(RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]} ${m[2]}').replaceAll('_', ' ');
    return spaced.isEmpty ? key : spaced[0].toUpperCase() + spaced.substring(1);
  }
}

/// Short global accessor: `tr('home.title')`.
String tr(String key, [Map<String, Object?> vars = const {}]) => TranslationManager.instance.tr(key, vars);
