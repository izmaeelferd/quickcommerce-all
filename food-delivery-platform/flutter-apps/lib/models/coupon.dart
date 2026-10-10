import 'json_utils.dart';

class Coupon {
  final String id;
  final String code;
  final String title;
  final String description;
  final String discountType;
  final double value;
  final double? maxDiscount;
  final double minOrderValue;
  final String bannerImage;
  final String restaurantName;
  final DateTime? validTo;

  const Coupon({
    required this.id,
    required this.code,
    required this.title,
    required this.description,
    required this.discountType,
    required this.value,
    required this.maxDiscount,
    required this.minOrderValue,
    required this.bannerImage,
    required this.restaurantName,
    required this.validTo,
  });

  factory Coupon.fromJson(Map<String, dynamic> j) => Coupon(
        id: toStr(j['_id']),
        code: toStr(j['code']),
        title: toStr(j['title']),
        description: toStr(j['description']),
        discountType: toStr(j['discountType'], 'percent'),
        value: toDouble(j['value']),
        maxDiscount: j['maxDiscount'] == null ? null : toDouble(j['maxDiscount']),
        minOrderValue: toDouble(j['minOrderValue']),
        bannerImage: toStr(j['bannerImage']),
        restaurantName: j['restaurant'] is Map ? toStr(j['restaurant']['name']) : '',
        validTo: toDate(j['validTo']),
      );
}
