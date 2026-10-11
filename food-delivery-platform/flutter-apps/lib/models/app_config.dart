import 'banner.dart';
import 'category.dart';
import 'json_utils.dart';
import 'widget_section.dart';

class ThemeConfig {
  final String primaryColor, secondaryColor, accentColor, backgroundColor, surfaceColor, textColor;
  final String successColor, warningColor, errorColor, vegColor, nonVegColor;
  final bool darkModeDefault;
  final String fontFamily;
  final double appFontScale, buttonRadius, cardRadius, inputRadius;
  final String appIconUrl, splashLogoUrl, splashBackgroundColor;
  final int splashDuration;

  const ThemeConfig({
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.backgroundColor,
    required this.surfaceColor,
    required this.textColor,
    required this.successColor,
    required this.warningColor,
    required this.errorColor,
    required this.vegColor,
    required this.nonVegColor,
    required this.darkModeDefault,
    required this.fontFamily,
    required this.appFontScale,
    required this.buttonRadius,
    required this.cardRadius,
    required this.inputRadius,
    required this.appIconUrl,
    required this.splashLogoUrl,
    required this.splashBackgroundColor,
    required this.splashDuration,
  });

  /// Neutral fallbacks used only until /api/config responds.
  factory ThemeConfig.fromJson(Map<String, dynamic> j) => ThemeConfig(
        primaryColor: toStr(j['primaryColor'], '#5C6BC0'),
        secondaryColor: toStr(j['secondaryColor'], '#263238'),
        accentColor: toStr(j['accentColor'], '#FFB300'),
        backgroundColor: toStr(j['backgroundColor'], '#FFFFFF'),
        surfaceColor: toStr(j['surfaceColor'], '#F5F5F5'),
        textColor: toStr(j['textColor'], '#212121'),
        successColor: toStr(j['successColor'], '#2E7D32'),
        warningColor: toStr(j['warningColor'], '#F9A825'),
        errorColor: toStr(j['errorColor'], '#C62828'),
        vegColor: toStr(j['vegColor'], '#2E7D32'),
        nonVegColor: toStr(j['nonVegColor'], '#C62828'),
        darkModeDefault: toBool(j['darkModeDefault']),
        fontFamily: toStr(j['fontFamily'], 'Roboto'),
        appFontScale: toDouble(j['appFontScale'], 1),
        buttonRadius: toDouble(j['buttonRadius'], 8),
        cardRadius: toDouble(j['cardRadius'], 12),
        inputRadius: toDouble(j['inputRadius'], 8),
        appIconUrl: toStr(j['appIconUrl']),
        splashLogoUrl: toStr(j['splashLogoUrl']),
        splashBackgroundColor: toStr(j['splashBackgroundColor'], toStr(j['primaryColor'], '#5C6BC0')),
        splashDuration: toInt(j['splashDuration'], 1500),
      );
}

class BrandingConfig {
  final String appName, appTagline, vendorAppName, deliveryAppName;
  final String supportEmail, supportPhone, websiteUrl, whatsappNumber, address, copyright;
  final Map<String, String> socialLinks;

  const BrandingConfig({
    required this.appName,
    required this.appTagline,
    required this.vendorAppName,
    required this.deliveryAppName,
    required this.supportEmail,
    required this.supportPhone,
    required this.websiteUrl,
    required this.whatsappNumber,
    required this.address,
    required this.copyright,
    required this.socialLinks,
  });

  factory BrandingConfig.fromJson(Map<String, dynamic> j) => BrandingConfig(
        appName: toStr(j['appName']),
        appTagline: toStr(j['appTagline']),
        vendorAppName: toStr(j['vendorAppName'], toStr(j['appName'])),
        deliveryAppName: toStr(j['deliveryAppName'], toStr(j['appName'])),
        supportEmail: toStr(j['supportEmail']),
        supportPhone: toStr(j['supportPhone']),
        websiteUrl: toStr(j['websiteUrl']),
        whatsappNumber: toStr(j['whatsappNumber']),
        address: toStr(j['address']),
        copyright: toStr(j['copyright']),
        socialLinks: toMap(j['socialLinks']).map((k, v) => MapEntry(k, toStr(v))),
      );
}

