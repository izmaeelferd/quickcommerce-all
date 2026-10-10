import 'package:intl/intl.dart';

import '../models/app_config.dart';
import 'translation_manager.dart';

/// Money and date formatting driven by businessRules (currency) and the active language.
class Fmt {
  static BusinessRules? _rules;
  static void attach(BusinessRules rules) => _rules = rules;

  static String money(num? v, {int decimals = 2}) {
    final symbol = _rules?.currencySymbol ?? '';
    final value = (v ?? 0).toDouble();
    final d = value == value.roundToDouble() ? 0 : decimals;
    final f = NumberFormat.decimalPatternDigits(locale: _locale, decimalDigits: d);
    return '$symbol${f.format(value)}';
  }

  static String date(DateTime? d) => d == null ? '' : DateFormat.yMMMd(_locale).format(d);
  static String time(DateTime? d) => d == null ? '' : DateFormat.jm(_locale).format(d);
  static String dateTime(DateTime? d) => d == null ? '' : '${date(d)}, ${time(d)}';
  static String km(num? v) => tr('common.km', {'value': (v ?? 0).toStringAsFixed(1)});
  static String minutes(num? v) => tr('common.minutes', {'value': v ?? 0});

  static String get _locale {
    final c = TranslationManager.instance.code;
    try {
      return Intl.verifiedLocale(c.isEmpty ? 'en' : c, NumberFormat.localeExists, onFailure: (_) => 'en') ?? 'en';
    } catch (_) {
      return 'en';
    }
  }
}
