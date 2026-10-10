/// Build-time environment. Everything here comes from `--dart-define`,
/// never from source: `flutter run --flavor customer -t lib/main_customer.dart
/// --dart-define=API_BASE_URL=https://api.example.com`.
enum AppFlavor { customer, vendor, delivery }

class Env {
  static const String apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:5000');
  static const String apiPrefix = String.fromEnvironment('API_PREFIX', defaultValue: '/api');
  static const String googleMapsKey = String.fromEnvironment('GOOGLE_MAPS_KEY', defaultValue: '');
  static const String googleServerClientId = String.fromEnvironment('GOOGLE_SERVER_CLIENT_ID', defaultValue: '');
  static const String flavorName = String.fromEnvironment('FLAVOR', defaultValue: 'customer');

  static AppFlavor flavor = _parse(flavorName);

  static AppFlavor _parse(String v) {
    switch (v) {
      case 'vendor':
        return AppFlavor.vendor;
      case 'delivery':
        return AppFlavor.delivery;
      default:
        return AppFlavor.customer;
    }
  }

  static String get apiUrl => '$apiBaseUrl$apiPrefix';

  /// Role expected by the backend for this flavor.
  static String get role => flavor.name;

  /// Header value used by the backend maintenance guard.
  static String get appType => flavor.name;
}