class OnboardingPage {
  final String title, description, imageUrl;
  const OnboardingPage(this.title, this.description, this.imageUrl);
}

class DeliverySlot {
  final String id, label, start, end;
  final bool enabled;
  const DeliverySlot(this.id, this.label, this.start, this.end, this.enabled);
  factory DeliverySlot.fromJson(Map<String, dynamic> j) =>
      DeliverySlot(toStr(j['id']), toStr(j['label']), toStr(j['start']), toStr(j['end']), toBool(j['enabled'], true));
}

class BusinessRules {
  final Map<String, dynamic> raw;
  BusinessRules(this.raw);

  String get currencySymbol => toStr(raw['currencySymbol']);
  String get currencyCode => toStr(raw['currencyCode']);
  double get commissionPercent => toDouble(raw['commissionPercent']);
  Map<String, dynamic> get deliveryFee => toMap(raw['deliveryFee']);
  Map<String, dynamic> get deliveryPartnerPayout => toMap(raw['deliveryPartnerPayout']);
  double get freeDeliveryAbove => toDouble(deliveryFee['freeAbove']);
  double get taxPercent => toDouble(raw['taxPercent']);
  String get taxLabel => toStr(raw['taxLabel']);
  double get packagingFee => toDouble(raw['packagingFee']);
  double get minOrderValue => toDouble(raw['minOrderValue']);
  double get maxTipPercent => toDouble(raw['maxTipPercent']);
  List<double> get tipPresets => toList(raw['tipPresets']).map((e) => toDouble(e)).toList();
  bool get surgeEnabled => toBool(toMap(raw['surgePricing'])['enabled']);
  double get surgeMultiplier => toDouble(toMap(raw['surgePricing'])['multiplier'], 1);
  String get surgeReason => toStr(toMap(raw['surgePricing'])['reason']);
  double get radiusKm => toDouble(raw['radiusKm']);
  int get cancellationWindowMinutes => toInt(raw['cancellationWindowMinutes']);
  double get cancellationPenaltyPercent => toDouble(raw['cancellationPenaltyPercent']);
  double get referralBonus => toDouble(raw['referralBonus']);
  double get refereeBonus => toDouble(raw['refereeBonus']);
  double get walletMaxUsePercent => toDouble(raw['walletMaxUsePercent']);
  bool get otpLogin => toBool(raw['otpLogin'], true);
  int get otpLength => toInt(raw['otpLength'], 6);
  double get codMaxAmount => toDouble(raw['codMaxAmount']);
  List<DeliverySlot> get deliverySlots => toList(raw['deliverySlots']).map((e) => DeliverySlot.fromJson(toMap(e))).where((s) => s.enabled).toList();
  Map<String, bool> get paymentMethods => toMap(raw['paymentMethods']).map((k, v) => MapEntry(k, toBool(v)));
  List<String> get enabledPaymentMethods => paymentMethods.entries.where((e) => e.value).map((e) => e.key).toList();
}

class MaintenanceConfig {
  final bool active;
  final String message, imageUrl;
  final List<String> affectedApps;
  const MaintenanceConfig(this.active, this.message, this.imageUrl, this.affectedApps);
  factory MaintenanceConfig.fromJson(Map<String, dynamic> j) => MaintenanceConfig(
        toBool(j['appInMaintenance']),
        toStr(j['maintenanceMessage']),
        toStr(j['maintenanceImageUrl']),
        toList(j['affectedApps']).map((e) => e.toString()).toList(),
      );
  bool affects(String app) => active && (affectedApps.isEmpty || affectedApps.contains(app));
}

class LanguageMeta {
  final String code, name, nativeName;
  final bool isRTL;
  const LanguageMeta(this.code, this.name, this.nativeName, this.isRTL);
}

