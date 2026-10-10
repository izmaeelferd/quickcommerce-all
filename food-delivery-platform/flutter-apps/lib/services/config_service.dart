import '../core/api_client.dart';
import '../models/app_config.dart';
import '../models/json_utils.dart';
import 'storage_service.dart';

/// Fetches /api/config and translations, with offline cache fallback.
class ConfigService {
  final ApiClient _api = ApiClient.instance;
  final StorageService _storage = StorageService.instance;

  Future<AppConfig> load() async {
    try {
      final data = toMap(await _api.get('/config'));
      await _storage.cacheConfig(data);
      return AppConfig.fromJson(data);
    } catch (e) {
      final cached = _storage.cachedConfig;
      if (cached != null) return AppConfig.fromJson(cached);
      rethrow;
    }
  }

  Future<({String code, bool rtl, Map<String, String> strings})> loadTranslations(String lang) async {
    try {
      final data = toMap(await _api.get('/config/translations/$lang'));
      final strings = toMap(data['strings']).map((k, v) => MapEntry(k, v.toString()));
      await _storage.cacheTranslations(lang, strings);
      return (code: toStr(data['code'], lang), rtl: toBool(data['isRTL']), strings: strings);
    } catch (e) {
      final cached = _storage.cachedTranslations(lang);
      if (cached != null) return (code: lang, rtl: false, strings: cached);
      return (code: lang, rtl: false, strings: <String, String>{});
    }
  }

  Future<void> trackBannerClick(String id) async {
    try {
      await _api.post('/config/banners/$id/click');
    } catch (_) {}
  }
}
