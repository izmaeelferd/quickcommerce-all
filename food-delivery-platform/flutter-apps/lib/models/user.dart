import 'address.dart';
import 'json_utils.dart';

class User {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String avatar;
  final double walletBalance;
  final String referralCode;
  final String language;
  final List<Address> addresses;
  final List<String> favorites;
  final Map<String, bool> notificationPrefs;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.avatar,
    required this.walletBalance,
    required this.referralCode,
    required this.language,
    required this.addresses,
    required this.favorites,
    required this.notificationPrefs,
  });

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: toStr(j['_id']),
        name: toStr(j['name']),
        email: toStr(j['email']),
        phone: toStr(j['phone']),
        role: toStr(j['role']),
        avatar: toStr(j['avatar']),
        walletBalance: toDouble(j['walletBalance']),
        referralCode: toStr(j['referralCode']),
        language: toStr(j['language']),
        addresses: toList(j['addresses']).map((e) => Address.fromJson(toMap(e))).toList(),
        favorites: toList(j['favorites']).map(idOf).toList(),
        notificationPrefs: toMap(j['notificationPrefs']).map((k, v) => MapEntry(k, toBool(v, true))),
      );

  Address? get defaultAddress {
    if (addresses.isEmpty) return null;
    return addresses.firstWhere((a) => a.isDefault, orElse: () => addresses.first);
  }
}