class AppVersionInfo {
  final String minVersion, latestVersion, storeUrlAndroid, storeUrlIos;
  final bool forceUpdate;
  const AppVersionInfo(this.minVersion, this.latestVersion, this.forceUpdate, this.storeUrlAndroid, this.storeUrlIos);
  factory AppVersionInfo.fromJson(Map<String, dynamic> j) => AppVersionInfo(
      toStr(j['minVersion'], '0.0.0'), toStr(j['latestVersion'], '0.0.0'), toBool(j['forceUpdate']), toStr(j['storeUrlAndroid']), toStr(j['storeUrlIos']));
}

/// The full runtime configuration returned by GET /api/config.
class AppConfig {
  final int version;
  final ThemeConfig theme;
  final BrandingConfig branding;
  final bool onboardingEnabled;
  final List<OnboardingPage> onboardingPages;
  final List<WidgetSection> homeLayout;
  final Map<String, bool> features;
  final BusinessRules businessRules;
  final Map<String, String> legal;
  final List<String> languages;
  final String defaultLanguage;
  final List<LanguageMeta> languageMeta;
  final MaintenanceConfig maintenance;
  final List<BannerModel> banners;
  final List<CategoryModel> categories;
  final List<CategoryModel> cuisines;
  final Map<String, AppVersionInfo> appVersions;
  final String paymentProvider;
  final String paymentPublicKey;

  const AppConfig({
    required this.version,
    required this.theme,
    required this.branding,
    required this.onboardingEnabled,
    required this.onboardingPages,
    required this.homeLayout,
    required this.features,
    required this.businessRules,
    required this.legal,
    required this.languages,
    required this.defaultLanguage,
    required this.languageMeta,
    required this.maintenance,
    required this.banners,
    required this.categories,
    required this.cuisines,
    required this.appVersions,
    required this.paymentProvider,
    required this.paymentPublicKey,
  });

  bool feature(String key) => features[key] ?? false;

  List<WidgetSection> get enabledSections {
    final list = homeLayout.where((s) => s.enabled).toList();
    list.sort((a, b) => a.order.compareTo(b.order));
    return list;
  }

  factory AppConfig.fromJson(Map<String, dynamic> j) {
    final onboarding = toMap(j['onboarding']);
    final pages = toList(onboarding['pages']).map((e) => toMap(e)).toList()..sort((a, b) => toInt(a['order']).compareTo(toInt(b['order'])));
    final payment = toMap(j['payment']);
    return AppConfig(
      version: toInt(j['version']),
      theme: ThemeConfig.fromJson(toMap(j['theme'])),
      branding: BrandingConfig.fromJson(toMap(j['branding'])),
      onboardingEnabled: toBool(onboarding['enabled'], true),
      onboardingPages: pages.map((p) => OnboardingPage(toStr(p['title']), toStr(p['description']), toStr(p['imageUrl']))).toList(),
      homeLayout: toList(j['homeLayout']).map((e) => WidgetSection.fromJson(toMap(e))).toList(),
      features: toMap(j['features']).map((k, v) => MapEntry(k, toBool(v))),
      businessRules: BusinessRules(toMap(j['businessRules'])),
      legal: toMap(j['legal']).map((k, v) => MapEntry(k, toStr(v))),
      languages: toList(j['languages']).map((e) => e.toString()).toList(),
      defaultLanguage: toStr(j['defaultLanguage'], 'en'),
      languageMeta: toList(j['languageMeta'])
          .map((e) => toMap(e))
          .map((m) => LanguageMeta(toStr(m['code']), toStr(m['name']), toStr(m['nativeName']), toBool(m['isRTL'])))
          .toList(),
      maintenance: MaintenanceConfig.fromJson(toMap(j['maintenance'])),
      banners: toList(j['banners']).map((e) => BannerModel.fromJson(toMap(e))).toList(),
      categories: toList(j['categories']).map((e) => CategoryModel.fromJson(toMap(e))).toList(),
      cuisines: toList(j['cuisines']).map((e) => CategoryModel.fromJson(toMap(e))).toList(),
      appVersions: toMap(j['appVersions']).map((k, v) => MapEntry(k, AppVersionInfo.fromJson(toMap(v)))),
      paymentProvider: toStr(payment['provider']),
      paymentPublicKey: toStr(payment['publicKey']),
    );
  }

  static AppConfig empty() => AppConfig.fromJson(const {});
}
