import 'json_utils.dart';

class Address {
  final String id;
  final String label;
  final String fullAddress;
  final String landmark;
  final String city;
  final String state;
  final String pincode;
  final String contactName;
  final String contactPhone;
  final double? lat;
  final double? lng;
  final bool isDefault;

  const Address({
    this.id = '',
    this.label = '',
    required this.fullAddress,
    this.landmark = '',
    this.city = '',
    this.state = '',
    this.pincode = '',
    this.contactName = '',
    this.contactPhone = '',
    this.lat,
    this.lng,
    this.isDefault = false,
  });

  factory Address.fromJson(Map<String, dynamic> j) {
    final coords = toList(toMap(j['location'])['coordinates']);
    return Address(
      id: toStr(j['_id']),
      label: toStr(j['label']),
      fullAddress: toStr(j['fullAddress']),
      landmark: toStr(j['landmark']),
      city: toStr(j['city']),
      state: toStr(j['state']),
      pincode: toStr(j['pincode']),
      contactName: toStr(j['contactName']),
      contactPhone: toStr(j['contactPhone']),
      lng: coords.length == 2 ? toDouble(coords[0]) : null,
      lat: coords.length == 2 ? toDouble(coords[1]) : null,
      isDefault: toBool(j['isDefault']),
    );
  }

  Map<String, dynamic> toJson() => {
        'label': label,
        'fullAddress': fullAddress,
        'landmark': landmark,
        'city': city,
        'state': state,
        'pincode': pincode,
        'contactName': contactName,
        'contactPhone': contactPhone,
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        'isDefault': isDefault,
      };
}
