import 'coupon.dart';
import 'json_utils.dart';

class Timing {
  final int day;
  final String open;
  final String close;
  final bool closed;
  const Timing(this.day, this.open, this.close, this.closed);
  factory Timing.fromJson(Map<String, dynamic> j) => Timing(toInt(j['day']), toStr(j['open'], '09:00'), toStr(j['close'], '23:00'), toBool(j['closed']));
  Map<String, dynamic> toJson() => {'day': day, 'open': open, 'close': close, 'closed': closed};
  Timing copyWith({String? open, String? close, bool? closed}) => Timing(day, open ?? this.open, close ?? this.close, closed ?? this.closed);
}

class Restaurant {
  final String id;
  final String name;
  final String slug;
  final String description;
  final String logo;
  final String coverImage;
  final List<String> cuisines;
  final String phone;
  final String fullAddress;
  final double? lat;
  final double? lng;
  final bool isPureVeg;
  final double priceForTwo;
  final int avgPrepTimeMinutes;
  final double rating;
  final int ratingCount;
  final String status;
  final bool isOpen;
  final bool isOpenNow;
  final bool acceptingOrders;
  final String offerText;
  final bool isFeatured;
  final double? distanceKm;
  final List<Timing> timings;
  final List<Coupon> offers;
  final bool isFavorite;
  final double walletBalance;
  final double? commissionPercent;

  const Restaurant({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.logo,
    required this.coverImage,
    required this.cuisines,
    required this.phone,
    required this.fullAddress,
    required this.lat,
    required this.lng,
    required this.isPureVeg,
    required this.priceForTwo,
    required this.avgPrepTimeMinutes,
    required this.rating,
    required this.ratingCount,
    required this.status,
    required this.isOpen,
    required this.isOpenNow,
    required this.acceptingOrders,
    required this.offerText,
    required this.isFeatured,
    required this.distanceKm,
    required this.timings,
    required this.offers,
    required this.isFavorite,
    required this.walletBalance,
    required this.commissionPercent,
  });

  factory Restaurant.fromJson(Map<String, dynamic> j) {
    final coords = toList(toMap(j['location'])['coordinates']);
    return Restaurant(
      id: toStr(j['_id']),
      name: toStr(j['name']),
      slug: toStr(j['slug']),
      description: toStr(j['description']),
      logo: toStr(j['logo']),
      coverImage: toStr(j['coverImage']),
      cuisines: toList(j['cuisines']).map((e) => e.toString()).toList(),
      phone: toStr(j['phone']),
      fullAddress: toStr(toMap(j['address'])['fullAddress']),
      lng: coords.length == 2 ? toDouble(coords[0]) : null,
      lat: coords.length == 2 ? toDouble(coords[1]) : null,
      isPureVeg: toBool(j['isPureVeg']),
      priceForTwo: toDouble(j['priceForTwo']),
      avgPrepTimeMinutes: toInt(j['avgPrepTimeMinutes']),
      rating: toDouble(j['rating']),
      ratingCount: toInt(j['ratingCount']),
      status: toStr(j['status']),
      isOpen: toBool(j['isOpen'], true),
      isOpenNow: toBool(j['isOpenNow'], toBool(j['isOpen'], true)),
      acceptingOrders: toBool(j['acceptingOrders'], true),
      offerText: toStr(j['offerText']),
      isFeatured: toBool(j['isFeatured']),
      distanceKm: j['distanceKm'] == null ? null : toDouble(j['distanceKm']),
      timings: toList(j['timings']).map((e) => Timing.fromJson(toMap(e))).toList(),
      offers: toList(j['offers']).map((e) => Coupon.fromJson(toMap(e))).toList(),
      isFavorite: toBool(j['isFavorite']),
      walletBalance: toDouble(j['walletBalance']),
      commissionPercent: j['commissionPercent'] == null ? null : toDouble(j['commissionPercent']),
    );
  }
}
