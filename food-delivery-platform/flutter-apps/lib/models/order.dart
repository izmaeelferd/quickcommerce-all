import 'json_utils.dart';

class OrderItem {
  final String menuItemId;
  final String name;
  final String image;
  final bool isVeg;
  final double unitPrice;
  final int quantity;
  final List<String> addOns;
  final double lineTotal;
  const OrderItem(this.menuItemId, this.name, this.image, this.isVeg, this.unitPrice, this.quantity, this.addOns, this.lineTotal);
  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        idOf(j['menuItem']),
        toStr(j['name']),
        toStr(j['image']),
        toBool(j['isVeg'], true),
        toDouble(j['unitPrice']),
        toInt(j['quantity'], 1),
        toList(j['addOns']).map((a) => toStr(toMap(a)['name'])).toList(),
        toDouble(j['lineTotal']),
      );
}

class StatusEvent {
  final String status;
  final DateTime? at;
  final String note;
  const StatusEvent(this.status, this.at, this.note);
}

class Bill {
  final Map<String, dynamic> raw;
  const Bill(this.raw);
  double get subtotal => toDouble(raw['subtotal']);
  double get deliveryFee => toDouble(raw['deliveryFee']);
  double get surgeFee => toDouble(raw['surgeFee']);
  double get packagingFee => toDouble(raw['packagingFee']);
  double get platformFee => toDouble(raw['platformFee']);
  double get tax => toDouble(raw['tax']);
  double get tip => toDouble(raw['tip']);
  double get discount => toDouble(raw['discount']);
  double get walletUsed => toDouble(raw['walletUsed']);
  double get total => toDouble(raw['total']);
  double get payable => toDouble(raw['payable']);
}

class PartyInfo {
  final String id, name, phone, avatar, logo, address;
  final double? lat, lng;
  const PartyInfo(this.id, this.name, this.phone, this.avatar, this.logo, this.address, this.lat, this.lng);
  factory PartyInfo.fromJson(dynamic v) {
    final j = toMap(v);
    final coords = toList(toMap(j['location'])['coordinates']);
    return PartyInfo(
      idOf(v),
      toStr(j['name']),
      toStr(j['phone']),
      toStr(j['avatar']),
      toStr(j['logo']),
      toStr(toMap(j['address'])['fullAddress']),
      coords.length == 2 ? toDouble(coords[1]) : null,
      coords.length == 2 ? toDouble(coords[0]) : null,
    );
  }
}

class Order {
  final String id;
  final String orderNumber;
  final String status;
  final PartyInfo restaurant;
  final PartyInfo customer;
  final PartyInfo? deliveryPartner;
  final List<OrderItem> items;
  final Map<String, dynamic> deliveryAddress;
  final Bill bill;
  final String paymentMethod;
  final String paymentStatus;
  final List<StatusEvent> history;
  final DateTime? createdAt;
  final DateTime? estimatedDeliveryAt;
  final DateTime? scheduledFor;
  final String deliveryOtp;
  final double distanceKm;
  final double vendorEarning;
  final double deliveryEarning;
  final double commissionAmount;
  final double commissionPercent;
  final bool isRated;
  final bool canCancel;
  final String couponCode;
  final String instructions;
  final String cancelReason;

  const Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.restaurant,
    required this.customer,
    required this.deliveryPartner,
    required this.items,
    required this.deliveryAddress,
    required this.bill,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.history,
    required this.createdAt,
    required this.estimatedDeliveryAt,
    required this.scheduledFor,
    required this.deliveryOtp,
    required this.distanceKm,
    required this.vendorEarning,
    required this.deliveryEarning,
    required this.commissionAmount,
    required this.commissionPercent,
    required this.isRated,
    required this.canCancel,
    required this.couponCode,
    required this.instructions,
    required this.cancelReason,
  });

  bool get isActive => const ['placed', 'accepted', 'preparing', 'ready', 'picked'].contains(status);
  double? get dropLat {
    final c = toList(toMap(deliveryAddress['location'])['coordinates']);
    return c.length == 2 ? toDouble(c[1]) : null;
  }

  double? get dropLng {
    final c = toList(toMap(deliveryAddress['location'])['coordinates']);
    return c.length == 2 ? toDouble(c[0]) : null;
  }

  factory Order.fromJson(Map<String, dynamic> j) {
    final pay = toMap(j['payment']);
    final dp = j['deliveryPartner'];
    return Order(
      id: toStr(j['_id']),
      orderNumber: toStr(j['orderNumber']),
      status: toStr(j['status']),
      restaurant: PartyInfo.fromJson(j['restaurant']),
      customer: PartyInfo.fromJson(j['customer']),
      deliveryPartner: dp == null ? null : PartyInfo.fromJson(dp),
      items: toList(j['items']).map((e) => OrderItem.fromJson(toMap(e))).toList(),
      deliveryAddress: toMap(j['deliveryAddress']),
      bill: Bill(toMap(j['pricing'])),
      paymentMethod: toStr(pay['method']),
      paymentStatus: toStr(pay['status']),
      history: toList(j['statusHistory']).map((e) {
        final m = toMap(e);
        return StatusEvent(toStr(m['status']), toDate(m['at']), toStr(m['note']));
      }).toList(),
      createdAt: toDate(j['createdAt']),
      estimatedDeliveryAt: toDate(j['estimatedDeliveryAt']),
      scheduledFor: toDate(j['scheduledFor']),
      deliveryOtp: toStr(j['deliveryOtp']),
      distanceKm: toDouble(j['distanceKm']),
      vendorEarning: toDouble(j['vendorEarning']),
      deliveryEarning: toDouble(j['deliveryEarning']),
      commissionAmount: toDouble(toMap(j['commission'])['amount']),
      commissionPercent: toDouble(toMap(j['commission'])['percent']),
      isRated: toBool(j['isRated']),
      canCancel: toBool(j['canCancel']),
      couponCode: toStr(toMap(j['coupon'])['code']),
      instructions: toStr(j['instructions']),
      cancelReason: toStr(j['cancelReason']),
    );
  }
}
